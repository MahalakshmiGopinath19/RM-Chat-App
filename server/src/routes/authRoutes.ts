import { Router } from 'express';
import { login, logout, changePassword, forgotPassword } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.post('/logout', authenticateJWT, logout);
router.post('/change-password', authenticateJWT, changePassword);

export default router;
