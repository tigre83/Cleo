import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
interface AdminAuthPayload { email: string; role: string; iat?: number; exp?: number; }

export interface AdminRequest extends Request {
  admin?: AdminAuthPayload;
}

export function adminAuthMiddleware(req: AdminRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AdminAuthPayload;
    const validRoles = ['admin', 'owner', 'soporte'];
    if (!validRoles.includes(decoded.role)) {
      res.status(403).json({ error: 'Acceso denegado' });
      return;
    }
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}
