'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '../../store/slices/uiSlice';
import apiClient from '../../utils/apiClient';
import { BarChart, FileText, Download, ShieldAlert, History, Users, MessageCircle, Radio, Menu } from 'lucide-react';

export default function ReportsPanel() {
  const dispatch = useDispatch();
  const [stats, setStats] = useState<any | null>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    window.open('http://localhost:5000/api/admin/report/pdf', '_blank');
  };

  const downloadExcelReport = () => {
    window.open('http://localhost:5000/api/admin/report/excel', '_blank');
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
            {/* Quick Metrics Grid */}
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

              <div className="bg-bg-secondary border border-border-custom p-5 flex items-center gap-3.5 rounded-xl">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute"></span>
                  <Radio className="w-6 h-6 relative" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-text-secondary font-bold block">Online Now</span>
                  <span className="text-2xl font-extrabold text-text-primary mt-0.5 block">{stats.summary.onlineUsers}</span>
                </div>
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

              <div className="bg-bg-secondary border border-border-custom p-5 flex items-center gap-3.5 rounded-xl">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
                  <BarChart className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-text-secondary font-bold block">Channels Active</span>
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
    </div>
  );
}
