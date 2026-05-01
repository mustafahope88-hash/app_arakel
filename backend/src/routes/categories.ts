import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.post('/', authMiddleware, roleMiddleware('admin'), categoryController.create);
router.put('/:id', authMiddleware, roleMiddleware('admin'), categoryController.update);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), categoryController.delete);

export default router;