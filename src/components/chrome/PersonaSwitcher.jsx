import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Check, ShieldCheck, User as UserIcon, Briefcase, Sparkles } from 'lucide-react';
import { usePersona } from '../../context/PersonaContext.jsx';
import Avatar from '../shared/Avatar.jsx';

const TENANT_LABELS = {
  hg: 'HG Insights',
  wiz: 'Wiz',
};

export default function PersonaSwitcher({ collapsed }) {
  const navigate = useNavigate();
  const { persona, allPersonas, switchPersona } = usePersona();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Group personas by tenant for the dropdown
  const byTenant = allPersonas.reduce((acc, p) => {
    const tid = p.tenantId || 'hg';
    acc[tid] = acc[tid] || [];
    acc[tid].push(p);
    return acc;
  }, {});

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2.5 p-2 rounded-md hover:bg-surface-2 transition-colors ${
          open ? 'bg-surface-2' : ''
        }`}
        title="Switch persona (demo)"
      >
        <Avatar name={persona.name} initials={persona.initials} color={persona.avatarColor} size={32} />
        {!collapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{persona.name}</div>
              <div className="text-xs text-text-muted truncate">
                {persona.role} · {TENANT_LABELS[persona.tenantId || 'hg']}
              </div>
            </div>
            <ChevronUp
              size={14}
              className={`text-text-muted transition-transform ${open ? '' : 'rotate-180'}`}
            />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-surface-2 border border-border rounded-lg shadow-2xl overflow-hidden z-50"
          >
            <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-text-muted border-b border-border bg-bg/40">
              Demo: Switch Persona
            </div>

            {Object.entries(byTenant).map(([tid, personas]) => (
              <div key={tid}>
                <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider text-text-muted/70 font-semibold bg-bg/20">
                  {TENANT_LABELS[tid] || tid}
                </div>
                {personas.map((p) => {
                  const RoleIcon = p.roleType === 'admin' ? ShieldCheck : p.roleType === 'seller' ? Briefcase : UserIcon;
                  const roleTone =
                    p.roleType === 'admin'
                      ? 'text-primary'
                      : p.roleType === 'seller'
                      ? 'text-orange-700 dark:text-orange-300'
                      : 'text-purple-700 dark:text-purple-300';
                  const roleBg =
                    p.roleType === 'admin'
                      ? 'bg-primary/10'
                      : p.roleType === 'seller'
                      ? 'bg-orange-500/10'
                      : 'bg-purple-500/10';
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchPersona(p.id);
                        setOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 hover:bg-bg/60 transition-colors text-left"
                    >
                      <Avatar name={p.name} initials={p.initials} color={p.avatarColor} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-text-primary truncate flex items-center gap-1.5">
                          {p.name}
                          {p.plgUser && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider px-1 py-0.5 bg-sky-500/10 text-sky-700 dark:text-sky-300 rounded font-bold">
                              <Sparkles size={8} /> PLG
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${roleBg} ${roleTone}`}
                          >
                            <RoleIcon size={9} />
                            {p.roleType}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">{p.role}</span>
                        </div>
                      </div>
                      {p.id === persona.id && <Check size={14} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            ))}

            <button
              onClick={() => {
                setOpen(false);
                navigate('/signup');
              }}
              className="w-full flex items-center gap-2 p-2.5 hover:bg-bg/60 transition-colors text-left border-t border-border"
            >
              <div className="w-7 h-7 rounded-md bg-sky-500/15 flex items-center justify-center flex-shrink-0">
                <Sparkles size={13} className="text-sky-700 dark:text-sky-300" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-text-primary">Try PLG sign-up</div>
                <div className="text-[10px] text-text-muted">Watch Phoenix derive a new tenant from a URL</div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
