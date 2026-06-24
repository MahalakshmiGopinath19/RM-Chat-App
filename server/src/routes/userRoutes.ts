import { Router } from 'express';
import {
  getMe,
  updateProfile,
  getAllUsers,
  addEmployee,
  editEmployee,
  removeEmployee
} from '../controllers/userController';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// Employee access
router.get('/me', authenticateJWT, getMe);
router.put('/me', authenticateJWT, updateProfile);
router.get('/', authenticateJWT, getAllUsers);

// Admin-only access
router.post('/', authenticateJWT, requireAdmin, addEmployee);
router.put('/:id', authenticateJWT, requireAdmin, editEmployee);
router.delete('/:id', authenticateJWT, requireAdmin, removeEmployee);

export default router;
