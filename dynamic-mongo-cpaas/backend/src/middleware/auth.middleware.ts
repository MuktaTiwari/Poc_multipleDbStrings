import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';

/**
 * Gates every dynamic-database route behind a valid access token.
 * Production TODO: this only proves "some authenticated user" made the request -
 * a real deployment needs tenant-scoped authorization here too (which tenant's
 * connections/collections this user is allowed to touch), not just "is logged in".
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header' },
    });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Access token is invalid or expired' },
    });
  }
};
