'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import apiClient from '../../utils/apiClient';
import { Megaphone, AlertTriangle, Plus, Trash2, Calendar, Menu } from 'lucide-react';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { useDispatch } from 'react-redux';

export default function AnnouncementsPanel() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [audienceType, setAudienceType] = useState('company');
  const [audienceId, setAudienceId] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Dropdowns
  const [depts, setDepts] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudiences = async () => {
    try {
      const deptsRes = await apiClient.get('/departments');
      setDepts(deptsRes.data);
      const teamsRes = await apiClient.get('/teams');
      setTeams(teamsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    if (isAdmin) {
      fetchAudiences();
    }
  }, [isAdmin]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !audienceType) return;

    try {
      await apiClient.post('/announcements', {
        title,
        content,
        priority,
        audienceType,
        audienceId: audienceId || undefined,
        publishDate: publishDate || undefined,
        expiryDate: expiryDate || undefined
      });
      setShowModal(false);
      // Reset form
      setTitle('');
      setContent('');
      setPriority('normal');
      setAudienceType('company');
      setAudienceId('');
      setPublishDate('');
      setExpiryDate('');
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this announcement permanently?')) {
      try {
        await apiClient.delete(`/announcements/${id}`);
        fetchAnnouncements();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getPriorityStyles = (p: string) => {
    switch (p) {
      case 'critical':
        return 'border-rose-500/30 bg-rose-500/5 text-rose-500 dark:text-rose-400';
      case 'important':
        return 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400';
      default:
        return 'border-border-custom bg-bg-secondary text-text-primary';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="h-20 border-b border-border-custom flex items-center justify-between px-4 lg:px-6 bg-bg-secondary">
        <div className="flex items-center gap-2.5">
          {/* Hamburger Menu (Mobile only) */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden p-1.5 hover:bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h4 className="text-lg font-bold text-text-primary tracking-wide">Announcements</h4>
            <p className="text-sm text-text-secondary mt-0.5 uppercase tracking-wider font-semibold">Company directives and notifications</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold px-4.5 py-2.5 rounded-lg text-sm cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Create Announcement</span>
          </button>
        )}
      </div>

      {/* Grid of Announcements */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
            <Megaphone className="w-16 h-16 text-text-secondary/30 mb-4" />
            <p className="text-base font-bold uppercase tracking-wider">No active announcements</p>
          </div>
        ) : (
          announcements.map(item => {
            const borderStyle = getPriorityStyles(item.priority);

            return (
              <div
                key={item._id}
                className={`border rounded-xl p-5 flex flex-col gap-3 relative shadow-sm ${borderStyle}`}
              >
                {/* Title & Priority Badge */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Megaphone className="w-5.5 h-5.5 shrink-0" />
                    <h5 className="font-bold text-text-primary text-base truncate">{item.title}</h5>
                  </div>
                  <span className={`text-xs uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${
                    item.priority === 'critical'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-500 dark:text-rose-455'
                      : item.priority === 'important'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-455'
                      : 'border-border-custom bg-bg-tertiary text-text-secondary'
                  }`}>
                    {item.priority}
                  </span>
                </div>

                {/* Content */}
                <p className="text-sm lg:text-base text-text-secondary leading-relaxed whitespace-pre-wrap">{item.content}</p>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between text-xs text-text-secondary mt-2 pt-3 border-t border-border-custom">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-text-secondary opacity-60" />
                    <span>Published: {new Date(item.publishDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-text-primary">By: {item.sender.name}</span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-rose-500 hover:text-rose-450 cursor-pointer p-0.5 rounded hover:bg-bg-tertiary transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-custom rounded-xl max-w-md w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h4 className="text-base font-bold text-text-primary mb-4">Create New Announcement</h4>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Health Benefits Policy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-custom text-text-primary rounded-lg p-3 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter details here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-custom text-text-primary rounded-lg p-3 outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border-custom text-text-primary rounded-lg p-3 outline-none focus:border-indigo-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">Audience</label>
                  <select
                    value={audienceType}
                    onChange={(e) => setAudienceType(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border-custom text-text-primary rounded-lg p-2.5 outline-none focus:border-indigo-500"
                  >
                    <option value="company">Company-wide</option>
                    <option value="department">Department</option>
                    <option value="team">Team</option>
                  </select>
                </div>
              </div>

              {audienceType !== 'company' && (
                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                    Select target {audienceType}
                  </label>
                  <select
                    value={audienceId}
                    onChange={(e) => setAudienceId(e.target.value)}
                    required
                    className="w-full bg-bg-tertiary border border-border-custom text-text-primary rounded-lg p-2.5 outline-none focus:border-indigo-500"
                  >
                    <option value="">Choose...</option>
                    {audienceType === 'department'
                      ? depts.map(d => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))
                      : teams.map(t => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">Publish Date (Optional)</label>
                  <input
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border-custom text-text-primary rounded-lg p-2.5 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border-custom text-text-primary rounded-lg p-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-custom">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-bg-tertiary rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-605 hover:bg-indigo-500 rounded-lg cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
