import { Router } from 'express';
import { getNotifications, markAllAsRead } from '../controllers/notificationController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', getNotifications);
router.post('/read-all', markAllAsRead);

export default router;
