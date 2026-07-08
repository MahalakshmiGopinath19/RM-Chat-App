import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Chat from '../models/Chat';
import Message from '../models/Message';
import Notification from '../models/Notification';
import Team from '../models/Team';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-company-key';

export const socketHandler = (io: Server) => {
  // Socket.io Handshake Authentication Middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error. Token required.'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = await User.findById(decoded.id);

      if (!user || user.status === 'blocked' || user.status === 'inactive') {
        return next(new Error('Authentication error. Account inactive or blocked.'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error. Invalid token.'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user;
    console.log(`[SOCKET] User connected: ${user.name} (${user.email})`);

    // Set user online status
    try {
      await User.findByIdAndUpdate(user._id, { isOnline: true, lastActive: new Date() });
      io.emit('user_status_change', { userId: user._id, isOnline: true });
    } catch (err) {
      console.error('Error updating user online status:', err);
    }

    // Join self room (for personal notifications/updates)
    socket.join(`user_${user._id}`);

    // Join chat room
    socket.on('join_chat', (chatId: string) => {
      socket.join(`chat_${chatId}`);
      console.log(`[SOCKET] User ${user.name} joined chat room: ${chatId}`);
    });

    // Leave chat room
    socket.on('leave_chat', (chatId: string) => {
      socket.leave(`chat_${chatId}`);
      console.log(`[SOCKET] User ${user.name} left chat room: ${chatId}`);
    });

    // Send Typing Indicator
    socket.on('typing', (chatId: string) => {
      socket.to(`chat_${chatId}`).emit('typing', { chatId, userId: user._id, userName: user.name });
    });

    // Stop Typing Indicator
    socket.on('stop_typing', (chatId: string) => {
      socket.to(`chat_${chatId}`).emit('stop_typing', { chatId, userId: user._id });
    });

    // New Message Event
    socket.on('send_message', async (data: { chatId: string; content: string; attachments?: string[]; parentMessageId?: string }) => {
      try {
        const { chatId, content, attachments, parentMessageId } = data;

        const chat = await Chat.findById(chatId);
        if (!chat) return;

        // Save Message in MongoDB
        const newMessage = new Message({
          chat: chatId,
          sender: user._id,
          content,
          attachments: attachments || [],
          parentMessageId: parentMessageId || null,
          readBy: [{ user: user._id, readAt: new Date() }] // Sender has read it
        });
        await newMessage.save();

        // Update Chat last updated time
        chat.updatedAt = new Date();
        await chat.save();

        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'name email employeeId avatar')
          .populate('attachments');

        // Emit to chat room
        io.to(`chat_${chatId}`).emit('message', populatedMessage);

        // Generate notifications for other participants not in the room
        // Retrieve everyone in the chat
        let notifyUserIds: string[] = [];
        if (chat.type === 'direct' || chat.type === 'group') {
          notifyUserIds = chat.participants.filter(p => p.toString() !== user._id.toString()).map(p => p.toString());
        } else if (chat.type === 'department') {
          const deptUsers = await User.find({ department: chat.department, _id: { $ne: user._id } });
          notifyUserIds = deptUsers.map(u => u._id.toString());
        } else if (chat.type === 'team') {
          const team = await Team.findById(chat.team);
          if (team) {
            notifyUserIds = team.members.filter((m: any) => m.toString() !== user._id.toString()).map((m: any) => m.toString());
          }
        }

        // Send notifications
        await Promise.all(
          notifyUserIds.map(async recipientId => {
            // Check if user is active in the room (Socket.io rooms list is not fully precise across clients, so we create in-app notification)
            const notification = new Notification({
              recipient: recipientId,
              type: 'chat',
              content: `${user.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
              referenceId: populatedMessage?._id
            });
            await notification.save();

            // Emit dynamic notification event
            io.to(`user_${recipientId}`).emit('notification', notification);
          })
        );

      } catch (err) {
        console.error('Error handling socket send_message:', err);
      }
    });

    // Message edit event
    socket.on('edit_message', async (data: { messageId: string; content: string }) => {
      try {
        const { messageId, content } = data;
        const msg = await Message.findById(messageId);
        if (!msg || msg.sender.toString() !== user._id.toString()) return;

        msg.content = content;
        msg.isEdited = true;
        await msg.save();

        const populatedMsg = await Message.findById(messageId)
          .populate('sender', 'name email employeeId avatar')
          .populate('attachments');

        io.to(`chat_${msg.chat}`).emit('message_updated', populatedMsg);
      } catch (err) {
        console.error('Error editing socket message:', err);
      }
    });

    // Message delete event (Soft delete)
    socket.on('delete_message', async (messageId: string) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg || msg.sender.toString() !== user._id.toString()) return;

        msg.content = 'This message was deleted.';
        msg.isDeleted = true;
        msg.attachments = [];
        await msg.save();

        io.to(`chat_${msg.chat}`).emit('message_deleted', { messageId, chatId: msg.chat });
      } catch (err) {
        console.error('Error deleting socket message:', err);
      }
    });

    // Read Receipt Event
    socket.on('read_message', async (data: { chatId: string; messageId: string }) => {
      try {
        const { chatId, messageId } = data;
        
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: { user: user._id, readAt: new Date() } }
        });

        socket.to(`chat_${chatId}`).emit('read_receipt', { chatId, messageId, userId: user._id });
      } catch (err) {
        console.error('Error processing socket read receipt:', err);
      }
    });

    // Mark Chat Read Event (marks all messages in chat as read by this user)
    socket.on('mark_chat_read', async (data: { chatId: string }) => {
      try {
        const { chatId } = data;
        await Message.updateMany(
          {
            chat: chatId,
            sender: { $ne: user._id },
            'readBy.user': { $ne: user._id }
          },
          {
            $addToSet: { readBy: { user: user._id, readAt: new Date() } }
          }
        );
        
        io.to(`chat_${chatId}`).emit('chat_read', { chatId, userId: user._id });
      } catch (err) {
        console.error('Error marking chat read via socket:', err);
      }
    });

    // Message reaction event
    socket.on('react_message', async (data: { messageId: string; emoji: string }) => {
      try {
        const { messageId, emoji } = data;
        const msg = await Message.findById(messageId);
        if (!msg) return;

        // Check if user already reacted with this emoji
        const existingIndex = msg.reactions.findIndex(
          r => r.user.toString() === user._id.toString() && r.emoji === emoji
        );

        if (existingIndex > -1) {
          // Remove reaction
          msg.reactions.splice(existingIndex, 1);
        } else {
          // Add reaction
          msg.reactions.push({ user: user._id, emoji });
        }
        await msg.save();

        const populatedMsg = await Message.findById(messageId)
          .populate('sender', 'name email employeeId avatar')
          .populate('attachments');

        io.to(`chat_${msg.chat}`).emit('message_updated', populatedMsg);
      } catch (err) {
        console.error('Error adding socket message reaction:', err);
      }
    });

    // Disconnect Event
    socket.on('disconnect', async () => {
      console.log(`[SOCKET] User disconnected: ${user.name}`);
      try {
        await User.findByIdAndUpdate(user._id, { isOnline: false, lastActive: new Date() });
        io.emit('user_status_change', { userId: user._id, isOnline: false });
      } catch (err) {
        console.error('Error updating status on disconnect:', err);
      }
    });
  });
};
