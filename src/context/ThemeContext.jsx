import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

// Light is the always-default. Dark is toggleable for the current session
// but does not persist across reloads — this avoids users getting stuck on
// dark from a forgotten toggle. Wipe any stored theme keys on mount.
const STALE_KEYS = ['rgi-theme', 'rgi-theme-v2', 'rgi-theme-v3'];

function wipeStaleThemeStorage() {
  if (typeof window === 'undefined') return;
  for (const k of STALE_KEYS) {
    try {
      window.localStorage.removeItem(k);
    } catch {}
  }
}

function resolveAppliedTheme(mode) {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return mode;
}

export function ThemeProvider({ children }) {
  // Always start in light. No localStorage read — light is the canonical default.
  const [mode, setMode] = useState('light');
  const [applied, setApplied] = useState('light');

  // One-time mount wipe of any stale theme keys.
  useEffect(() => {
    wipeStaleThemeStorage();
  }, []);

  useEffect(() => {
    const next = resolveAppliedTheme(mode);
    setApplied(next);
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.style.colorScheme = next;
    // Intentionally NOT persisting — we want light as the always-default.
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setApplied(resolveAppliedTheme('system'));
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((m) => (m === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, applied, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
