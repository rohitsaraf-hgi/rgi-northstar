import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  X,
  RotateCcw,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useDemo } from '../../context/DemoContext.jsx';
import { usePersona, PERSONAS } from '../../context/PersonaContext.jsx';
import { MODULE_DEFINITIONS } from '../../data/modules.js';

const TIERS = [
  { id: 'starter', label: 'Starter', bg: '#3F4452', text: '#D8DAE5' },
  { id: 'growth', label: 'Growth', bg: '#1E3A8A', text: '#93C5FD' },
  { id: 'enterprise', label: 'Enterprise', bg: '#78350F', text: '#FCD34D' },
];

const INTEGRATIONS = [
  { id: 'salesforce', label: 'Salesforce' },
  { id: 'outreach', label: 'Outreach' },
  { id: 'hubspot', label: 'HubSpot' },
  { id: 'marketo', label: 'Marketo' },
];

function TierTile({ tier, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-2 py-2 rounded-md text-[11px] font-semibold transition-all ${
        active ? 'ring-1 ring-primary' : 'opacity-60 hover:opacity-90'
      }`}
      style={{ background: tier.bg, color: tier.text }}
    >
      {tier.label}
    </button>
  );
}

function Toggle({ label, on, onChange, accent }) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-bg/40 transition-colors text-left"
    >
      <span className="text-xs text-text-primary truncate">{label}</span>
      <span
        className={`relative inline-flex w-7 h-4 rounded-full transition-colors flex-shrink-0 ${
          on ? '' : 'bg-border-2'
        }`}
        style={on ? { background: accent || '#4F7FFF' } : {}}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${
            on ? 'left-3.5' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );
}

function PersonaTile({ persona, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-2 rounded-md text-left transition-all ${
        active ? 'ring-1 ring-primary bg-bg/40' : 'opacity-70 hover:opacity-100 hover:bg-bg/30'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <div
          className="w-4 h-4 rounded-full text-[8px] text-white font-bold flex items-center justify-center"
          style={{ background: persona.avatarColor }}
        >
          {persona.initials}
        </div>
        <span className="text-[10px] font-bold text-text-primary truncate flex-1">
          {persona.name.split(' ')[0]}
        </span>
        {persona.isNew && (
          <span className="text-[8px] uppercase tracking-wider px-1 py-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded font-bold">
            New
          </span>
        )}
      </div>
      <div className="text-[9px] text-text-muted leading-tight">{persona.role}</div>
    </button>
  );
}

function SectionHeader({ children }) {
  return (
    <div className="text-[9px] uppercase tracking-wider text-text-muted font-bold mb-1.5">
      {children}
    </div>
  );
}

export default function DemoControls() {
  const [open, setOpen] = useState(false);
  const { config, updateConfig, resetConfig } = useDemo();
  const { allPersonas } = usePersona();

  const toggleModule = (moduleId) => {
    const next = config.modulesOwned.includes(moduleId)
      ? config.modulesOwned.filter((m) => m !== moduleId)
      : [...config.modulesOwned, moduleId];
    updateConfig({ modulesOwned: next });
  };

  const toggleIntegration = (id) => {
    const next = config.integrationsConnected.includes(id)
      ? config.integrationsConnected.filter((i) => i !== id)
      : [...config.integrationsConnected, id];
    updateConfig({ integrationsConnected: next });
  };

  return (
    <>
      {/* Collapsed pill — fixed bottom right */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-4 right-4 z-[60] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-border-2 text-text-secondary hover:text-text-primary hover:border-primary/40 transition-colors text-xs font-medium shadow-card ${
          open ? 'ring-1 ring-primary' : ''
        }`}
        title="Demo controls"
      >
        <Settings size={12} />
        Demo
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-16 right-4 z-[60] w-[280px] bg-surface border border-border rounded-lg shadow-elev overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Settings size={11} className="text-primary" />
                <span className="text-xs font-semibold text-text-primary">Demo Controls</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-bg/40 text-text-muted"
              >
                <X size={12} />
              </button>
            </div>

            <div className="p-3 space-y-4">
              {/* Section 1 — Tier */}
              <div>
                <SectionHeader>Subscription Tier</SectionHeader>
                <div className="flex gap-1">
                  {TIERS.map((t) => (
                    <TierTile
                      key={t.id}
                      tier={t}
                      active={config.subscriptionTier === t.id}
                      onClick={() => updateConfig({ subscriptionTier: t.id })}
                    />
                  ))}
                </div>
              </div>

              {/* Section 2 — Modules */}
              <div>
                <SectionHeader>Modules Active</SectionHeader>
                <div className="space-y-0.5">
                  {MODULE_DEFINITIONS.map((m) => (
                    <Toggle
                      key={m.id}
                      label={m.name}
                      on={config.modulesOwned.includes(m.id)}
                      onChange={() => toggleModule(m.id)}
                      accent={m.color}
                    />
                  ))}
                </div>
              </div>

              {/* Section 3 — Persona */}
              <div>
                <SectionHeader>Active Persona</SectionHeader>
                <div className="grid grid-cols-2 gap-1">
                  {allPersonas.map((p) => (
                    <PersonaTile
                      key={p.id}
                      persona={p}
                      active={config.activePersona === p.id}
                      onClick={() => updateConfig({ activePersona: p.id })}
                    />
                  ))}
                </div>
              </div>

              {/* Section 4 — Integrations */}
              <div>
                <SectionHeader>Integrations</SectionHeader>
                <div className="space-y-0.5">
                  {INTEGRATIONS.map((i) => (
                    <Toggle
                      key={i.id}
                      label={i.label}
                      on={config.integrationsConnected.includes(i.id)}
                      onChange={() => toggleIntegration(i.id)}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={resetConfig}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 border border-border rounded-md text-[11px] text-text-secondary hover:bg-bg/40 hover:text-text-primary transition-colors"
              >
                <RotateCcw size={11} />
                Reset to defaults
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
