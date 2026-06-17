import { createContext, useContext, useState, useCallback } from 'react';

const CompanyDetailContext = createContext(null);

export function CompanyDetailProvider({ children }) {
  const [openCompanyId, setOpenCompanyId] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  const openCompany = useCallback((id, tab = 'summary') => {
    setOpenCompanyId(id);
    setActiveTab(tab);
  }, []);

  const closeCompany = useCallback(() => setOpenCompanyId(null), []);

  return (
    <CompanyDetailContext.Provider
      value={{ openCompanyId, activeTab, setActiveTab, openCompany, closeCompany }}
    >
      {children}
    </CompanyDetailContext.Provider>
  );
}

export function useCompanyDetail() {
  const ctx = useContext(CompanyDetailContext);
  if (!ctx) throw new Error('useCompanyDetail must be used within CompanyDetailProvider');
  return ctx;
}
