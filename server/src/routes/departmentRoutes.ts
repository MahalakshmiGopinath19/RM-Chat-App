import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  assignDepartmentHead,
  deleteDepartment
} from '../controllers/departmentController';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// Employee access
router.get('/', authenticateJWT, getDepartments);

// Admin-only access
router.post('/', authenticateJWT, requireAdmin, createDepartment);
router.put('/:id', authenticateJWT, requireAdmin, updateDepartment);
router.delete('/:id', authenticateJWT, requireAdmin, deleteDepartment);
router.post('/:id/head', authenticateJWT, requireAdmin, assignDepartmentHead);

export default router;
