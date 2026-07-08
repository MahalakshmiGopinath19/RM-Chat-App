'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setActiveChat, setThreads, ChatThread } from '../../store/slices/chatSlice';
import apiClient from '../../utils/apiClient';
import { useSocket } from '../../hooks/useSocket';
import { Hash, Users, MessageSquare, Plus, Search, Pin, Star, Radio } from 'lucide-react';

export default function ChatSidebar() {
  const dispatch = useDispatch();
  const socketProps = useSocket();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const threads = useSelector((state: RootState) => state.chat.threads);
  const activeChatId = useSelector((state: RootState) => state.chat.activeChatId);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDmModal, setShowDmModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // DMs creation list
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'groups'>('all');

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/chats');
      dispatch(setThreads(res.data));
    } catch (err) {
      console.error('Error fetching chat threads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [dispatch]);

  // Join socket rooms when threads load
  useEffect(() => {
    if (threads.length > 0 && socketProps.socket) {
      threads.forEach(thread => {
        socketProps.joinChat(thread._id);
      });
    }
  }, [threads, socketProps.socket]);

  const handleSelectThread = (threadId: string) => {
    if (activeChatId) {
      socketProps.leaveChat(activeChatId);
    }
    dispatch(setActiveChat(threadId));
    socketProps.joinChat(threadId);
  };

  const handleOpenDmModal = async () => {
    setShowDmModal(true);
    try {
      const res = await apiClient.get('/users');
      // Filter out current user
      const list = res.data.filter((u: any) => u._id !== currentUser?._id);
      setUsersList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDm = async () => {
    if (!selectedUser) return;
    try {
      const res = await apiClient.post('/chats/direct', { recipientId: selectedUser });
      fetchThreads();
      handleSelectThread(res.data._id);
      setShowDmModal(false);
      setSelectedUser('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenGroupModal = async () => {
    setShowGroupModal(true);
    try {
      const res = await apiClient.get('/users');
      const list = res.data.filter((u: any) => u._id !== currentUser?._id);
      setUsersList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGroupUserToggle = (userId: string) => {
    if (selectedGroupUsers.includes(userId)) {
      setSelectedGroupUsers(selectedGroupUsers.filter(id => id !== userId));
    } else {
      setSelectedGroupUsers([...selectedGroupUsers, userId]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName || selectedGroupUsers.length === 0) return;
    try {
      const res = await apiClient.post('/chats/group', {
        name: groupName,
        participantIds: selectedGroupUsers
      });
      fetchThreads();
      handleSelectThread(res.data._id);
      setShowGroupModal(false);
      setGroupName('');
      setSelectedGroupUsers([]);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredThreads = threads.filter(thread => {
    let matchesSearch = false;
    if (thread.type === 'direct') {
      const otherUser = thread.participants.find(p => p._id !== currentUser?._id);
      matchesSearch = otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    } else if (thread.type === 'group') {
      matchesSearch = thread.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    } else if (thread.type === 'department') {
      matchesSearch = thread.department?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    } else if (thread.type === 'team') {
      matchesSearch = thread.team?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    }

    if (!matchesSearch) return false;

    if (filterType === 'unread') {
      return thread.unreadCount && thread.unreadCount > 0;
    } else if (filterType === 'groups') {
      return thread.type === 'group' || thread.type === 'department' || thread.type === 'team';
    }
    return true;
  });

  const getThreadMeta = (thread: ChatThread) => {
    if (thread.type === 'direct') {
      const otherUser = thread.participants.find(p => p._id !== currentUser?._id);
      return {
        name: otherUser?.name || 'Direct Message',
        sub: otherUser?.email || '',
        avatar: otherUser?.avatar || '',
        isOnline: otherUser?.isOnline || false,
        icon: <MessageSquare className="w-5.5 h-5.5 text-indigo-400" />
      };
    } else if (thread.type === 'group') {
      return {
        name: thread.name || 'Group Chat',
        sub: `${thread.participants.length} participants`,
        avatar: '',
        isOnline: false,
        icon: <Users className="w-5.5 h-5.5 text-violet-400" />
      };
    } else if (thread.type === 'department') {
      return {
        name: `${thread.department?.name} Channel` || 'Dept Chat',
        sub: 'Department-wide channel',
        avatar: '',
        isOnline: false,
        icon: <Radio className="w-5.5 h-5.5 text-emerald-400" />
      };
    } else {
      return {
        name: thread.team?.name || 'Team Chat',
        sub: 'Project collaboration channel',
        avatar: '',
        isOnline: false,
        icon: <Hash className="w-5.5 h-5.5 text-cyan-400" />
      };
    }
  };

  return (
    <div className="w-full border-r border-border-custom bg-bg-secondary flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-border-custom shrink-0">
        <h3 className="text-base font-bold tracking-wider uppercase text-text-secondary">Conversations</h3>
        <div className="flex gap-2">
          <button
            onClick={handleOpenDmModal}
            title="Start DM"
            className="p-1.5 hover:bg-bg-tertiary rounded text-text-secondary hover:text-indigo-400 cursor-pointer transition-colors"
          >
            <MessageSquare className="w-5.5 h-5.5" />
          </button>
          <button
            onClick={handleOpenGroupModal}
            title="Create Group"
            className="p-1.5 hover:bg-bg-tertiary rounded text-text-secondary hover:text-violet-400 cursor-pointer transition-colors"
          >
            <Plus className="w-5.5 h-5.5" />
          </button>
        </div>
      </div>

      {/* Search Input & Filters */}
      <div className="p-4 border-b border-border-custom shrink-0 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-text-secondary/50" />
          <input
            type="text"
            placeholder="Search or start new chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-primary border border-border-custom rounded-lg pl-10 pr-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-indigo-500/30 transition-colors"
          />
        </div>
        
        {/* Filter Pills */}
        <div className="flex gap-2">
          {['all', 'unread', 'groups'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                filterType === type
                  ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400'
                  : 'bg-bg-primary border-border-custom text-text-secondary hover:text-text-primary'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && threads.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredThreads.length === 0 ? (
          <p className="text-center text-sm text-text-secondary py-8">No channels found</p>
        ) : (
          filteredThreads.map(thread => {
            const meta = getThreadMeta(thread);
            const isActive = activeChatId === thread._id;

            return (
              <button
                key={thread._id}
                onClick={() => handleSelectThread(thread._id)}
                className={`w-[calc(100%-16px)] mx-2 my-0.5 text-left p-3 rounded-xl flex items-center gap-3.5 transition-all duration-200 cursor-pointer relative ${
                  isActive
                    ? 'bg-indigo-600/10 text-text-primary shadow-xs font-semibold'
                    : 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                {/* Channel Icon or User Avatar */}
                <div className="relative shrink-0">
                  {thread.type === 'direct' && meta.avatar ? (
                    <img src={meta.avatar} alt="avatar" className="w-11 h-11 rounded-full border border-border-custom object-cover" />
                  ) : (
                    <div className="w-11 h-11 bg-bg-tertiary border border-border-custom rounded-xl flex items-center justify-center">
                      {meta.icon}
                    </div>
                  )}

                  {/* Online Dot */}
                  {thread.type === 'direct' && (
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-bg-secondary ${
                        meta.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                      }`}
                    ></span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold truncate block">{meta.name}</span>
                    <span className="text-[10px] text-text-secondary font-semibold shrink-0 ml-2">
                      {thread.lastMessage
                        ? new Date(thread.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-text-secondary truncate block pr-2 leading-tight">
                      {thread.lastMessage ? `${thread.lastMessage.sender.name}: ${thread.lastMessage.content}` : meta.sub}
                    </span>
                    {thread.unreadCount && thread.unreadCount > 0 ? (
                      <span className="bg-indigo-600 text-[10px] text-white font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-center shrink-0">
                        {thread.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Direct Message Modal */}
      {showDmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-custom rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h4 className="text-sm font-semibold text-text-primary mb-4">Start Direct Message</h4>
            <div className="mb-4">
              <label className="block text-xs font-medium text-text-secondary mb-2">Select Colleague</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-custom text-sm text-text-primary rounded-lg p-2 outline-none focus:border-indigo-500"
              >
                <option value="">Choose employee...</option>
                {usersList.map((u: any) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.employeeId} - {u.department?.name || 'No Dept'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDmModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:bg-bg-tertiary rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDm}
                disabled={!selectedUser}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-500 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Chat Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-custom rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h4 className="text-sm font-semibold text-text-primary mb-4">Create Group Conversation</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-custom text-sm text-text-primary rounded-lg p-2 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Select Members</label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 border border-border-custom rounded-lg p-2 bg-bg-tertiary">
                  {usersList.map((u: any) => (
                    <label key={u._id} className="flex items-center gap-2.5 text-xs text-text-primary p-1 hover:bg-bg-tertiary rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGroupUsers.includes(u._id)}
                        onChange={() => handleGroupUserToggle(u._id)}
                        className="rounded border-border-custom bg-bg-tertiary text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{u.name} ({u.employeeId})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:bg-bg-tertiary rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName || selectedGroupUsers.length === 0}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-500 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
