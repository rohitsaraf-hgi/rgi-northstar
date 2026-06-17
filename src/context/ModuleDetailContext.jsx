import { createContext, useContext, useState, useCallback } from 'react';

const ModuleDetailContext = createContext(null);

export function ModuleDetailProvider({ children }) {
  const [openModuleId, setOpenModuleId] = useState(null);
  const open = useCallback((moduleId) => setOpenModuleId(moduleId), []);
  const close = useCallback(() => setOpenModuleId(null), []);

  return (
    <ModuleDetailContext.Provider value={{ openModuleId, open, close }}>
      {children}
    </ModuleDetailContext.Provider>
  );
}

export function useModuleDetail() {
  const ctx = useContext(ModuleDetailContext);
  if (!ctx) throw new Error('useModuleDetail must be used within ModuleDetailProvider');
  return ctx;
}
