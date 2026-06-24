import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationItem {
  _id: string;
  recipient: string;
  type: 'chat' | 'announcement' | 'task';
  content: string;
  referenceId?: string | null;
  status: 'unread' | 'read';
  createdAt: string;
  updatedAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<NotificationItem[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => n.status === 'unread').length;
    },
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      // Add to front of array
      if (!state.notifications.some(n => n._id === action.payload._id)) {
        state.notifications.unshift(action.payload);
        if (action.payload.status === 'unread') {
          state.unreadCount += 1;
        }
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(n => {
        n.status = 'read';
      });
      state.unreadCount = 0;
    },
    setLoadingNotifications: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    }
  }
});

export const {
  setNotifications,
  addNotification,
  markAllNotificationsAsRead,
  setLoadingNotifications
} = notificationSlice.actions;

export default notificationSlice.reducer;
