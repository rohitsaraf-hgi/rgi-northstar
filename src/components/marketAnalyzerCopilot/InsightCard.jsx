// Insight Card — the atomic, shareable output of every JTBD.
//
// Spec MACLAUDE.md §6: gradient header, metric grid (3-col → 2-col →
// 1-col), signal attribution pills, confidence indicator. The card is
// "open-ended" — whichever sections are present on the fixture get
// rendered. New JTBDs can introduce new sections without changing this
// file as long as a renderer lives in InsightCardSections.jsx.

import { Share2, Download, Sparkles } from 'lucide-react';
import {
  TierList,
  CompetitorShareDonut,
  IndustryAttractiveness,
  SpendTrendSparkline,
  SpendDistribution,
  DecayForecast,
  LockInRisk,
  DepartmentEntry,
} from './InsightCardSections.jsx';

const SIGNAL_COLOR = {
  'HG Install Data':         { bg: 'bg-sky-500/10',     text: 'text-sky-700 dark:text-sky-300',         border: 'border-sky-500/30' },
  'IT Spend Signal':         { bg: 'bg-amber-500/10',   text: 'text-amber-700 dark:text-amber-300',     border: 'border-amber-500/30' },
  'Intent Activity':         { bg: 'bg-rose-500/10',    text: 'text-rose-700 dark:text-rose-300',       border: 'border-rose-500/30' },
  'Firmographic Filter':     { bg: 'bg-primary/10',     text: 'text-primary',                            border: 'border-primary/30' },
  'Install Age (Tech Age)':  { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/30' },
  'FAI Dissatisfaction':     { bg: 'bg-violet-500/10',  text: 'text-violet-700 dark:text-violet-300',   border: 'border-violet-500/30' },
};

function ConfidenceDot({ level }) {
  const map = {
    high:   { color: 'bg-emerald-500', label: 'High confidence' },
    medium: { color: 'bg-amber-500',   label: 'Medium confidence' },
    low:    { color: 'bg-rose-500',    label: 'Low confidence' },
  };
  const cfg = map[level] || map.medium;
  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
      <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
      {cfg.label}
    </div>
  );
}

function MetricCell({ metric }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border ${
        metric.highlight
          ? 'bg-primary/8 border-primary/30'
          : 'bg-surface border-border'
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted">
        {metric.label}
      </div>
      <div
        className={`mt-1 font-mono font-semibold tracking-tight ${
          metric.highlight ? 'text-primary text-2xl' : 'text-text-primary text-xl'
        }`}
      >
        {metric.value}
      </div>
      <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">
        {metric.subtitle}
      </div>
    </div>
  );
}

export default function InsightCard({ card, onExport, onShare }) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-card">
      {/* Header strip */}
      <div
        className="px-5 py-3 flex items-center justify-between text-white"
        style={{
          background:
            'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-dim)) 60%, #6B4FA0 130%)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={14} className="flex-shrink-0 opacity-80" />
          <div className="font-semibold text-sm tracking-tight truncate">{card.title}</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onShare}
            title="Copy shareable link"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded hover:bg-white/15 transition-colors"
          >
            <Share2 size={11} /> Share
          </button>
          <button
            onClick={onExport}
            title="Export as PDF"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded hover:bg-white/15 transition-colors"
          >
            <Download size={11} /> Export
          </button>
        </div>
      </div>

      {/* Body — sections render conditionally based on what the fixture
          declares. Order is intentional: metrics → tiers (the headline
          breakdown) → analytical sections → support blocks. */}
      <div className="p-5 space-y-3">
        {Array.isArray(card.metrics) && card.metrics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {card.metrics.map((m, i) => (
              <MetricCell key={i} metric={m} />
            ))}
          </div>
        )}

        {card.tiers && <TierList tiers={card.tiers} />}

        {(card.competitorShare || card.industryAttractiveness) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {card.competitorShare && <CompetitorShareDonut share={card.competitorShare} />}
            {card.industryAttractiveness && (
              <IndustryAttractiveness table={card.industryAttractiveness} />
            )}
          </div>
        )}

        {card.spendTrend && <SpendTrendSparkline trend={card.spendTrend} />}

        {(card.spendDistribution || card.decayForecast) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {card.spendDistribution && <SpendDistribution distribution={card.spendDistribution} />}
            {card.decayForecast && <DecayForecast forecast={card.decayForecast} />}
          </div>
        )}

        {(card.lockInRisk || card.departmentEntry) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {card.lockInRisk && <LockInRisk risk={card.lockInRisk} />}
            {card.departmentEntry && <DepartmentEntry entry={card.departmentEntry} />}
          </div>
        )}

        {/* Signals + confidence — always present, render last */}
        {Array.isArray(card.signals) && card.signals.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">
                Powered by
              </span>
              {card.signals.map((s) => {
                const color = SIGNAL_COLOR[s] || SIGNAL_COLOR['Firmographic Filter'];
                return (
                  <span
                    key={s}
                    className={`inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border ${color.bg} ${color.text} ${color.border}`}
                  >
                    {s}
                  </span>
                );
              })}
            </div>
            <ConfidenceDot level={card.confidence} />
          </div>
        )}
      </div>
    </div>
  );
}
