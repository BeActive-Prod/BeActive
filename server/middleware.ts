import { Request, Response, NextFunction } from 'express';
import { extractToken, verifyToken, TokenPayload } from './auth';
import db from './db';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Check database for current admin status instead of trusting JWT
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.user.userId) as any;
  
  if (!user || user.is_admin !== 1) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next()
}
