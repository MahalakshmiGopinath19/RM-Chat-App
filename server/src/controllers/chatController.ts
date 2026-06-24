import { Response } from 'express';
import Chat from '../models/Chat';
import Message from '../models/Message';
import Team from '../models/Team';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';


// Fetch all chats the user belongs to
export const getChats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Find all teams this user is a member of
    const userTeams = await Team.find({ members: req.user._id });
    const teamIds = userTeams.map(t => t._id);

    // Query chats matching user direct participation OR department OR team membership
    const orQuery: any[] = [
      { participants: req.user._id },
      { type: 'department', department: req.user.department }
    ];

    if (teamIds.length > 0) {
      orQuery.push({ type: 'team', team: { $in: teamIds } });
    }

    const chats = await Chat.find({ $or: orQuery })
      .populate('participants', 'name email employeeId avatar isOnline')
      .populate('department', 'name')
      .populate('team', 'name')
      .sort({ updatedAt: -1 });

    // For each chat, fetch the latest message and unread count
    const chatList = await Promise.all(
      chats.map(async chat => {
        const lastMessage = await Message.findOne({ chat: chat._id })
          .populate('sender', 'name')
          .sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: req.user!._id },
          'readBy.user': { $ne: req.user!._id }
        });

        return {
          ...chat.toObject(),
          lastMessage,
          unreadCount,
          isPinned: chat.pinnedBy.includes(req.user!._id),
          isStarred: chat.starredBy.includes(req.user!._id)
        };
      })
    );

    res.status(200).json(chatList);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Fetch messages for a specific chat
export const getChatMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404).json({ message: 'Chat not found.' });
      return;
    }

    // Access control check: Check if user has permission to read messages in this chat
    let hasAccess = false;
    if (req.user.role === 'admin') {
      hasAccess = true;
    } else if (chat.type === 'direct' || chat.type === 'group') {
      hasAccess = chat.participants.some(p => p.toString() === req.user!._id.toString());
    } else if (chat.type === 'department') {
      hasAccess = req.user.department?.toString() === chat.department?.toString();
    } else if (chat.type === 'team') {
      const team = await Team.findById(chat.team);
      hasAccess = team ? team.members.some(m => m.toString() === req.user!._id.toString()) : false;
    }

    if (!hasAccess) {
      res.status(403).json({ message: 'You do not have access to this chat.' });
      return;
    }

    // Fetch messages (exclude thread replies, which will be loaded via a separate thread endpoint)
    const messages = await Message.find({ chat: chatId, parentMessageId: null })
      .populate('sender', 'name email employeeId avatar')
      .populate('attachments')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Create a direct chat
export const createDirectChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { recipientId } = req.body;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!recipientId) {
      res.status(400).json({ message: 'Recipient ID is required.' });
      return;
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      res.status(404).json({ message: 'Recipient not found.' });
      return;
    }

    // Check if a DM between these two users already exists
    let chat = await Chat.findOne({
      type: 'direct',
      participants: { $all: [req.user._id, recipientId], $size: 2 }
    }).populate('participants', 'name email employeeId avatar isOnline');

    if (!chat) {
      chat = new Chat({
        type: 'direct',
        participants: [req.user._id, recipientId]
      });
      await chat.save();
      chat = await Chat.findById(chat._id).populate('participants', 'name email employeeId avatar isOnline');
    }

    res.status(200).json(chat);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Create a group chat
export const createGroupChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, participantIds } = req.body;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!name || !participantIds || !Array.isArray(participantIds)) {
      res.status(400).json({ message: 'Group name and participants list are required.' });
      return;
    }

    // Ensure current user is in participants list
    const participants = Array.from(new Set([...participantIds, req.user._id.toString()]));

    const chat = new Chat({
      type: 'group',
      name,
      participants
    });
    await chat.save();

    const populatedChat = await Chat.findById(chat._id).populate('participants', 'name email employeeId avatar isOnline');
    res.status(201).json(populatedChat);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Toggle Pin Chat
export const togglePinChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404).json({ message: 'Chat not found.' });
      return;
    }

    const userIdStr = req.user._id.toString();
    const pinIndex = chat.pinnedBy.findIndex(id => id.toString() === userIdStr);

    if (pinIndex > -1) {
      chat.pinnedBy.splice(pinIndex, 1);
    } else {
      chat.pinnedBy.push(req.user._id);
    }

    await chat.save();
    res.status(200).json({ message: 'Pin toggled successfully.', isPinned: pinIndex === -1 });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Toggle Star Chat
export const toggleStarChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404).json({ message: 'Chat not found.' });
      return;
    }

    const userIdStr = req.user._id.toString();
    const starIndex = chat.starredBy.findIndex(id => id.toString() === userIdStr);

    if (starIndex > -1) {
      chat.starredBy.splice(starIndex, 1);
    } else {
      chat.starredBy.push(req.user._id);
    }

    await chat.save();
    res.status(200).json({ message: 'Star toggled successfully.', isStarred: starIndex === -1 });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
