'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '../../store/slices/uiSlice';
import apiClient from '../../utils/apiClient';
import { BarChart, FileText, Download, ShieldAlert, History, Users, MessageCircle, Radio, Menu, HelpCircle, X } from 'lucide-react';

export default function ReportsPanel() {
  const dispatch = useDispatch();
  const [stats, setStats] = useState<any | null>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOnlineList, setShowOnlineList] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/stats');
      setStats(res.data);
      
      const auditRes = await apiClient.get('/admin/audit-logs');
      setAudits(auditRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Exporters
  const downloadPDFReport = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    window.open(`http://localhost:5000/api/admin/report/pdf?token=${token}`, '_blank');
  };

  const downloadExcelReport = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    window.open(`http://localhost:5000/api/admin/report/excel?token=${token}`, '_blank');
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
            <h4 className="text-lg font-bold text-text-primary tracking-wide truncate">Monitoring & Analytics</h4>
            <p className="text-sm text-text-secondary mt-0.5 uppercase tracking-wider font-semibold">System audit tracking and activity reports</p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={downloadExcelReport}
            className="flex items-center gap-1.5 bg-bg-tertiary border border-border-custom hover:border-emerald-500/30 hover:bg-emerald-500/5 text-text-secondary hover:text-emerald-400 font-semibold px-4.5 py-2.5 rounded-lg text-sm cursor-pointer transition-colors"
          >
            <Download className="w-4.5 h-4.5" />
            <span className="hidden sm:inline">Excel Export</span>
          </button>
          <button
            onClick={downloadPDFReport}
            className="flex items-center gap-1.5 bg-bg-tertiary border border-border-custom hover:border-rose-500/30 hover:bg-rose-500/5 text-text-secondary hover:text-rose-400 font-semibold px-4.5 py-2.5 rounded-lg text-sm cursor-pointer transition-colors"
          >
            <FileText className="w-4.5 h-4.5" />
            <span className="hidden sm:inline">PDF Summary</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {loading && !stats ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bg-secondary border border-border-custom p-5 flex items-center gap-3.5 rounded-xl">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-text-secondary font-bold block">Total Employees</span>
                  <span className="text-2xl font-extrabold text-text-primary mt-0.5 block">{stats.summary.totalUsers}</span>
                </div>
              </div>

              <div 
                onClick={() => setShowOnlineList(true)}
                className="bg-bg-secondary border border-border-custom p-5 flex items-center gap-3.5 rounded-xl cursor-pointer hover:border-emerald-500/35 transition-all group relative"
                title="Click to view online users"
              >
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-450 group-hover:bg-emerald-500/20 transition-colors">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute"></span>
                  <Radio className="w-6 h-6 relative" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-text-secondary font-bold block group-hover:text-text-primary transition-colors">Online Now</span>
                  <span className="text-2xl font-extrabold text-text-primary mt-0.5 block">{stats.summary.onlineUsers}</span>
                </div>
                <span className="absolute bottom-1 right-2.5 text-[9px] text-emerald-555 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">View List</span>
              </div>

              <div className="bg-bg-secondary border border-border-custom p-5 flex items-center gap-3.5 rounded-xl">
                <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-text-secondary font-bold block">Total Messages</span>
                  <span className="text-2xl font-extrabold text-text-primary mt-0.5 block">{stats.summary.totalMessages}</span>
                </div>
              </div>

              <div className="bg-bg-secondary border border-border-custom p-5 flex items-center gap-3.5 rounded-xl relative group">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
                  <BarChart className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase tracking-wider text-text-secondary font-bold block">Channels Active</span>
                    <div className="relative">
                      <HelpCircle className="w-3.5 h-3.5 text-text-secondary/60 hover:text-text-primary cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-bg-secondary border border-border-custom text-[11px] text-text-secondary rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40 leading-normal pointer-events-none">
                        Total active communication channels (direct message chats, group chats, department rooms, and team channels) currently created in the application.
                      </div>
                    </div>
                  </div>
                  <span className="text-2xl font-extrabold text-text-primary mt-0.5 block">{stats.summary.totalChats}</span>
                </div>
              </div>
            </div>

            {/* SVG Graph for message activity */}
            <div className="bg-bg-secondary border border-border-custom rounded-xl p-5 shadow-lg">
              <h5 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart className="w-5.5 h-5.5 text-indigo-400" />
                <span>Message Volume Trend (Last 7 Days)</span>
              </h5>
              
              {stats.messageStats && stats.messageStats.length > 0 ? (
                <div className="h-44 w-full flex items-end justify-between gap-2.5 px-4 pt-4 border-b border-border-custom">
                  {stats.messageStats.map((item: any, i: number) => {
                    const maxVal = Math.max(...stats.messageStats.map((d: any) => d.count), 5);
                    const percentage = (item.count / maxVal) * 80 + 10; // Bounds height between 10% and 90%

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                        {/* Tooltip */}
                        <span className="opacity-0 group-hover/bar:opacity-100 bg-bg-tertiary text-xs text-text-primary font-semibold py-0.5 px-1.5 rounded border border-border-custom transition-opacity">
                          {item.count} msgs
                        </span>
                        {/* Bar */}
                        <div
                          style={{ height: `${percentage}%` }}
                          className="w-full bg-gradient-to-t from-indigo-650 to-indigo-500 rounded-t hover:from-indigo-500 hover:to-indigo-400 transition-all duration-300 shadow-md shadow-indigo-600/10"
                        ></div>
                        <span className="text-xs text-text-secondary uppercase">{item._id.substring(5)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-text-secondary">
                  No activity logs recorded.
                </div>
              )}
            </div>

            {/* Session Logs (Login / Logout details) */}
            <div className="bg-bg-secondary border border-border-custom rounded-xl p-5 shadow-lg">
              <h5 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <History className="w-5.5 h-5.5 text-indigo-400" />
                <span>Employee Logins & Session Audits</span>
              </h5>

              <div className="border border-border-custom rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-bg-tertiary border-b border-border-custom text-xs uppercase font-bold text-text-secondary tracking-wider">
                        <th className="p-4">Employee</th>
                        <th className="p-4">Security Action</th>
                        <th className="p-4">Client Browser & OS</th>
                        <th className="p-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom">
                      {audits
                        .filter(audit => audit.action === 'LOGIN_SUCCESS' || audit.action === 'LOGOUT' || audit.action === 'LOGIN_FAILED')
                        .slice(0, 12)
                        .map((audit, idx) => (
                          <tr key={idx} className="hover:bg-bg-tertiary/10 text-text-secondary">
                            <td className="p-4 font-semibold text-text-primary">
                              {audit.user ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-[10px] text-indigo-650 shrink-0 border border-border-custom overflow-hidden">
                                    {audit.user.avatar ? (
                                      <img src={audit.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                      audit.user.name.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div>
                                    <span className="block leading-tight font-bold">{audit.user.name}</span>
                                    <span className="block text-[10px] text-text-secondary font-medium">{audit.user.employeeId}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-text-secondary">SYSTEM / ANONYMOUS</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                audit.action === 'LOGIN_SUCCESS'
                                  ? 'bg-emerald-500/10 text-emerald-555'
                                  : audit.action === 'LOGIN_FAILED'
                                  ? 'bg-rose-500/10 text-rose-455'
                                  : 'bg-amber-500/10 text-amber-555'
                              }`}>
                                {audit.action.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4 text-xs font-medium">
                              {audit.userAgent ? (
                                <span className="truncate max-w-[220px] block" title={audit.userAgent}>
                                  {audit.userAgent.split(' ')[0]} ({audit.details?.includes('Windows') ? 'Windows' : audit.details?.includes('Mac') ? 'macOS' : 'Linux'})
                                </span>
                              ) : (
                                'Direct Endpoint Access'
                              )}
                            </td>
                            <td className="p-4 text-right text-xs font-semibold text-text-secondary">
                              {new Date(audit.timestamp).toLocaleDateString()} {new Date(audit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      {audits.filter(audit => audit.action === 'LOGIN_SUCCESS' || audit.action === 'LOGOUT' || audit.action === 'LOGIN_FAILED').length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-xs text-text-secondary">
                            No logins or logouts recorded in this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Audit Logs logs */}
            <div className="bg-bg-secondary border border-border-custom rounded-xl p-5 shadow-lg">
              <h5 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5.5 h-5.5 text-rose-500 animate-pulse" />
                <span>Recent System Audits</span>
              </h5>

              <div className="border border-border-custom rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-bg-tertiary border-b border-border-custom text-xs uppercase font-bold text-text-secondary tracking-wider">
                        <th className="p-4">User</th>
                        <th className="p-4">Action</th>
                        <th className="p-4">Details</th>
                        <th className="p-4 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom">
                      {audits.slice(0, 10).map((audit, idx) => (
                        <tr key={idx} className="hover:bg-bg-tertiary/10 text-text-secondary">
                          <td className="p-4 font-semibold text-text-primary">
                            {audit.user?.name || 'SYSTEM'}
                          </td>
                          <td className="p-4">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                              audit.action.includes('FAILED')
                                ? 'bg-rose-500/10 text-rose-455'
                                : audit.action.includes('DELETE')
                                ? 'bg-amber-500/10 text-amber-455'
                                : 'bg-indigo-500/10 text-indigo-455'
                            }`}>
                              {audit.action}
                            </span>
                          </td>
                          <td className="p-4 truncate max-w-[200px]" title={audit.details}>
                            {audit.details}
                          </td>
                          <td className="p-4 text-right text-xs text-text-secondary">
                            {new Date(audit.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Online Users Directory Modal */}
      {showOnlineList && stats?.summary?.onlineUsersList && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-custom rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border-custom pb-3">
              <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Active Online Users ({stats.summary.onlineUsersList.length})</span>
              </h4>
              <button
                onClick={() => setShowOnlineList(false)}
                className="p-1 hover:bg-bg-tertiary rounded text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {stats.summary.onlineUsersList.map((usr: any) => (
                <div key={usr._id} className="flex items-center justify-between p-2 rounded-lg bg-bg-tertiary border border-border-custom/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-bg-secondary flex items-center justify-center font-bold text-xs text-indigo-650 shrink-0 border border-border-custom overflow-hidden">
                      {usr.avatar ? (
                        <img src={usr.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        usr.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-text-primary truncate leading-snug">{usr.name}</span>
                      <span className="block text-xs text-text-secondary truncate leading-tight">{usr.email}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-555 shrink-0 ml-2">
                    {usr.role}
                  </span>
                </div>
              ))}
              {stats.summary.onlineUsersList.length === 0 && (
                <p className="text-xs text-text-secondary text-center py-4">No online members detected.</p>
              )}
            </div>
            <div className="flex justify-end pt-3 border-t border-border-custom">
              <button
                onClick={() => setShowOnlineList(false)}
                className="px-4 py-2 text-xs font-bold text-text-secondary bg-bg-tertiary hover:bg-bg-tertiary/80 rounded-lg cursor-pointer border border-border-custom transition-all"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
