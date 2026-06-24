'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loadStoredCredentials } from '../store/slices/authSlice';

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    // Load stored credentials
    dispatch(loadStoredCredentials());

    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router, dispatch]);

  return (
    <div className="flex flex-1 items-center justify-center bg-[#0b0f19] text-slate-400">
      <div className="flex flex-col items-center gap-3">
        {/* Spinner */}
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium tracking-wider">CONNECTING TO ENTERPRISE PORTAL...</p>
      </div>
    </div>
  );
}
