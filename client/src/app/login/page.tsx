'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setCredentials } from '../../store/slices/authSlice';
import apiClient from '../../utils/apiClient';
import { Shield, Mail, Key, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!loginId || !password) {
      setError('Please fill in all credentials.');
      setLoading(false);
      return;
    }

    try {
      // Gather browser/device info
      const ua = navigator.userAgent;
      const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Edge';
      const os = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : 'Linux';

      const response = await apiClient.post('/auth/login', {
        loginId,
        password,
        deviceInfo: {
          browser,
          os
        }
      });

      const { token, user } = response.data;
      dispatch(setCredentials({ token, user }));
      router.replace('/dashboard');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to authenticate. Check server connection.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-background relative overflow-hidden px-4">
      {/* Background Neon Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

      {/* Main card */}
      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-bg-tertiary border border-border-custom rounded-xl flex items-center justify-center text-indigo-650 mb-4 shadow-lg shadow-indigo-550/5">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Enterprise Connect</h2>
          <p className="text-sm text-text-secondary mt-1">Company Communication Platform</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 p-3.5 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Email or Employee ID
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary">
                <Mail className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="EMP001 or name@company.com"
                className="w-full bg-bg-tertiary border border-border-custom focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition-all duration-200"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary">
                <Key className="w-4.5 h-4.5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-tertiary border border-border-custom focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition-all duration-200"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-650 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Access Account'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-custom text-center">
          <p className="text-xs text-text-secondary/60">
            For security reasons, session timeout is active. Contact your IT administrator for credential recoveries.
          </p>
        </div>
      </div>
    </div>
  );
}
