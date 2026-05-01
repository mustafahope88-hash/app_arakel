import { Router } from 'express';
import { auditController } from '../controllers/auditController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, roleMiddleware('admin'), auditController.getLogs);

export default router;