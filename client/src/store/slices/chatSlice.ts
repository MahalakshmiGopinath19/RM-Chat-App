import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  _id: string;
  chat: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    employeeId: string;
    avatar?: string;
  };
  content: string;
  attachments?: any[];
  readBy: Array<{ user: string; readAt: string }>;
  reactions: Array<{ user: string; emoji: string }>;
  parentMessageId?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatThread {
  _id: string;
  type: 'direct' | 'group' | 'department' | 'team';
  participants: any[];
  department?: any;
  team?: any;
  name?: string;
  pinnedBy: string[];
  starredBy: string[];
  unreadCount?: number;
  lastMessage?: ChatMessage | null;
  isPinned?: boolean;
  isStarred?: boolean;
}

interface ChatState {
  threads: ChatThread[];
  activeChatId: string | null;
  messages: Record<string, ChatMessage[]>; // Map of chatId -> message history array
  typingUsers: Record<string, Array<{ userId: string; userName: string }>>; // Map of chatId -> list of active typers
  loadingThreads: boolean;
  loadingMessages: boolean;
}

const initialState: ChatState = {
  threads: [],
  activeChatId: null,
  messages: {},
  typingUsers: {},
  loadingThreads: false,
  loadingMessages: false
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setThreads: (state, action: PayloadAction<ChatThread[]>) => {
      state.threads = action.payload;
    },
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      state.activeChatId = action.payload;
      if (action.payload) {
        // Clear unreadCount locally
        const index = state.threads.findIndex(t => t._id === action.payload);
        if (index > -1) {
          state.threads[index].unreadCount = 0;
        }
      }
    },
    setMessagesForChat: (state, action: PayloadAction<{ chatId: string; messages: ChatMessage[] }>) => {
      state.messages[action.payload.chatId] = action.payload.messages;
    },
    addMessageToChat: (state, action: PayloadAction<ChatMessage>) => {
      const msg = action.payload;
      const chatId = msg.chat;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      // Avoid duplicate appending
      if (!state.messages[chatId].some(m => m._id === msg._id)) {
        state.messages[chatId].push(msg);
      }

      // Update thread lastMessage & unread count (if not active chat)
      const threadIndex = state.threads.findIndex(t => t._id === chatId);
      if (threadIndex > -1) {
        state.threads[threadIndex].lastMessage = msg;
        if (state.activeChatId !== chatId) {
          state.threads[threadIndex].unreadCount = (state.threads[threadIndex].unreadCount || 0) + 1;
        }
      }
    },
    updateMessageInChat: (state, action: PayloadAction<ChatMessage>) => {
      const msg = action.payload;
      const chatId = msg.chat;
      if (state.messages[chatId]) {
        const index = state.messages[chatId].findIndex(m => m._id === msg._id);
        if (index > -1) {
          state.messages[chatId][index] = msg;
        }
      }
    },
    deleteMessageInChat: (state, action: PayloadAction<{ messageId: string; chatId: string }>) => {
      const { messageId, chatId } = action.payload;
      if (state.messages[chatId]) {
        const index = state.messages[chatId].findIndex(m => m._id === messageId);
        if (index > -1) {
          state.messages[chatId][index].content = 'This message was deleted.';
          state.messages[chatId][index].isDeleted = true;
          state.messages[chatId][index].attachments = [];
        }
      }
    },
    setTypingUsers: (state, action: PayloadAction<{ chatId: string; userId: string; userName: string }>) => {
      const { chatId, userId, userName } = action.payload;
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      if (!state.typingUsers[chatId].some(u => u.userId === userId)) {
        state.typingUsers[chatId].push({ userId, userName });
      }
    },
    removeTypingUser: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
      const { chatId, userId } = action.payload;
      if (state.typingUsers[chatId]) {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(u => u.userId !== userId);
      }
    },
    setLoadingThreads: (state, action: PayloadAction<boolean>) => {
      state.loadingThreads = action.payload;
    },
    setLoadingMessages: (state, action: PayloadAction<boolean>) => {
      state.loadingMessages = action.payload;
    }
  }
});

export const {
  setThreads,
  setActiveChat,
  setMessagesForChat,
  addMessageToChat,
  updateMessageInChat,
  deleteMessageInChat,
  setTypingUsers,
  removeTypingUser,
  setLoadingThreads,
  setLoadingMessages
} = chatSlice.actions;

export default chatSlice.reducer;
