import { Router } from 'express';
import {
  getTeams,
  createTeam,
  addTeamMembers,
  removeTeamMember
} from '../controllers/teamController';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// Employee access
router.get('/', authenticateJWT, getTeams);

// Admin-only access (or managers, currently requiring admin role)
router.post('/', authenticateJWT, requireAdmin, createTeam);
router.post('/:id/members', authenticateJWT, requireAdmin, addTeamMembers);
router.delete('/:id/members/:userId', authenticateJWT, requireAdmin, removeTeamMember);

export default router;
