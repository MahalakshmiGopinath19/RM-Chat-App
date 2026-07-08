'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import apiClient from '../../utils/apiClient';
import { User, FileText, Download, Shield, Landmark, FolderOpen } from 'lucide-react';

export default function ChatRightPanel() {
  const activeChatId = useSelector((state: RootState) => state.chat.activeChatId);
  const threads = useSelector((state: RootState) => state.chat.threads);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const rightPanelOpen = useSelector((state: RootState) => state.ui.rightPanelOpen);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const activeChat = threads.find(t => t._id === activeChatId);
  const [sharedFiles, setSharedFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    if (!activeChatId || !rightPanelOpen) return;

    const fetchSharedFiles = async () => {
      try {
        setLoadingFiles(true);
        // Fetch files shared
        const res = await apiClient.get(`/files?search=&fileType=`);
        const filtered = res.data.filter((f: any) => 
          f.accessControl.targetId?.toString() === activeChatId.toString() ||
          (f.accessControl.type === 'private' && f.accessControl.targetId?.toString() === activeChatId.toString())
        );
        setSharedFiles(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchSharedFiles();
  }, [activeChatId, rightPanelOpen]);

  if (!rightPanelOpen || !activeChat) return null;

  const isDirect = activeChat.type === 'direct';
  const otherUser = isDirect ? activeChat.participants.find(p => p._id !== currentUser?._id) : null;

  return (
    <div className="w-80 border-l border-border-custom bg-bg-secondary flex flex-col h-full shrink-0 overflow-y-auto">
      {/* Panel title */}
      <div className="h-20 px-5 border-b border-border-custom flex items-center gap-3 shrink-0">
        <User className="w-5 h-5 text-indigo-400" />
        <h3 className="text-sm font-bold tracking-wider uppercase text-text-secondary">Details</h3>
      </div>

      {/* Main Info */}
      <div className="p-5 space-y-6">
        {/* User Card (Direct Message) */}
        {isDirect && otherUser && (
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-indigo-650/10 border border-indigo-500/20 mx-auto flex items-center justify-center font-bold text-2xl text-indigo-650 shadow-inner overflow-hidden">
              {otherUser.avatar ? (
                <img src={otherUser.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                otherUser.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h4 className="text-base font-bold text-text-primary">{otherUser.name}</h4>
              <p className="text-xs text-text-secondary font-bold uppercase mt-0.5">{otherUser.role}</p>
            </div>
            <div className="text-left bg-bg-tertiary border border-border-custom rounded-xl p-4 space-y-3 text-sm">
              <div>
                <span className="text-xs text-text-secondary font-semibold block uppercase">Employee ID</span>
                <span className="text-text-primary font-medium">{otherUser.employeeId}</span>
              </div>
              <div>
                <span className="text-xs text-text-secondary font-semibold block uppercase">Official Email</span>
                <span className="text-text-primary font-medium truncate block">{otherUser.email}</span>
              </div>
              <div>
                <span className="text-xs text-text-secondary font-semibold block uppercase">Availability</span>
                <span className={`inline-flex items-center gap-1.5 font-semibold ${otherUser.isOnline ? 'text-emerald-450' : 'text-text-secondary'}`}>
                  <span className={`w-2 h-2 rounded-full ${otherUser.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                  {otherUser.isOnline ? 'Online Now' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Department Info */}
        {activeChat.type === 'department' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-bold text-sm border-b border-border-custom pb-3">
              <Landmark className="w-5 h-5 text-emerald-400" />
              <span>Department Context</span>
            </div>
            <div className="bg-bg-tertiary border border-border-custom rounded-xl p-4 space-y-2.5 text-sm">
              <div>
                <span className="text-xs text-text-secondary font-semibold block uppercase">Department Name</span>
                <span className="text-text-primary font-medium">{activeChat.department?.name}</span>
              </div>
              <div>
                <span className="text-xs text-text-secondary font-semibold block uppercase">Description</span>
                <span className="text-text-secondary leading-relaxed block">{activeChat.department?.description || 'No description provided.'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Group / Team Members list */}
        {!isDirect && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-bold text-sm border-b border-border-custom pb-3">
              <Shield className="w-5 h-5 text-violet-400" />
              <span>Channel Members ({activeChat.participants.length})</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activeChat.participants.map((p: any) => (
                <div key={p._id} className="flex items-center justify-between text-sm p-1.5 hover:bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-xs text-indigo-650 shrink-0 border border-border-custom overflow-hidden">
                      {p.avatar ? (
                        <img src={p.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        p.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-text-primary truncate font-medium">{p.name}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${p.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Files Panel */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-text-primary font-bold text-sm border-b border-border-custom pb-3">
            <FolderOpen className="w-5 h-5 text-indigo-400" />
            <span>Shared Files ({sharedFiles.length})</span>
          </div>

          {loadingFiles ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : sharedFiles.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-4">No shared files in this chat.</p>
          ) : (
            <div className="space-y-2.5">
              {sharedFiles.map((file: any) => (
                <div key={file._id} className="bg-bg-tertiary border border-border-custom rounded-lg p-3 flex items-center justify-between gap-2.5 text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4.5 h-4.5 text-indigo-455 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-text-primary truncate font-semibold block leading-tight">{file.originalName}</span>
                      <span className="text-xs text-text-secondary block mt-0.5">{Math.round(file.size / 1024)} KB</span>
                    </div>
                  </div>
                  <a
                    href={`http://localhost:5000/api/files/${file._id}/download?token=${token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-bg-tertiary rounded text-text-secondary hover:text-text-primary cursor-pointer"
                  >
                    <Download className="w-4.5 h-4.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
