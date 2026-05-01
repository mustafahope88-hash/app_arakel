import { Router } from 'express';
import { settingsController } from '../controllers/settingsController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', settingsController.get);
router.put('/', authMiddleware, roleMiddleware('admin'), settingsController.update);

export default router;