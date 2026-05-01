import { Router } from 'express';
import { couponController } from '../controllers/couponController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', couponController.getAll);
router.get('/:id', couponController.getById);
router.post('/', authMiddleware, roleMiddleware('admin'), couponController.create);
router.put('/:id', authMiddleware, roleMiddleware('admin'), couponController.update);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), couponController.delete);
router.post('/validate', couponController.validate);

export default router;