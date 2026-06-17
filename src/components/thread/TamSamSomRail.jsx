import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Users,
  Target,
  TrendingDown,
  Swords,
  LayoutGrid,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

// Adaptive right rail for TAM/SAM/SOM threads. Cards appear in conversation
// order (scope → ICP → SAM → SOM → competitors → whitespace) and only after
// each section has data. Each card has a "view turn" jump that scrolls the
// conversation to the originating AI turn.

function Card({ icon: Icon, label, children, sourceTurnId, onJump, accent = 'text-text-muted', accentBg = 'bg-text-muted/15' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="px-4 py-3 border-b border-border last:border-0"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-5 h-5 rounded ${accentBg} flex items-center justify-center`}>
          <Icon size={11} className={accent} />
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{label}</span>
        {sourceTurnId && (
          <button
            onClick={() => onJump && onJump(sourceTurnId)}
            className="ml-auto text-[10px] text-text-muted hover:text-primary transition-colors inline-flex items-center gap-0.5"
            title="Jump to this section in the conversation"
          >
            View
            <ArrowRight size={9} />
          </button>
        )}
      </div>
      {children}
    </motion.div>
  );
}

function StatLine({ value, label, dim }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-base font-semibold tracking-tight ${dim ? 'text-text-muted' : 'text-text-primary'}`}>
        {value}
      </span>
      <span className="text-[10px] text-text-muted">{label}</span>
    </div>
  );
}

function ChipRow({ items, max = 3 }) {
  const visible = items.slice(0, max);
  const overflow = items.length - max;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((v, i) => (
        <span
          key={i}
          className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium truncate max-w-[140px]"
          title={v}
        >
          {v}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-[10px] text-text-muted px-1 py-0.5">+{overflow} more</span>
      )}
    </div>
  );
}

export default function TamSamSomRail({ thread, state = {}, onJump }) {
  const { tam, icp, sam, som, competitors, whitespace } = state;

  return (
    <div className="h-full flex flex-col bg-surface border-l border-border overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-bg/40">
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-0.5">
          Project · TAM/SAM/SOM
        </div>
        <div className="text-sm font-semibold text-text-primary truncate">{thread.name}</div>
        <div className="text-[11px] text-text-muted mt-1 inline-flex items-center gap-1">
          <Sparkles size={9} className="text-primary" />
          Cards appear as you build the analysis
        </div>
      </div>

      <AnimatePresence>
        {tam && (
          <Card
            key="tam"
            icon={Globe}
            label="Total Addressable Market"
            sourceTurnId={tam.sourceTurnId}
            onJump={onJump}
            accent="text-blue-700 dark:text-blue-300"
            accentBg="bg-blue-500/15"
          >
            <StatLine value={tam.spend} label="spend" />
            <StatLine value={tam.companies} label="companies" />
            {tam.filters && tam.filters.length > 0 && (
              <div className="mt-1.5">
                <ChipRow items={tam.filters} />
              </div>
            )}
          </Card>
        )}

        {icp && (
          <Card
            key="icp"
            icon={Users}
            label={icp.derived ? 'ICP (derived)' : 'ICP'}
            sourceTurnId={icp.sourceTurnId}
            onJump={onJump}
            accent="text-emerald-700 dark:text-emerald-300"
            accentBg="bg-emerald-500/15"
          >
            <div className="space-y-1.5">
              {icp.industries?.length > 0 && (
                <div>
                  <div className="text-[10px] text-text-muted mb-0.5">Industries</div>
                  <ChipRow items={icp.industries} />
                </div>
              )}
              {icp.geographies?.length > 0 && (
                <div>
                  <div className="text-[10px] text-text-muted mb-0.5">Geo</div>
                  <ChipRow items={icp.geographies} />
                </div>
              )}
              {icp.revenue?.length > 0 && (
                <div>
                  <div className="text-[10px] text-text-muted mb-0.5">Revenue</div>
                  <ChipRow items={icp.revenue} />
                </div>
              )}
              {icp.employees?.length > 0 && (
                <div>
                  <div className="text-[10px] text-text-muted mb-0.5">Employees</div>
                  <ChipRow items={icp.employees} />
                </div>
              )}
            </div>
            {icp.sourceCount && (
              <div className="text-[10px] text-text-muted mt-1.5">
                Derived from {icp.sourceCount} customers
              </div>
            )}
          </Card>
        )}

        {sam && (
          <Card
            key="sam"
            icon={Target}
            label="Serviceable Addressable Market"
            sourceTurnId={sam.sourceTurnId}
            onJump={onJump}
            accent="text-purple-700 dark:text-purple-300"
            accentBg="bg-purple-500/15"
          >
            <StatLine value={sam.spend} label="spend" />
            <StatLine value={sam.companies} label="companies" />
            {sam.pctOfTam && (
              <div className="text-[10px] text-text-muted mt-1">{sam.pctOfTam} of TAM</div>
            )}
          </Card>
        )}

        {som && (
          <Card
            key="som"
            icon={TrendingDown}
            label="Serviceable Obtainable Market"
            sourceTurnId={som.sourceTurnId}
            onJump={onJump}
            accent="text-amber-700 dark:text-amber-300"
            accentBg="bg-amber-500/15"
          >
            <StatLine value={som.spend} label="spend" />
            <StatLine value={som.companies} label="companies" />
            {som.pctOfSam && (
              <div className="text-[10px] text-text-muted mt-1">{som.pctOfSam} of SAM</div>
            )}
          </Card>
        )}

        {competitors && competitors.length > 0 && (
          <Card
            key="competitors"
            icon={Swords}
            label="Competitive overlap"
            sourceTurnId={competitors[0]?.sourceTurnId}
            onJump={onJump}
            accent="text-rose-700 dark:text-rose-300"
            accentBg="bg-rose-500/15"
          >
            <div className="space-y-1.5">
              {competitors.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-text-primary font-medium truncate">{c.name}</span>
                  <span className="text-[11px] font-mono text-rose-700 dark:text-rose-300">
                    {c.penetrationPct}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {whitespace && (
          <Card
            key="whitespace"
            icon={LayoutGrid}
            label="Whitespace classification"
            sourceTurnId={whitespace.sourceTurnId}
            onJump={onJump}
            accent="text-cyan-700 dark:text-cyan-300"
            accentBg="bg-cyan-500/15"
          >
            <StatLine value={whitespace.total.toLocaleString()} label="organizations" />
            <div className="grid grid-cols-3 gap-1 mt-2 text-center">
              <div className="px-1.5 py-1.5 rounded bg-emerald-500/10">
                <div className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-bold">Customer</div>
                <div className="text-sm font-semibold text-text-primary">{whitespace.customer}</div>
              </div>
              <div className="px-1.5 py-1.5 rounded bg-purple-500/10">
                <div className="text-[10px] uppercase tracking-wider text-purple-700 dark:text-purple-300 font-bold">Expansion</div>
                <div className="text-sm font-semibold text-text-primary">{whitespace.expansion}</div>
              </div>
              <div className="px-1.5 py-1.5 rounded bg-fuchsia-500/10">
                <div className="text-[10px] uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300 font-bold">Prospect</div>
                <div className="text-sm font-semibold text-text-primary">{whitespace.prospect}</div>
              </div>
            </div>
          </Card>
        )}
      </AnimatePresence>

      {/* Footer hint when nothing yet */}
      {!tam && !icp && (
        <div className="px-4 py-6 text-center text-[11px] text-text-muted">
          As you describe scope, drop a CSV, and add competitors, this rail will fill in.
        </div>
      )}
    </div>
  );
}
