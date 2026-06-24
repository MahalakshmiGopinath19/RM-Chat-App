'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logOut, loadStoredCredentials } from '../../store/slices/authSlice';
import { setActiveTab, toggleSidebar, setSidebarOpen, toggleTheme, TabType } from '../../store/slices/uiSlice';
import { setActiveChat } from '../../store/slices/chatSlice';
import ChatSidebar from '../../components/chat/ChatSidebar';
import apiClient from '../../utils/apiClient';
import ChatWindow from '../../components/chat/ChatWindow';
import ChatRightPanel from '../../components/chat/ChatRightPanel';
import AnnouncementsPanel from '../../components/announcements/AnnouncementsPanel';
import FilesPanel from '../../components/files/FilesPanel';
import SearchPanel from '../../components/search/SearchPanel';
import ReportsPanel from '../../components/admin/ReportsPanel';
import UserManagementPanel from '../../components/admin/UserManagementPanel';
import SettingsPanel from '../../components/settings/SettingsPanel';
import NotificationsPanel from '../../components/notifications/NotificationsPanel';
import {
  MessageSquare,
  Megaphone,
  FileText,
  Search,
  Settings,
  Shield,
  BarChart,
  LogOut,
  Sun,
  Moon,
  Menu,
  ChevronLeft,
  Bell
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const activeTab = useSelector((state: RootState) => state.ui.activeTab);
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const theme = useSelector((state: RootState) => state.ui.theme);
  const activeChatId = useSelector((state: RootState) => state.chat.activeChatId);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 Minutes

  // Authenticate check
  useEffect(() => {
    dispatch(loadStoredCredentials());
  }, [dispatch]);

  useEffect(() => {
    // Redirection if not authenticated
    const storedToken = localStorage.getItem('token');
    if (!storedToken && !token) {
      router.replace('/login');
    }
  }, [token, router]);

  // Session inactivity auto logout
  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        handleLogout('Session expired due to inactivity.');
      }, INACTIVITY_LIMIT);
    };

    const handleLogout = (msg?: string) => {
      dispatch(logOut());
      if (msg) alert(msg);
      router.replace('/login');
    };

    // Reset idle timer on interaction
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);

    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keypress', resetInactivityTimer);
      window.removeEventListener('click', resetInactivityTimer);
      window.removeEventListener('scroll', resetInactivityTimer);
    };
  }, [dispatch, router]);

  const handleLogoutAction = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error(err);
    } finally {
      dispatch(logOut());
      router.replace('/login');
    }
  };

  const unreadNotificationsCount = useSelector((state: RootState) => state.notification.unreadCount);

  // Fetch notifications on mount
  useEffect(() => {
    if (!currentUser) return;
    const fetchInitialNotifications = async () => {
      try {
        const res = await apiClient.get('/notifications');
        const { setNotifications } = await import('../../store/slices/notificationSlice');
        dispatch(setNotifications(res.data));
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchInitialNotifications();
  }, [currentUser, dispatch]);

  const menuItems = [
    { id: 'chats', label: 'Chats', icon: <MessageSquare className="w-5.5 h-5.5" /> },
    { id: 'announcements', label: 'Announcements', icon: <Megaphone className="w-5.5 h-5.5" /> },
    { id: 'files', label: 'Files Manager', icon: <FileText className="w-5.5 h-5.5" /> },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5.5 h-5.5" />,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined
    },
    { id: 'search', label: 'Global Search', icon: <Search className="w-5.5 h-5.5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5.5 h-5.5" /> }
  ];

  const adminMenuItems = [
    { id: 'reports', label: 'System Analytics', icon: <BarChart className="w-5.5 h-5.5" /> },
    { id: 'userManagement', label: 'User Directory', icon: <Shield className="w-5.5 h-5.5" /> }
  ];

  const renderActiveWorkspace = () => {
    switch (activeTab) {
      case 'chats':
        return (
          <>
            {/* On small screens, hide chat sidebar if a conversation is open, or hide chat window if no conversation is open */}
            <div className={`${activeChatId ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 h-full shrink-0`}>
              <ChatSidebar />
            </div>
            <div className={`${!activeChatId ? 'hidden lg:flex' : 'flex'} flex-1 h-full min-w-0`}>
              <ChatWindow />
            </div>
            <div className="hidden xl:flex">
              <ChatRightPanel />
            </div>
          </>
        );
      case 'announcements':
        return <AnnouncementsPanel />;
      case 'notifications':
        return <NotificationsPanel />;
      case 'files':
        return <FilesPanel />;
      case 'search':
        return <SearchPanel />;
      case 'reports':
        return <ReportsPanel />;
      case 'userManagement':
        return <UserManagementPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-sm text-text-secondary">
            Workspace not found.
          </div>
        );
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-1 items-center justify-center bg-bg-primary text-text-secondary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold tracking-wider">LOADING USER DASHBOARD...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-primary text-text-primary">
      {/* Mobile sidebar overlay drawer */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-xs"
          onClick={() => dispatch(toggleSidebar())}
        ></div>
      )}

      {/* Left Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50
        w-20 border-r border-border-custom bg-bg-secondary flex flex-col h-full shrink-0
        transition-transform duration-300 ease-in-out
      `}>
        {/* Profile Avatar at the top (WhatsApp style) */}
        <div className="h-20 flex items-center justify-center border-b border-border-custom shrink-0">
          <button
            onClick={() => {
              dispatch(setActiveTab('settings'));
              dispatch(setSidebarOpen(false));
            }}
            className="w-11 h-11 rounded-full bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105 transition-transform overflow-hidden"
            title="Profile Settings"
          >
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
            ) : (
              currentUser.name.charAt(0).toUpperCase()
            )}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-6 flex flex-col items-center gap-2 w-full">
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  dispatch(setActiveTab(item.id as TabType));
                  dispatch(setSidebarOpen(false));
                }}
                className={`w-full h-12 flex items-center justify-center relative cursor-pointer transition-all ${
                  isActive
                    ? 'bg-bg-tertiary text-indigo-650 border-l-4 border-indigo-650 shadow-xs font-semibold'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border-l-4 border-transparent'
                }`}
                title={item.label}
              >
                {item.icon}
                {(item as any).badge !== undefined && (
                  <span className="absolute top-2 right-4 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    {(item as any).badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin separator and menu items if admin */}
          {currentUser.role === 'admin' && (
            <>
              <div className="w-8 border-t border-border-custom my-2 shrink-0"></div>
              {adminMenuItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      dispatch(setActiveTab(item.id as TabType));
                      dispatch(setSidebarOpen(false));
                    }}
                    className={`w-full h-12 flex items-center justify-center relative cursor-pointer transition-all ${
                      isActive
                        ? 'bg-bg-tertiary text-indigo-650 border-l-4 border-indigo-650 shadow-xs font-semibold'
                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border-l-4 border-transparent'
                    }`}
                    title={item.label}
                  >
                    {item.icon}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Theme Switcher & Logout (Vertical stack) */}
        <div className="p-4 border-t border-border-custom flex flex-col items-center gap-4 shrink-0">
          {/* Theme Toggler */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-text-secondary hover:bg-bg-tertiary hover:text-text-primary cursor-pointer transition-colors"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5.5 h-5.5 text-amber-500" />
            ) : (
              <Moon className="w-5.5 h-5.5 text-indigo-500" />
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogoutAction}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5.5 h-5.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex h-full min-w-0 relative">
        {renderActiveWorkspace()}
      </div>
    </div>
  );
}

