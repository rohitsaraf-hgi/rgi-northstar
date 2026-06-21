import { createContext, useContext, useState, useCallback } from 'react';

const PersonaContext = createContext(null);

// Role-derived permissions. Admin gets configuration / playbook authoring
// privileges. Sellers and strategists are consumers — they run workflows
// but can't change platform settings or build playbooks for others.
const PERMISSIONS_BY_ROLE = {
  admin: {
    canAccessAdmin: true,
    canConfigure: true,
    canManageUsers: true,
    canBuildPlaybooks: true,
    canTuneModels: true,
    canAuditRouting: true,
    canApproveModels: true,
  },
  seller: {
    canAccessAdmin: false,
    canConfigure: false,
    canManageUsers: false,
    canBuildPlaybooks: false,
    canTuneModels: false,
    canAuditRouting: false,
    canApproveModels: false,
  },
  strategist: {
    canAccessAdmin: false,
    canConfigure: false,
    canManageUsers: false,
    canBuildPlaybooks: false,
    canTuneModels: false,
    canAuditRouting: false,
    canApproveModels: true, // strategists can approve model changes that affect their segments
  },
};

export const PERSONAS = {
  priya: {
    id: 'priya',
    name: 'Priya Sharma',
    role: 'RevOps Manager',
    roleType: 'admin',
    initials: 'PS',
    avatarColor: '#3B82F6',
    avatarBg: 'bg-blue-500/20',
    avatarText: 'text-blue-700 dark:text-blue-300',
    department: 'Revenue Operations',
    permissions: PERMISSIONS_BY_ROLE.admin,
    // Anchored to the Wiz tenant so the demo (Wiz Cloud Security Platform
    // / Wiz Code / Wiz Defend) reads consistent data alongside Alex.
    tenantId: 'wiz',
  },
  // PLG demo persona — created via the /signup flow targeting wiz.io.
  alex: {
    id: 'alex',
    name: 'Alex Chen',
    role: 'Account Executive',
    roleType: 'seller',
    salesRole: 'AE',
    initials: 'AC',
    avatarColor: '#0EA5E9',
    avatarBg: 'bg-sky-500/20',
    avatarText: 'text-sky-700 dark:text-sky-300',
    department: 'Sales',
    permissions: PERMISSIONS_BY_ROLE.seller,
    tenantId: 'wiz',
    isNew: false,
    plgUser: true,
  },
};

export function PersonaProvider({ children }) {
  const [personaId, setPersonaId] = useState('priya');
  const [isSwitching, setIsSwitching] = useState(false);

  const switchPersona = useCallback((newId) => {
    if (newId === personaId) return;
    setIsSwitching(true);
    setTimeout(() => {
      setPersonaId(newId);
      setTimeout(() => setIsSwitching(false), 200);
    }, 600);
  }, [personaId]);

  // Fallback to Priya if a stale persona id sneaks in (e.g. from an old
  // localStorage entry from when Maya/Jordan/Riley still existed). Without
  // this, downstream code dereferencing persona.name etc. would crash.
  const resolvedPersona = PERSONAS[personaId] || PERSONAS.priya;
  const value = {
    persona: resolvedPersona,
    personaId: resolvedPersona.id,
    switchPersona,
    isSwitching,
    allPersonas: Object.values(PERSONAS),
  };

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error('usePersona must be used within PersonaProvider');
  return ctx;
}

// Convenience hook for components that only care about permissions
export function usePermissions() {
  const { persona } = usePersona();
  return persona.permissions;
}
