import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();

// Import controller functions
import { getAll, create, update, deleteMovement } from '../controllers/inventoryController.js';

router.get('/', authMiddleware, getAll);
router.post('/', authMiddleware, create);
router.put('/:id', authMiddleware, update);
router.delete('/:id', authMiddleware, deleteMovement);

export default router;
