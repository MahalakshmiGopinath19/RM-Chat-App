import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  status: 'active' | 'inactive' | 'blocked';
  avatar?: string;
  department?: {
    _id: string;
    name: string;
  } | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

// Check if window is defined (Next.js SSR safety)
const isClient = typeof window !== 'undefined';

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (isClient) {
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
    },
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      if (isClient) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
    loadStoredCredentials: (state) => {
      if (isClient) {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
          state.token = token;
          state.user = JSON.parse(user);
          state.isAuthenticated = true;
        }
      }
    },
    updateUserProfile: (state, action: PayloadAction<{ name: string; avatar?: string }>) => {
      if (state.user) {
        state.user.name = action.payload.name;
        if (action.payload.avatar !== undefined) {
          state.user.avatar = action.payload.avatar;
        }
        if (isClient) {
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      }
    }
  },
});

export const { setCredentials, logOut, loadStoredCredentials, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
