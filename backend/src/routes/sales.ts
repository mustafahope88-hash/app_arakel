import { Router } from 'express';
import { saleController } from '../controllers/saleController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, roleMiddleware('admin', 'cashier'), saleController.createSale);
router.post('/:id/cancel', authMiddleware, roleMiddleware('admin'), saleController.cancelSale);

export default router;