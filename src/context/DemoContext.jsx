import { createContext, useContext, useState, useCallback } from 'react';
import { usePersona } from './PersonaContext.jsx';

// DemoContext is the presenter's live demo configuration. Tier, module
// ownership, and integration connections live here. Persona is sourced from
// PersonaContext (not duplicated) — calling updateConfig({activePersona})
// proxies to switchPersona() so the sidebar switcher and Demo Controls stay
// synchronized.

const defaultConfig = {
  subscriptionTier: 'growth',
  modulesOwned: ['market_analyzer', 'sales_copilot'],
  // Connected by default for demo realism: SFDC + Outreach + first-party
  // signals (Amplitude / Marketo / Segment). HubSpot stays disconnected so
  // we can showcase graceful-degradation in the Account Brief.
  integrationsConnected: ['salesforce', 'outreach', 'amplitude', 'marketo', 'segment'],
};

const DemoContext = createContext(null);

const TIER_ORDER = ['starter', 'growth', 'enterprise'];

export function DemoProvider({ children }) {
  const { personaId, switchPersona } = usePersona();
  const [config, setConfig] = useState(defaultConfig);

  const updateConfig = useCallback(
    (updates) => {
      if (updates && 'activePersona' in updates) {
        switchPersona(updates.activePersona);
        const { activePersona, ...rest } = updates;
        if (Object.keys(rest).length > 0) {
          setConfig((prev) => ({ ...prev, ...rest }));
        }
      } else {
        setConfig((prev) => ({ ...prev, ...updates }));
      }
    },
    [switchPersona]
  );

  const resetConfig = useCallback(() => {
    setConfig(defaultConfig);
    switchPersona('priya');
  }, [switchPersona]);

  const hasModule = useCallback(
    (moduleId) => config.modulesOwned.includes(moduleId),
    [config.modulesOwned]
  );

  const hasTier = useCallback(
    (tier) => TIER_ORDER.indexOf(config.subscriptionTier) >= TIER_ORDER.indexOf(tier),
    [config.subscriptionTier]
  );

  const hasIntegration = useCallback(
    (integration) => config.integrationsConnected.includes(integration),
    [config.integrationsConnected]
  );

  const value = {
    config: { ...config, activePersona: personaId },
    updateConfig,
    resetConfig,
    hasModule,
    hasTier,
    hasIntegration,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
}
