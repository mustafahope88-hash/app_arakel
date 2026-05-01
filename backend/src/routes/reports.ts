import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard-summary', authMiddleware, reportController.dashboardSummary);
router.get('/daily', authMiddleware, reportController.daily);
router.get('/monthly', authMiddleware, reportController.monthly);
router.get('/top-products', authMiddleware, reportController.topProducts);
router.get('/low-stock', authMiddleware, reportController.lowStock);
router.get('/daily/export', authMiddleware, reportController.exportDaily);
router.get('/monthly/export', authMiddleware, reportController.exportMonthly);

export default router;