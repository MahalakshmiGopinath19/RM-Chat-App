import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import departmentRoutes from './departmentRoutes';
import teamRoutes from './teamRoutes';
import chatRoutes from './chatRoutes';
import announcementRoutes from './announcementRoutes';
import fileRoutes from './fileRoutes';
import notificationRoutes from './notificationRoutes';
import adminRoutes from './adminRoutes';
import messageRoutes from './messageRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/teams', teamRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/announcements', announcementRoutes);
router.use('/files', fileRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
