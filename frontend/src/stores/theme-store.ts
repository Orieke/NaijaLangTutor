import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,

      toggleDarkMode: () => {
        const newValue = !get().isDarkMode;
        set({ isDarkMode: newValue });
        applyTheme(newValue);
      },

      setDarkMode: (value: boolean) => {
        set({ isDarkMode: value });
        applyTheme(value);
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme on initial load
        if (state) {
          applyTheme(state.isDarkMode);
        }
      },
    }
  )
);

// Apply theme to document
function applyTheme(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Initialize theme on load (handles system preference check)
export function initializeTheme() {
  const store = useThemeStore.getState();
  applyTheme(store.isDarkMode);
}
