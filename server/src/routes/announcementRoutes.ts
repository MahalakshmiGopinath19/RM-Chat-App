import { Router } from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  editAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// Employee access
router.get('/', authenticateJWT, getAnnouncements);

// Admin-only access
router.post('/', authenticateJWT, requireAdmin, createAnnouncement);
router.put('/:id', authenticateJWT, requireAdmin, editAnnouncement);
router.delete('/:id', authenticateJWT, requireAdmin, deleteAnnouncement);

export default router;
