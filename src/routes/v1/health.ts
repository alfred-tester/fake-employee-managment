import { Router, Request, Response } from 'express';
import db from '../../db/connection';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    db.prepare('SELECT 1').get();
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1',
      database: 'ok',
    });
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      version: '1',
      database: 'unavailable',
    });
  }
});

export default router;
