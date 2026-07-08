'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { toggleSidebar } from '../../store/slices/uiSlice';
import apiClient from '../../utils/apiClient';
import { FileText, Download, Upload, Search, History, Info, X, Menu } from 'lucide-react';

export default function FilesPanel() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState(''); // all, image, document, archive

  // Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [accessType, setAccessType] = useState('public'); // public, department, team
  const [targetId, setTargetId] = useState('');

  // Version/Audit Modals
  const [selectedFileForVersion, setSelectedFileForVersion] = useState<any | null>(null);
  const [selectedFileForAudit, setSelectedFileForAudit] = useState<any | null>(null);

  // Audiences lists
  const [depts, setDepts] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/files?search=${searchTerm}&fileType=${selectedType}`);
      setFiles(res.data);
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
    fetchFiles();
  }, [searchTerm, selectedType]);

  useEffect(() => {
    fetchAudiences();
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('accessType', accessType);
    if (accessType !== 'public' && targetId) {
      formData.append('targetId', targetId);
    }

    try {
      setUploading(true);
      await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadFile(null);
      setAccessType('public');
      setTargetId('');
      fetchFiles();
    } catch (err: any) {
      alert(err.response?.data?.message || 'File upload failed.');
    } finally {
      setUploading(false);
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
            <h4 className="text-lg font-bold text-text-primary tracking-wide">Files Manager</h4>
            <p className="text-sm text-text-secondary mt-0.5 uppercase tracking-wider font-semibold">Secure corporate document repository</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Main Files Table */}
        <div className="flex-1 flex flex-col p-4 lg:p-6 min-w-0 overflow-y-auto space-y-5">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2.5">
              {['', 'image', 'document', 'archive'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider cursor-pointer border transition-colors ${
                    selectedType === type
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-bg-secondary border-border-custom hover:bg-bg-tertiary text-text-secondary'
                  }`}
                >
                  {type || 'All'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search file name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-bg-secondary border border-border-custom rounded-lg pl-11 pr-3 py-3 text-sm text-text-primary placeholder-slate-650 outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* Files List Table */}
          <div className="bg-bg-secondary border border-border-custom rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-custom bg-bg-tertiary text-xs uppercase font-bold text-text-secondary tracking-wider">
                    <th className="p-5">Name</th>
                    <th className="p-5">Size</th>
                    <th className="p-5">Owner</th>
                    <th className="p-5">Access Type</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom text-sm">
                  {loading && files.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </td>
                    </tr>
                  ) : files.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-secondary">
                        No files in repository.
                      </td>
                    </tr>
                  ) : (
                    files.map(file => (
                      <tr key={file._id} className="hover:bg-bg-tertiary/10 text-text-secondary">
                        <td className="p-5 font-semibold text-text-primary">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                            <span className="truncate max-w-[150px] sm:max-w-[200px]" title={file.originalName}>{file.originalName}</span>
                            {file.version > 1 && (
                              <span className="bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-455 font-bold px-1 rounded-md">
                                v{file.version}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-5 text-text-secondary">{Math.round(file.size / 1024)} KB</td>
                        <td className="p-5 text-text-secondary">{file.owner?.name || 'System'}</td>
                        <td className="p-5">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            file.accessControl.type === 'public'
                              ? 'bg-emerald-500/10 text-emerald-455'
                              : file.accessControl.type === 'department'
                              ? 'bg-blue-500/10 text-blue-455'
                              : 'bg-violet-500/10 text-violet-455'
                          }`}>
                            {file.accessControl.type}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`http://localhost:5000/api/files/${file._id}/download?token=${token}`}
                              title="Download"
                              className="p-1.5 hover:bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-lg cursor-pointer transition-colors"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                            <button
                              onClick={() => setSelectedFileForVersion(file)}
                              title="Versions History"
                              className="p-1.5 hover:bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-lg cursor-pointer transition-colors"
                            >
                              <History className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setSelectedFileForAudit(file)}
                              title="Download Logs"
                              className="p-1.5 hover:bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-lg cursor-pointer transition-colors"
                            >
                              <Info className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upload Form Panel */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border-custom bg-bg-secondary p-5 lg:p-6 flex flex-col gap-5 overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-border-custom pb-3">
            <Upload className="w-5.5 h-5.5 text-indigo-400" />
            <h5 className="text-sm font-bold uppercase text-text-secondary tracking-wider">Publish Document</h5>
          </div>

          <form onSubmit={handleFileUpload} className="space-y-4 text-sm">
            <label className="border border-dashed border-border-custom hover:border-indigo-500/40 bg-bg-tertiary rounded-xl p-6.5 text-center flex flex-col items-center gap-2.5 cursor-pointer transition-colors">
              <Upload className="w-8 h-8 text-text-secondary/40" />
              <div>
                <span className="text-indigo-455 font-semibold">Choose file</span> or drop here
              </div>
              <span className="text-xs text-text-secondary/60 block mt-1">Allowed: PDF, Word, Excel, Images, ZIP (Max: 50MB)</span>
              <input
                type="file"
                required
                onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                className="hidden"
              />
            </label>

            {uploadFile && (
              <div className="bg-bg-tertiary border border-border-custom rounded-lg p-2.5 text-xs text-indigo-300 truncate">
                {uploadFile.name}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold uppercase text-text-secondary tracking-wider mb-2">
                Visibility Scope
              </label>
              <select
                value={accessType}
                onChange={(e) => setAccessType(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-custom text-text-primary rounded-lg p-2.5 outline-none focus:border-indigo-500"
              >
                <option value="public">Public (All Employees)</option>
                <option value="department">Department-Wide</option>
                <option value="team">Team Collaboration</option>
              </select>
            </div>

            {accessType !== 'public' && (
              <div>
                <label className="block text-[10px] font-semibold uppercase text-text-secondary tracking-wider mb-2">
                  Select Target
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  required
                  className="w-full bg-bg-tertiary border border-border-custom text-text-primary rounded-lg p-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="">Choose...</option>
                  {accessType === 'department'
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

            <button
              type="submit"
              disabled={uploading || !uploadFile}
              className="w-full bg-indigo-650 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg text-xs cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Publish Document'}
            </button>
          </form>
        </div>
      </div>

      {/* Version History Modal */}
      {selectedFileForVersion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-custom rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-border-custom pb-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">File Versions History</h4>
              <button
                onClick={() => setSelectedFileForVersion(null)}
                className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-text-primary block">Current Version (v{selectedFileForVersion.version})</span>
                  <span className="text-[10px] text-text-secondary block mt-0.5">Uploaded recently</span>
                </div>
                <span className="text-[10px] text-text-primary font-semibold">{Math.round(selectedFileForVersion.size / 1024)} KB</span>
              </div>

              {selectedFileForVersion.versions && selectedFileForVersion.versions.length > 0 ? (
                selectedFileForVersion.versions.map((ver: any, i: number) => (
                  <div key={i} className="bg-bg-tertiary border border-border-custom rounded-lg p-3 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-text-primary block">Version {i + 1}</span>
                      <span className="text-[10px] text-text-secondary block mt-0.5">
                        {new Date(ver.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-primary font-semibold">{Math.round(ver.size / 1024)} KB</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-text-secondary text-center py-4">No previous versions exist.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal (Download Tracking) */}
      {selectedFileForAudit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-custom rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-border-custom pb-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">File Access Logs</h4>
              <button
                onClick={() => setSelectedFileForAudit(null)}
                className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {selectedFileForAudit.downloads && selectedFileForAudit.downloads.length > 0 ? (
                selectedFileForAudit.downloads.map((log: any, i: number) => (
                  <div key={i} className="p-2 border-b border-border-custom text-text-secondary flex justify-between items-center">
                    <div>
                      <span className="font-semibold block text-text-primary">Colleague accessed file</span>
                      <span className="text-[10px] text-text-secondary mt-0.5 block">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-text-secondary text-center py-4">This file has not been downloaded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
