import { Request, Response, NextFunction } from 'express';

export function deleteAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.DELETE_AUTH_TOKEN;
  const header = req.headers['x_delete_auth'];

  if (!header) {
    res.status(401).json({ error: 'x_delete_auth header is required' });
    return;
  }
  if (header !== secret) {
    res.status(403).json({ error: 'Invalid x_delete_auth token' });
    return;
  }
  next();
}
