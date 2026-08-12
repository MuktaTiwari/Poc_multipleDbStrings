import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import * as RefreshTokenRepository from '../repositories/refreshToken.repository';
import * as UserRepository from '../repositories/user.repository';
import { PublicUser } from '../models/user.model';

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

const issueRefreshToken = async (userId: string): Promise<{ token: string; expiresAt: Date }> => {
  const jti = uuidv4();
  const token = jwt.sign({ sub: userId, jti }, config.jwtRefreshSecret, {
    expiresIn: `${config.refreshTokenTtlDays}d`,
  });

  const expiresAt = new Date(Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  await RefreshTokenRepository.insert(userId, hashToken(token), expiresAt);

  return { token, expiresAt };
};

export const issueTokenPair = async (user: PublicUser): Promise<RefreshResult> => {
  const accessToken = signAccessToken(user);
  const { token: refreshToken, expiresAt: refreshTokenExpiresAt } = await issueRefreshToken(user.id);
  return { accessToken, refreshToken, refreshTokenExpiresAt };
};

/**
 * Verifies + rotates a refresh token. Detects reuse of an already-rotated/revoked
 * token (a sign the token was stolen) and revokes every session for that user.
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

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    await RefreshTokenRepository.revokeAllForUser(payload.sub);
    throw new RefreshTokenReuseError();
  }

  await RefreshTokenRepository.revoke(record._id);

  const user = await UserRepository.findById(payload.sub);
  if (!user) {
    await RefreshTokenRepository.revokeAllForUser(payload.sub);
    throw new Error('User for this refresh token no longer exists');
  }

  const accessToken = signAccessToken(user);
  const { token: refreshToken, expiresAt: refreshTokenExpiresAt } = await issueRefreshToken(payload.sub);

  return { accessToken, refreshToken, refreshTokenExpiresAt };
};

export const revokeRefreshToken = async (presentedToken: string): Promise<void> => {
  await RefreshTokenRepository.revokeByHash(hashToken(presentedToken));
};
