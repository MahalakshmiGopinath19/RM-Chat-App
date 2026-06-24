import { Response } from 'express';
import Announcement from '../models/Announcement';
import Team from '../models/Team';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';
import Notification from '../models/Notification';
import User from '../models/User';

// Fetch announcements available to the current user
export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Find all teams this user is a member of
    const userTeams = await Team.find({ members: req.user._id });
    const teamIds = userTeams.map(t => t._id);

    // Build matching query
    // Show company-wide OR user's department OR user's teams
    const query: any = {
      $or: [
        { audienceType: 'company' },
        { audienceType: 'department', audienceId: req.user.department }
      ]
    };

    if (teamIds.length > 0) {
      query.$or.push({ audienceType: 'team', audienceId: { $in: teamIds } });
    }

    // Filter by publishDate <= now
    const now = new Date();
    query.publishDate = { $lte: now };

    // Filter by expiryDate > now OR null
    query.$and = [
      {
        $or: [
          { expiryDate: null },
          { expiryDate: { $gt: now } }
        ]
      }
    ];

    const announcements = await Announcement.find(query)
      .populate('sender', 'name email')
      .populate('audienceId') // Populates either Department or Team
      .sort({ publishDate: -1 });

    res.status(200).json(announcements);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Admin: Create announcement
export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, priority, audienceType, audienceId, publishDate, expiryDate } = req.body;

    if (!title || !content || !audienceType) {
      res.status(400).json({ message: 'Title, content and audienceType are required.' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const announcement = new Announcement({
      title,
      content,
      priority: priority || 'normal',
      audienceType,
      audienceId: audienceId || null,
      sender: req.user._id,
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null
    });

    await announcement.save();

    // Find target audience users
    let targetUsers: any[] = [];
    if (audienceType === 'company') {
      targetUsers = await User.find({ _id: { $ne: req.user._id } });
    } else if (audienceType === 'department') {
      targetUsers = await User.find({ department: audienceId, _id: { $ne: req.user._id } });
    } else if (audienceType === 'team') {
      const team = await Team.findById(audienceId);
      if (team) {
        const targetUserIds = team.members.filter((m: any) => m.toString() !== req.user?._id.toString());
        targetUsers = await User.find({ _id: { $in: targetUserIds } });
      }
    }

    // Save notifications and emit via Socket.io
    const io = req.app.get('socketio');
    if (io && targetUsers.length > 0) {
      await Promise.all(
        targetUsers.map(async (u) => {
          const notification = new Notification({
            recipient: u._id,
            type: 'announcement',
            content: `New announcement posted: "${title}"`,
            referenceId: announcement._id
          });
          await notification.save();
          io.to(`user_${u._id}`).emit('notification', notification);
        })
      );
    }

    await logAudit(
      'ANNOUNCEMENT_CREATE',
      req.user._id,
      `Created announcement: "${title}" for audience: ${audienceType}`,
      req
    );

    res.status(201).json(announcement);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Admin: Edit announcement
export const editAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, priority, audienceType, audienceId, publishDate, expiryDate } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      res.status(404).json({ message: 'Announcement not found.' });
      return;
    }

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (priority) announcement.priority = priority;
    if (audienceType) announcement.audienceType = audienceType;
    if (audienceId !== undefined) announcement.audienceId = audienceId || undefined;
    if (publishDate) announcement.publishDate = new Date(publishDate);
    if (expiryDate !== undefined) announcement.expiryDate = expiryDate ? new Date(expiryDate) : undefined;

    await announcement.save();

    await logAudit(
      'ANNOUNCEMENT_UPDATE',
      req.user?._id || null,
      `Updated announcement ID: ${id} ("${announcement.title}")`,
      req
    );

    res.status(200).json(announcement);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Admin: Delete announcement
export const deleteAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      res.status(404).json({ message: 'Announcement not found.' });
      return;
    }

    await Announcement.findByIdAndDelete(id);

    await logAudit(
      'ANNOUNCEMENT_DELETE',
      req.user?._id || null,
      `Deleted announcement ID: ${id} ("${announcement.title}")`,
      req
    );

    res.status(200).json({ message: 'Announcement deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
