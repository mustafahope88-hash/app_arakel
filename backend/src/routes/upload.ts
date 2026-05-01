import { Router } from 'express';
import { uploadController } from '../controllers/uploadController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/product-image', authMiddleware, roleMiddleware('admin'), uploadController.uploadProductImage);

export default router;