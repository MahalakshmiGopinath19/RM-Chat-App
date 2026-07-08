'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setActiveTab, toggleSidebar } from '../../store/slices/uiSlice';
import { setActiveChat } from '../../store/slices/chatSlice';
import apiClient from '../../utils/apiClient';
import { Search, MessageSquare, User, FileText, Hash, Calendar, ArrowRight, Menu } from 'lucide-react';

export default function SearchPanel() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const [activeSubTab, setActiveSubTab] = useState<'messages' | 'employees' | 'files' | 'groups'>('messages');
  const [keyword, setKeyword] = useState('');
  const [extraFilter, setExtraFilter] = useState(''); // e.g. sender, dept, type
  const [dateFilter, setDateFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword && !extraFilter && !dateFilter) return;

    try {
      setLoading(true);
      if (activeSubTab === 'messages') {
        // Fetch messages filtering by query params
        const res = await apiClient.get(`/chats`); // We can scan user chats for query matches or search endpoint if provided
        // Simulate local message search across chat logs
        const allMessages: any[] = [];
        await Promise.all(
          res.data.map(async (chat: any) => {
            try {
              const msgRes = await apiClient.get(`/chats/${chat._id}/messages`);
              const filtered = msgRes.data.filter((msg: any) => {
                const matchesKeyword = keyword ? msg.content.toLowerCase().includes(keyword.toLowerCase()) : true;
                const matchesSender = extraFilter ? msg.sender.name.toLowerCase().includes(extraFilter.toLowerCase()) : true;
                const matchesDate = dateFilter ? msg.createdAt.startsWith(dateFilter) : true;
                return matchesKeyword && matchesSender && matchesDate && !msg.isDeleted;
              });
              allMessages.push(...filtered.map((m: any) => ({ ...m, chatName: chat.name || chat.type })));
            } catch (err) {
              console.error(err);
            }
          })
        );
        setResults(allMessages);
      } else if (activeSubTab === 'employees') {
        const res = await apiClient.get(`/users?search=${keyword}&department=${extraFilter}`);
        setResults(res.data);
      } else if (activeSubTab === 'files') {
        const res = await apiClient.get(`/files?search=${keyword}&fileType=${extraFilter}`);
        setResults(res.data);
      } else if (activeSubTab === 'groups') {
        const res = await apiClient.get('/teams');
        const filtered = res.data.filter((t: any) => t.name.toLowerCase().includes(keyword.toLowerCase()));
        setResults(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startDMWithEmployee = async (employeeId: string) => {
    try {
      const res = await apiClient.post('/chats/direct', { recipientId: employeeId });
      dispatch(setActiveChat(res.data._id));
      dispatch(setActiveTab('chats'));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="h-20 border-b border-border-custom flex items-center justify-between px-4 lg:px-6 bg-bg-secondary">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Hamburger Menu (Mobile only) */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden p-1.5 hover:bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary cursor-pointer transition-colors shrink-0"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h4 className="text-lg font-bold text-text-primary tracking-wide truncate">Global Search</h4>
            <p className="text-sm text-text-secondary mt-0.5 uppercase tracking-wider font-semibold">Search conversations, files, and employees</p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border-custom px-4 lg:px-6 bg-bg-secondary">
        {(['messages', 'employees', 'files', 'groups'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveSubTab(tab);
              setResults([]);
            }}
            className={`px-5 py-4.5 border-b-2 text-sm font-semibold capitalize transition-all cursor-pointer ${
              activeSubTab === tab
                ? 'border-indigo-500 text-text-primary font-bold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Input Filters form */}
      <div className="p-4 lg:p-6 bg-bg-secondary border-b border-border-custom">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-sm">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-text-secondary mb-2">Search Keyword</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-text-secondary/60" />
              <input
                type="text"
                placeholder={
                  activeSubTab === 'messages'
                    ? 'Search message text...'
                    : activeSubTab === 'employees'
                    ? 'Search name, email, employee ID...'
                    : 'Search keywords...'
                }
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-custom rounded-lg pl-11 pr-3 py-3 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary mb-2">
              {activeSubTab === 'messages'
                ? 'Sender Name'
                : activeSubTab === 'employees'
                ? 'Department ID'
                : activeSubTab === 'files'
                ? 'File Type (image/doc/zip)'
                : 'Not applicable'}
            </label>
            <input
              type="text"
              disabled={activeSubTab === 'groups'}
              placeholder="Filter details..."
              value={extraFilter}
              onChange={(e) => setExtraFilter(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-custom rounded-lg px-3 py-3 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-indigo-500/50 disabled:opacity-30"
            />
          </div>

          {activeSubTab === 'messages' ? (
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary mb-2">Date (YYYY-MM-DD)</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-custom rounded-lg px-3 py-3 text-sm text-text-primary outline-none focus:border-indigo-500/50"
              />
            </div>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg text-sm cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors"
            >
              Run Query
            </button>
          )}

          {activeSubTab === 'messages' && (
            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-650 hover:bg-indigo-500 text-white font-semibold px-7 py-3 rounded-lg text-sm cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors"
              >
                Run Search
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Results Workspace */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length === 0 ? (
          <p className="text-center text-sm text-text-secondary py-12">Enter filters and click search to retrieve data.</p>
        ) : (
          <div className="space-y-3">
            {activeSubTab === 'messages' &&
              results.map((msg, idx) => (
                <div key={idx} className="bg-bg-secondary border border-border-custom rounded-xl p-4 flex flex-col gap-2.5 text-sm">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="font-bold text-text-primary">{msg.sender.name} in {msg.chatName}</span>
                    <span className="text-xs">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-text-secondary leading-relaxed">{msg.content}</p>
                </div>
              ))}

            {activeSubTab === 'employees' &&
              results.map((user, idx) => (
                <div key={idx} className="bg-bg-secondary border border-border-custom rounded-xl p-4 flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-base">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h6 className="font-bold text-text-primary leading-snug">{user.name}</h6>
                      <p className="text-xs text-text-secondary mt-0.5">{user.employeeId} • {user.department?.name || 'No Department'}</p>
                    </div>
                  </div>
                  {user._id !== currentUser?._id && (
                    <button
                      onClick={() => startDMWithEmployee(user._id)}
                      className="p-2.5 bg-bg-tertiary border border-border-custom rounded-lg hover:border-indigo-500 text-text-secondary hover:text-indigo-400 cursor-pointer transition-colors"
                      title="Direct Message"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}

            {activeSubTab === 'files' &&
              results.map((file, idx) => (
                <div key={idx} className="bg-bg-secondary border border-border-custom rounded-xl p-4 flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <div>
                      <span className="font-bold text-text-primary block">{file.originalName}</span>
                      <span className="text-xs text-text-secondary block mt-0.5">By {file.owner?.name} • {Math.round(file.size / 1024)} KB</span>
                    </div>
                  </div>
                  <a
                    href={`http://localhost:5000/api/files/${file._id}/download?token=${token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-bg-tertiary border border-border-custom rounded-lg hover:border-indigo-500 text-text-secondary hover:text-indigo-400 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ))}

            {activeSubTab === 'groups' &&
              results.map((team, idx) => (
                <div key={idx} className="bg-bg-secondary border border-border-custom rounded-xl p-4 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="font-semibold text-text-primary block">{team.name}</span>
                      <span className="text-[10px] text-text-secondary block mt-0.5">{team.description || 'No description'}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

