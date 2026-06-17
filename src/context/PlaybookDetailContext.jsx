import { createContext, useContext, useState, useCallback } from 'react';

const PlaybookDetailContext = createContext(null);

export function PlaybookDetailProvider({ children }) {
  const [openId, setOpenId] = useState(null);
  const [tab, setTab] = useState('summary');

  const open = useCallback((id, initialTab = 'summary') => {
    setOpenId(id);
    setTab(initialTab);
  }, []);

  const close = useCallback(() => setOpenId(null), []);

  return (
    <PlaybookDetailContext.Provider value={{ openId, tab, setTab, open, close }}>
      {children}
    </PlaybookDetailContext.Provider>
  );
}

export function usePlaybookDetail() {
  const ctx = useContext(PlaybookDetailContext);
  if (!ctx) throw new Error('usePlaybookDetail must be used within PlaybookDetailProvider');
  return ctx;
}
