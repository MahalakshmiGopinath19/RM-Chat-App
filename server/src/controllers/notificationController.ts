import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    await Notification.updateMany(
      { recipient: req.user._id, status: 'unread' },
      { status: 'read' }
    );

    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
