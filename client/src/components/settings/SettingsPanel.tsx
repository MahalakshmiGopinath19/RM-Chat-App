'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { updateUserProfile } from '../../store/slices/authSlice';
import { toggleSidebar } from '../../store/slices/uiSlice';
import apiClient from '../../utils/apiClient';
import { User, ShieldAlert, Key, CheckCircle, AlertCircle, Menu } from 'lucide-react';

export default function SettingsPanel() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Profile Form States
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setProfileLoading(true);

    if (!profileName.trim()) {
      setProfileError('Name cannot be empty.');
      setProfileLoading(false);
      return;
    }

    try {
      await apiClient.put('/users/me', { name: profileName });
      dispatch(updateUserProfile({ name: profileName }));
      setProfileMessage('Profile details updated successfully.');
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    setPasswordLoading(true);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordLoading(false);
      return;
    }

    try {
      await apiClient.post('/auth/change-password', { oldPassword, newPassword });
      setPasswordMessage('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Incorrect old password.');
    } finally {
      setPasswordLoading(false);
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
            <h4 className="text-lg font-bold text-text-primary tracking-wide truncate">Account Settings</h4>
            <p className="text-sm text-text-secondary mt-0.5 uppercase tracking-wider font-semibold">Configure your profile details and security credentials</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 max-w-2xl mx-auto w-full space-y-6">
        {/* Profile Card */}
        <div className="bg-bg-secondary border border-border-custom rounded-xl p-5 shadow-lg space-y-4">
          <h5 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <User className="w-5.5 h-5.5 text-indigo-400" />
            <span>Profile Details</span>
          </h5>

          {profileMessage && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 p-3 rounded-lg text-xs">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{profileMessage}</span>
            </div>
          )}

          {profileError && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 text-rose-455 p-3 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Employee ID</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.employeeId || ''}
                  className="w-full bg-bg-tertiary/50 border border-border-custom text-text-secondary rounded-lg p-3 outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Official Email</label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full bg-bg-tertiary/50 border border-border-custom text-text-secondary rounded-lg p-3 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Display Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="bg-indigo-650 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors"
              >
                {profileLoading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-bg-secondary border border-border-custom rounded-xl p-5 shadow-lg space-y-4">
          <h5 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Key className="w-5.5 h-5.5 text-indigo-400" />
            <span>Update Password</span>
          </h5>

          {passwordMessage && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-450 p-3 rounded-lg text-xs">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{passwordMessage}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 text-rose-455 p-3 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Old Password</label>
              <input
                type="password"
                required
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="bg-indigo-650 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
