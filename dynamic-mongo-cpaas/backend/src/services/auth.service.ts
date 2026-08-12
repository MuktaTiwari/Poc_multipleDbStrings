import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import { config } from '../config/env';
import * as RefreshTokenRepository from '../repositories/refreshToken.repository';
import * as UserRepository from '../repositories/user.repository';
import { PublicUser } from '../models/user.model';
import { RefreshTokenRecord } from '../models/refreshToken.model';

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export class RefreshTokenReuseError extends Error {
  constructor() {
    super('Refresh token reuse detected; all sessions revoked');
    this.name = 'RefreshTokenReuseError';
  }
}

const SALT_ROUNDS = 10;

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (password: string, hash: string): Promise<boolean> => bcrypt.compare(password, hash);

export const signAccessToken = (user: PublicUser): string =>
  jwt.sign({ sub: user.id, email: user.email }, config.jwtAccessSecret, {
    expiresIn: config.accessTokenTtl,
  } as jwt.SignOptions);

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, config.jwtAccessSecret) as AccessTokenPayload;

const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

// Two /refresh calls can legitimately race on the same token (two open tabs,
// a flaky-network retry, or React StrictMode double-invoking an effect in
// dev) - the loser presents a token the winner just rotated away. This window
// bounds how "recently lost the race" still counts as benign; it does NOT
// forgive replay of a token revoked for any other reason (logout, an actual
// reuse-detection sweep) - see rotatedToId in the model and followChain below.
const REUSE_GRACE_MS = 10_000;
const MAX_CHAIN_HOPS = 5;

const issueRefreshToken = async (userId: string): Promise<{ token: string; expiresAt: Date; id: ObjectId }> => {
  const jti = uuidv4();
  const token = jwt.sign({ sub: userId, jti }, config.jwtRefreshSecret, {
    expiresIn: `${config.refreshTokenTtlDays}d`,
  });

  const expiresAt = new Date(Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  const id = await RefreshTokenRepository.insert(userId, hashToken(token), expiresAt);

  return { token, expiresAt, id };
};

export const issueTokenPair = async (user: PublicUser): Promise<RefreshResult> => {
  const accessToken = signAccessToken(user);
  const { token: refreshToken, expiresAt: refreshTokenExpiresAt } = await issueRefreshToken(user.id);
  return { accessToken, refreshToken, refreshTokenExpiresAt };
};

/**
 * Walks a chain of rotation pointers to see whether `record` (already revoked)
 * lost a benign race against a concurrent request rather than being a genuine
 * replay. Only follows links created by rotation (`rotatedToId`), each hop
 * bounded by REUSE_GRACE_MS - a chain that goes anywhere else (revoked by
 * logout/reuse-sweep, expired, or too old) returns null.
 */
const followChainToValidLeaf = async (record: RefreshTokenRecord): Promise<RefreshTokenRecord | null> => {
  let current: RefreshTokenRecord | null = record;

  for (let hop = 0; hop < MAX_CHAIN_HOPS && current; hop++) {
    if (!current.revokedAt) {
      return current.expiresAt > new Date() ? current : null;
    }
    if (!current.rotatedToId || Date.now() - current.revokedAt.getTime() >= REUSE_GRACE_MS) {
      return null;
    }
    current = await RefreshTokenRepository.findById(current.rotatedToId);
  }

  return null;
};

/**
 * Verifies + rotates a refresh token. Detects reuse of an already-rotated/revoked
 * token (a sign the token was stolen) and revokes every session for that user -
 * unless the token was revoked *by rotation* moments ago and a concurrent
 * request just lost that race, in which case it's rotated again instead.
 */
export const rotateRefreshToken = async (presentedToken: string): Promise<RefreshResult> => {
  let payload: { sub: string; jti: string };
  try {
    payload = jwt.verify(presentedToken, config.jwtRefreshSecret) as { sub: string; jti: string };
  } catch {
    throw new Error('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(presentedToken);
  const record = await RefreshTokenRepository.findByHash(tokenHash);

  if (!record || record.expiresAt < new Date()) {
    await RefreshTokenRepository.revokeAllForUser(payload.sub);
    throw new RefreshTokenReuseError();
  }

  const leaf = record.revokedAt ? await followChainToValidLeaf(record) : record;
  if (!leaf) {
    await RefreshTokenRepository.revokeAllForUser(payload.sub);
    throw new RefreshTokenReuseError();
  }

  const user = await UserRepository.findById(payload.sub);
  if (!user) {
    await RefreshTokenRepository.revokeAllForUser(payload.sub);
    throw new Error('User for this refresh token no longer exists');
  }

  const accessToken = signAccessToken(user);
  const { token: refreshToken, expiresAt: refreshTokenExpiresAt, id: newId } = await issueRefreshToken(payload.sub);
  await RefreshTokenRepository.rotate(leaf._id, newId);

  return { accessToken, refreshToken, refreshTokenExpiresAt };
};

export const revokeRefreshToken = async (presentedToken: string): Promise<void> => {
  await RefreshTokenRepository.revokeByHash(hashToken(presentedToken));
};
