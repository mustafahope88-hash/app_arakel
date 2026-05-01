import { Router } from 'express';
import { productController } from '../controllers/ProductController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.get('/barcode/:barcode', productController.getByBarcode);
router.post('/', authMiddleware, roleMiddleware('admin'), productController.create);
router.put('/:id', authMiddleware, roleMiddleware('admin'), productController.update);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), productController.delete);

export default router;