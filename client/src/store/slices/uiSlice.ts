import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type TabType =
  | 'chats'
  | 'departments'
  | 'teams'
  | 'announcements'
  | 'files'
  | 'search'
  | 'notifications'
  | 'reports'
  | 'userManagement'
  | 'settings'
  | 'tasks';

interface UiState {
  activeTab: TabType;
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  theme: 'dark' | 'light';
}

const initialState: UiState = {
  activeTab: 'chats',
  sidebarOpen: true,
  rightPanelOpen: false,
  theme: 'dark' // Premium default dark mode
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<TabType>) => {
      state.activeTab = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleRightPanel: (state) => {
      state.rightPanelOpen = !state.rightPanelOpen;
    },
    setRightPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.rightPanelOpen = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme);
      }
    },
    loadStoredTheme: (state) => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('theme') as 'dark' | 'light' | null;
        if (stored) {
          state.theme = stored;
        }
      }
    }
  }
});

export const {
  setActiveTab,
  toggleSidebar,
  setSidebarOpen,
  toggleRightPanel,
  setRightPanelOpen,
  toggleTheme,
  loadStoredTheme
} = uiSlice.actions;

export default uiSlice.reducer;
export type { TabType };
