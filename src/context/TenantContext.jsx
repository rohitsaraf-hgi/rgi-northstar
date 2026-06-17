import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePersona } from './PersonaContext.jsx';
import { TENANT_FIXTURES, HG_TENANT, WIZ_TENANT, EMPTY_TENANT_SKELETON } from '../data/tenants.js';

// TenantContext owns the per-tenant "company profile" derived during PLG
// onboarding. Each persona is anchored to a tenant via persona.tenantId.
//
// We keep a per-tenant map in memory + localStorage so multiple tenants can
// coexist (HG personas use 'hg', the PLG Alex persona uses 'wiz'). The
// active tenant follows the active persona.

const STORAGE_KEY = 'rgi-tenants-v1';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveToStorage(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* no-op */
  }
}

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const { persona } = usePersona();
  const tenantId = persona.tenantId || 'hg';

  // Tenant map: { [tenantId]: TenantContext }
  // Seed with HG + Wiz so existing personas + the PLG demo persona both have
  // a valid tenant from initial load. The /signup flow re-derives Wiz live
  // for the demo motion, but the data is already here.
  const [tenants, setTenants] = useState(() => {
    const fromStorage = loadFromStorage();
    return {
      hg: HG_TENANT,
      wiz: WIZ_TENANT,
      ...fromStorage,
    };
  });

  // Persist on change
  useEffect(() => {
    saveToStorage(tenants);
  }, [tenants]);

  const upsertTenant = useCallback((tenantData) => {
    if (!tenantData?.id) return;
    setTenants((prev) => ({ ...prev, [tenantData.id]: tenantData }));
  }, []);

  const updateTenantField = useCallback((id, patch) => {
    setTenants((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || EMPTY_TENANT_SKELETON), ...patch },
    }));
  }, []);

  // Load a fixture if available (used by the PLG signup flow when the user
  // enters a URL that matches a known tenant).
  const seedFromFixture = useCallback((fixtureId) => {
    const fixture = TENANT_FIXTURES[fixtureId];
    if (fixture) {
      upsertTenant(fixture);
      return fixture;
    }
    return null;
  }, [upsertTenant]);

  const activeTenant = tenants[tenantId] || HG_TENANT;
  const hasTenant = !!tenants[tenantId];

  const value = {
    tenant: activeTenant,
    tenantId,
    hasTenant,
    tenants,
    upsertTenant,
    updateTenantField,
    seedFromFixture,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
