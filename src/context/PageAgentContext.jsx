import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

// ─── Page Agent ─────────────────────────────────────────────────────
//
// A page-scoped AI assistant. Every page can register its own agent —
// a CTA label ("Manage your projects with AI") plus a set of suggested
// actions. The actions are page-defined: each one mocks the agent
// reaching into the page and modifying it (flipping visibility, renaming
// rows, reordering, surfacing an insight…).
//
// The launcher itself (PageAgentLauncher) is rendered once in AppShell.
// Pages talk to it through `usePageAgent(config)`, which registers on
// mount and tears down on unmount so the CTA always matches the route.

const PageAgentContext = createContext(null);

export function PageAgentProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [open, setOpen] = useState(false);

  const registerAgent = useCallback((cfg) => {
    setConfig(cfg);
  }, []);

  const clearAgent = useCallback((id) => {
    setConfig((cur) => (cur && cur.__id === id ? null : cur));
    setOpen(false);
  }, []);

  return (
    <PageAgentContext.Provider
      value={{ config, open, setOpen, registerAgent, clearAgent }}
    >
      {children}
    </PageAgentContext.Provider>
  );
}

export function usePageAgentControls() {
  const ctx = useContext(PageAgentContext);
  if (!ctx) {
    throw new Error('usePageAgentControls must be used within PageAgentProvider');
  }
  return ctx;
}

// Pages call this to register their agent. The `run` callbacks inside
// `config.suggestions` should use functional state updates (and refs for
// any read-after-write summary), since the config is registered once and
// would otherwise close over stale state.
let _seq = 0;
export function usePageAgent(config) {
  const ctx = useContext(PageAgentContext);
  const idRef = useRef(`page-agent-${(_seq += 1)}`);
  const cfgRef = useRef(config);
  cfgRef.current = config;

  useEffect(() => {
    if (!ctx) return undefined;
    const id = idRef.current;
    ctx.registerAgent({ ...cfgRef.current, __id: id });
    return () => ctx.clearAgent(id);
    // Register once per mount — see note above about functional updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
