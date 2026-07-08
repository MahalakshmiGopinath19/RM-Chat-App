'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  addMessageToChat,
  updateMessageInChat,
  deleteMessageInChat,
  setTypingUsers,
  removeTypingUser,
  markMessagesAsRead
} from '../store/slices/chatSlice';
import { addNotification } from '../store/slices/notificationSlice';
import { logOut } from '../store/slices/authSlice';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendTyping: (chatId: string) => void;
  sendStopTyping: (chatId: string) => void;
  sendMessage: (chatId: string, content: string, attachments?: string[], parentMessageId?: string) => void;
  sendReadReceipt: (chatId: string, messageId: string) => void;
  sendReaction: (messageId: string, emoji: string) => void;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect if authenticated and token exists
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect socket
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('[SOCKET] Connected to real-time server.');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[SOCKET] Disconnected from server.');
      setIsConnected(false);
    });

    // Real-time Event Listeners
    socketInstance.on('message', (msg) => {
      dispatch(addMessageToChat(msg));
    });

    socketInstance.on('message_updated', (msg) => {
      dispatch(updateMessageInChat(msg));
    });

    socketInstance.on('message_deleted', (data: { messageId: string; chatId: string }) => {
      dispatch(deleteMessageInChat(data));
    });

    socketInstance.on('typing', (data: { chatId: string; userId: string; userName: string }) => {
      dispatch(setTypingUsers(data));
    });

    socketInstance.on('stop_typing', (data: { chatId: string; userId: string }) => {
      dispatch(removeTypingUser(data));
    });

    socketInstance.on('notification', (notif) => {
      console.log('[SOCKET] New notification received:', notif);
      dispatch(addNotification(notif));
    });

    socketInstance.on('kick', (data: { message: string }) => {
      alert(data?.message || 'Your session has been terminated by an admin.');
      dispatch(logOut());
      window.location.replace('/login');
    });

    socketInstance.on('user_status_change', (data: { userId: string; isOnline: boolean }) => {
      // Trigger status changes in chat participants or state
      console.log('[SOCKET] User status change:', data);
    });

    socketInstance.on('chat_read', (data: { chatId: string; userId: string }) => {
      dispatch(markMessagesAsRead(data));
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, isAuthenticated, dispatch]);

  const joinChat = (chatId: string) => {
    socketRef.current?.emit('join_chat', chatId);
  };

  const leaveChat = (chatId: string) => {
    socketRef.current?.emit('leave_chat', chatId);
  };

  const sendTyping = (chatId: string) => {
    socketRef.current?.emit('typing', chatId);
  };

  const sendStopTyping = (chatId: string) => {
    socketRef.current?.emit('stop_typing', chatId);
  };

  const sendMessage = (chatId: string, content: string, attachments?: string[], parentMessageId?: string) => {
    socketRef.current?.emit('send_message', {
      chatId,
      content,
      attachments,
      parentMessageId
    });
  };

  const sendReadReceipt = (chatId: string, messageId: string) => {
    socketRef.current?.emit('read_message', { chatId, messageId });
  };

  const sendReaction = (messageId: string, emoji: string) => {
    socketRef.current?.emit('react_message', { messageId, emoji });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinChat,
        leaveChat,
        sendTyping,
        sendStopTyping,
        sendMessage,
        sendReadReceipt,
        sendReaction
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
