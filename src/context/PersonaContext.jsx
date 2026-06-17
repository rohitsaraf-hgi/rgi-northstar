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
  maya: {
    id: 'maya',
    name: 'Maya Patel',
    role: 'Marketing Strategist',
    roleType: 'strategist',
    initials: 'MP',
    avatarColor: '#A855F7',
    avatarBg: 'bg-purple-500/20',
    avatarText: 'text-purple-700 dark:text-purple-300',
    department: 'Marketing & Strategy',
    permissions: PERMISSIONS_BY_ROLE.strategist,
    tenantId: 'hg',
  },
  jordan: {
    id: 'jordan',
    name: 'Jordan Chen',
    role: 'Account Executive',
    roleType: 'seller',
    salesRole: 'AE',
    initials: 'JC',
    avatarColor: '#F97316',
    avatarBg: 'bg-orange-500/20',
    avatarText: 'text-orange-700 dark:text-orange-300',
    department: 'Sales & Pipeline',
    permissions: PERMISSIONS_BY_ROLE.seller,
  },
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
  },
  riley: {
    id: 'riley',
    name: 'Riley Cooper',
    role: 'Account Executive',
    roleType: 'seller',
    salesRole: 'AE',
    initials: 'RC',
    avatarColor: '#10B981', // emerald — distinct from Jordan's orange
    avatarBg: 'bg-emerald-500/20',
    avatarText: 'text-emerald-700 dark:text-emerald-300',
    department: 'Sales & Pipeline',
    permissions: PERMISSIONS_BY_ROLE.seller,
    isNew: true, // triggers Day-1 workspace experience
    accountCreated: 'April 30',
    bookSize: 247,
    inheritedFrom: 'Aisha Patel',
    // Admin-set policy: new AEs (<90d tenure) downgrade any agent that would
    // 'Act' to 'Draft' so the AE always sees and approves the outgoing
    // artifact before it leaves the platform.
    agentPolicy: { downgradeAct: 'draft' },
    tenantId: 'hg',
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
  const [personaId, setPersonaId] = useState('maya');
  const [isSwitching, setIsSwitching] = useState(false);

  const switchPersona = useCallback((newId) => {
    if (newId === personaId) return;
    setIsSwitching(true);
    setTimeout(() => {
      setPersonaId(newId);
      setTimeout(() => setIsSwitching(false), 200);
    }, 600);
  }, [personaId]);

  const value = {
    persona: PERSONAS[personaId],
    personaId,
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
