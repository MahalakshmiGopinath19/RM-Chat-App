'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import apiClient from '../../utils/apiClient';
import {
  setNotifications,
  markAllNotificationsAsRead,
  setLoadingNotifications,
  NotificationItem
} from '../../store/slices/notificationSlice';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { Bell, Check, MessageSquare, Megaphone, CheckSquare, Calendar, Menu } from 'lucide-react';

export default function NotificationsPanel() {
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.notification.notifications);
  const loading = useSelector((state: RootState) => state.notification.loading);
  const unreadCount = useSelector((state: RootState) => state.notification.unreadCount);

  const fetchNotifications = async () => {
    try {
      dispatch(setLoadingNotifications(true));
      const res = await apiClient.get('/notifications');
      dispatch(setNotifications(res.data));
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      dispatch(setLoadingNotifications(false));
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [dispatch]);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post('/notifications/read-all');
      dispatch(markAllNotificationsAsRead());
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="w-5 h-5 text-indigo-400" />;
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="h-20 border-b border-border-custom flex items-center justify-between px-4 lg:px-6 bg-bg-secondary shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden p-1.5 hover:bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
            title="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h4 className="text-lg font-bold text-text-primary tracking-wide flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-indigo-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h4>
            <p className="text-sm text-text-secondary mt-0.5 uppercase tracking-wider font-semibold">
              Real-time activity and mentions
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 bg-bg-tertiary/60 hover:bg-bg-tertiary text-text-primary font-semibold px-4.5 py-2.5 rounded-lg text-sm cursor-pointer border border-border-custom transition-all"
          >
            <CheckSquare className="w-4.5 h-4.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center border border-border-custom text-text-secondary/30 mb-4">
              <Bell className="w-8 h-8" />
            </div>
            <p className="text-base font-bold text-text-primary">No notifications yet</p>
            <p className="text-sm text-text-secondary mt-1">You will see real-time updates and activity notifications here.</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {notifications.map((notif: NotificationItem) => (
              <div
                key={notif._id}
                className={`p-4.5 rounded-xl border transition-all duration-200 flex gap-4 ${
                  notif.status === 'unread'
                    ? 'bg-indigo-500/5 border-indigo-500/20 shadow-md shadow-indigo-500/2'
                    : 'bg-bg-secondary border-border-custom hover:bg-bg-secondary/80'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  notif.status === 'unread' ? 'bg-indigo-500/10' : 'bg-bg-tertiary'
                }`}>
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm lg:text-base text-text-primary font-medium leading-relaxed">
                    {notif.content}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary font-semibold">
                    <span className="capitalize">{notif.type}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(notif.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {notif.status === 'unread' && (
                  <div className="shrink-0 flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" title="Unread"></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
