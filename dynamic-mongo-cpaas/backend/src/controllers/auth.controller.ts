import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import * as UserRepository from '../repositories/user.repository';
import {
  comparePassword,
  hashPassword,
  issueTokenPair,
  revokeRefreshToken,
  rotateRefreshToken,
  RefreshTokenReuseError,
} from '../services/auth.service';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/auth';

const setRefreshCookie = (res: Response, token: string, expiresAt: Date) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt,
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: REFRESH_COOKIE_PATH,
  });
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates a new user account.
 * Flow: UI (Register form) -> POST /api/auth/register -> hash password, store user, issue tokens -> UI
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== 'string' || typeof password !== 'string' || !EMAIL_RE.test(email) || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'A valid email and a password of at least 8 characters are required' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserRepository.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' },
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await UserRepository.insertUser(normalizedEmail, passwordHash);
    const { accessToken, refreshToken, refreshTokenExpiresAt } = await issueTokenPair(user);

    setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
    res.status(201).json({ success: true, accessToken, user });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' },
      });
    }
    next(error);
  }
};

/**
 * Verifies credentials and issues a fresh access/refresh token pair.
 * Flow: UI (Login form) -> POST /api/auth/login -> compare password hash, issue tokens -> UI
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email and password are required' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRecord = await UserRepository.findByEmail(normalizedEmail);
    const genericError = {
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password' },
    };

    if (!userRecord) {
      return res.status(401).json(genericError);
    }

    const validPassword = await comparePassword(password, userRecord.passwordHash);
    if (!validPassword) {
      return res.status(401).json(genericError);
    }

    const user = UserRepository.toPublicUser(userRecord);
    const { accessToken, refreshToken, refreshTokenExpiresAt } = await issueTokenPair(user);

    setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
    res.json({ success: true, accessToken, user });
  } catch (error) {
    next(error);
  }
};

/**
 * Rotates the refresh token (read from the httpOnly cookie) and issues a new access token.
 * Flow: UI (silent bootstrap / 401 retry) -> POST /api/auth/refresh -> verify + rotate -> UI
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const presentedToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!presentedToken) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token present' },
      });
    }

    const { accessToken, refreshToken, refreshTokenExpiresAt } = await rotateRefreshToken(presentedToken);
    setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
    res.json({ success: true, accessToken });
  } catch (error) {
    clearRefreshCookie(res);
    if (error instanceof RefreshTokenReuseError) {
      return res.status(401).json({
        success: false,
        error: { code: 'SESSION_REVOKED', message: 'Session revoked - please log in again' },
      });
    }
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid or expired' },
    });
  }
};

/**
 * Revokes the current refresh token and clears the cookie.
 * Flow: UI (Logout button) -> POST /api/auth/logout -> revoke stored token hash -> UI
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const presentedToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (presentedToken) {
      await revokeRefreshToken(presentedToken);
    }
    clearRefreshCookie(res);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns the currently authenticated user (requires a valid access token).
 * Flow: UI (app load) -> GET /api/auth/me -> read req.user set by requireAuth -> UI
 */
export const me = async (req: Request, res: Response) => {
  res.json({ success: true, user: req.user });
};
