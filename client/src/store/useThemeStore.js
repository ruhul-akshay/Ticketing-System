import { create } from 'zustand';

const primaryConfigs = {
  indigo: {
    from: '#2563eb',
    to: '#4f46e5',
    hoverFrom: '#3b82f6',
    hoverTo: '#6366f1',
    solid: '#2563eb',
    glow: 'rgba(79, 70, 229, 0.1)'
  },
  red: {
    from: '#dc2626',
    to: '#f97316',
    hoverFrom: '#ef4444',
    hoverTo: '#fb923c',
    solid: '#dc2626',
    glow: 'rgba(220, 38, 38, 0.1)'
  },
  emerald: {
    from: '#059669',
    to: '#14b8a6',
    hoverFrom: '#10b981',
    hoverTo: '#2dd4bf',
    solid: '#059669',
    glow: 'rgba(5, 150, 105, 0.1)'
  },
  purple: {
    from: '#7c3aed',
    to: '#d946ef',
    hoverFrom: '#8b5cf6',
    hoverTo: '#e879f9',
    solid: '#7c3aed',
    glow: 'rgba(124, 58, 237, 0.1)'
  },
  cyberpunk: {
    from: '#ec4899',
    to: '#06b6d4',
    hoverFrom: '#f43f5e',
    hoverTo: '#22d3ee',
    solid: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.1)'
  },
  slate: {
    from: '#334155',
    to: '#64748b',
    hoverFrom: '#475569',
    hoverTo: '#94a3b8',
    solid: '#334155',
    glow: 'rgba(51, 65, 85, 0.1)'
  }
};

const accentConfigs = {
  blue: { solid: '#3b82f6', glow: 'rgba(59, 130, 246, 0.15)' },
  emerald: { solid: '#10b981', glow: 'rgba(16, 185, 129, 0.15)' },
  purple: { solid: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.15)' },
  amber: { solid: '#f59e0b', glow: 'rgba(245, 158, 11, 0.15)' },
  rose: { solid: '#f43f5e', glow: 'rgba(244, 63, 94, 0.15)' },
  indigo: { solid: '#6366f1', glow: 'rgba(99, 102, 241, 0.15)' }
};

const applyStylesHelper = (themeMode, primaryKey, accentKey) => {
  if (typeof window === 'undefined') return 'dark';
  
  const root = document.documentElement;
  
  // Resolve Theme Mode
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let isDark = themeMode === 'dark';
  if (themeMode === 'system') {
    isDark = mediaQuery.matches;
  }
  
  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  
  // Apply Primary Color variables
  const primary = primaryConfigs[primaryKey] || primaryConfigs.indigo;
  root.style.setProperty('--primary-brand-from', primary.from);
  root.style.setProperty('--primary-brand-to', primary.to);
  root.style.setProperty('--primary-brand-hover-from', primary.hoverFrom);
  root.style.setProperty('--primary-brand-hover-to', primary.hoverTo);
  root.style.setProperty('--primary-brand-solid', primary.solid);
  root.style.setProperty('--primary-brand-glow', primary.glow);

  // Apply Accent Color variables
  const accent = accentConfigs[accentKey] || accentConfigs.blue;
  root.style.setProperty('--accent-brand-solid', accent.solid);
  root.style.setProperty('--accent-brand-glow', accent.glow);
  
  return isDark ? 'dark' : 'light';
};

export const useThemeStore = create((set, get) => {
  // Listen for system theme media query changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (get().theme === 'system' || get().previewTheme === 'system') {
        get().applyCurrentStyles();
      }
    });
  }

  return {
    theme: localStorage.getItem('theme') || 'system',
    primaryColor: localStorage.getItem('primaryColor') || 'indigo',
    accentColor: localStorage.getItem('accentColor') || 'blue',
    resolvedTheme: 'dark', // Computed

    // Preview state (holds visual changes during settings editing)
    previewTheme: localStorage.getItem('theme') || 'system',
    previewPrimaryColor: localStorage.getItem('primaryColor') || 'indigo',
    previewAccentColor: localStorage.getItem('accentColor') || 'blue',

    applyCurrentStyles: () => {
      // If we are in settings preview mode, apply preview values, otherwise apply saved values
      const isPreview = get().previewTheme !== get().theme || 
                        get().previewPrimaryColor !== get().primaryColor ||
                        get().previewAccentColor !== get().accentColor;
      
      const t = isPreview ? get().previewTheme : get().theme;
      const p = isPreview ? get().previewPrimaryColor : get().primaryColor;
      const a = isPreview ? get().previewAccentColor : get().accentColor;
      
      const resolved = applyStylesHelper(t, p, a);
      set({ resolvedTheme: resolved });
    },

    initFromUser: (preferences) => {
      if (!preferences) return;
      const t = preferences.theme || 'system';
      const p = preferences.primaryColor || 'indigo';
      const a = preferences.accentColor || 'blue';

      localStorage.setItem('theme', t);
      localStorage.setItem('primaryColor', p);
      localStorage.setItem('accentColor', a);

      set({
        theme: t,
        primaryColor: p,
        accentColor: a,
        previewTheme: t,
        previewPrimaryColor: p,
        previewAccentColor: a
      });
      get().applyCurrentStyles();
    },

    setTheme: (t) => {
      localStorage.setItem('theme', t);
      set({ theme: t, previewTheme: t });
      get().applyCurrentStyles();
    },

    toggleTheme: () => {
      const nextTheme = get().resolvedTheme === 'dark' ? 'light' : 'dark';
      get().setTheme(nextTheme);
    },

    // Settings actions (temporary preview)
    setPreviewTheme: (t) => {
      set({ previewTheme: t });
      get().applyCurrentStyles();
    },

    setPreviewPrimaryColor: (p) => {
      set({ previewPrimaryColor: p });
      get().applyCurrentStyles();
    },

    setPreviewAccentColor: (a) => {
      set({ previewAccentColor: a });
      get().applyCurrentStyles();
    },

    savePreferences: () => {
      const t = get().previewTheme;
      const p = get().previewPrimaryColor;
      const a = get().previewAccentColor;

      localStorage.setItem('theme', t);
      localStorage.setItem('primaryColor', p);
      localStorage.setItem('accentColor', a);

      set({
        theme: t,
        primaryColor: p,
        accentColor: a
      });
      get().applyCurrentStyles();

      return {
        theme: t,
        primaryColor: p,
        accentColor: a
      };
    },

    cancelPreview: () => {
      const t = get().theme;
      const p = get().primaryColor;
      const a = get().accentColor;

      set({
        previewTheme: t,
        previewPrimaryColor: p,
        previewAccentColor: a
      });
      get().applyCurrentStyles();
    }
  };
});
