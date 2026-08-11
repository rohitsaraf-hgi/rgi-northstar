import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, Mail, MoonStar, FolderPlus, Play, ListTodo, Check,
  ChevronRight, ExternalLink, Sparkles, Pin, TrendingUp,
  AlertTriangle, Users, Building2, MapPin, Wand2,
} from 'lucide-react';
import { pinDayPlan, unpinDayPlan, getPinnedPlan } from '../../data/dailyPlan.js';

// Relative time helper (uses the fixed demo "today").
function relativeAgo(iso) {
  if (!iso) return '';
  try {
    const now = new Date('2026-08-11');
    const diff = now - new Date(iso);
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function AccountAvatar({ name, color, size = 28 }) {
  const initials = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('');
  return (
    <div
      className="rounded text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0"
      style={{ background: color || '#64748b', width: size, height: size }}
    >
      {initials}
    </div>
  );
}

// ─── Text (fallback + errors + help) ─────────────────────────────────
export function TextResponse({ response }) {
  return (
    <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
      {response.text}
    </div>
  );
}

// ─── Top-N accounts firing a signal ──────────────────────────────────
export function TopNResponse({ response, personaId }) {
  const navigate = useNavigate();
  const { title, rows } = response;
  if (!rows || rows.length === 0) {
    return (
      <div className="text-sm text-text-secondary">
        No accounts firing that signal in your current scope right now.
      </div>
    );
  }
  return (
    <div>
      <div className="text-sm text-text-primary mb-3">
        <span className="font-semibold">{rows.length}</span> account{rows.length === 1 ? '' : 's'}
        {' '}match, ranked by combined signal weight.
      </div>

      <BulkActionBar rows={rows} kind="in-book" />

      <div className="space-y-2 mt-3">
        {rows.map((r, i) => (
          <button
            key={r.accountId}
            onClick={() => navigate(`/account/${r.accountId}`)}
            className="w-full text-left bg-surface border border-border rounded p-3 hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono text-text-muted pt-1 w-4">{i + 1}</span>
              <AccountAvatar name={r.accountName} color={r.accountLogo} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-text-primary">{r.accountName}</span>
                  <span className="text-[10px] font-mono text-text-muted">weight {r.weight}</span>
                </div>
                <div className="text-[12px] text-text-secondary mt-0.5">
                  {r.matchSummary} · {relativeAgo(r.matchedAt)}
                </div>
                {r.alsoFiring?.length > 0 && (
                  <div className="text-[11px] text-text-muted mt-1">
                    Also firing: {r.alsoFiring.map((s) => s.label).join(', ')}
                  </div>
                )}
              </div>
              <ChevronRight size={14} className="text-text-muted group-hover:text-primary flex-shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>

      <SourcesFooter text="signalFirings · Phase 1 detectors" />
    </div>
  );
}

// ─── Handoff (single-account TL;DR + link to thread) ─────────────────
export function HandoffResponse({ response, personaId }) {
  const navigate = useNavigate();
  const { accountId, accountName, accountLogo, headline, facts, plays, signalCount, criticalOrHigh } = response;
  return (
    <div>
      <div className="flex items-start gap-3 mb-3">
        <AccountAvatar name={accountName} color={accountLogo} size={36} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary">{accountName}</div>
          <div className="text-[11px] text-text-muted mt-0.5">
            {signalCount} signals firing
            {criticalOrHigh > 0 ? ` · ${criticalOrHigh} critical/high` : ''}
          </div>
        </div>
      </div>

      <div className="text-sm text-text-primary leading-relaxed mb-3">
        {headline}
      </div>

      {facts?.length > 0 && (
        <div className="bg-bg/40 border border-border rounded p-3 mb-3">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">Quick facts</div>
          <ul className="space-y-1">
            {facts.map((f, i) => (
              <li key={i} className="text-[12px] text-text-secondary leading-snug">
                · <span className="text-text-primary">{f.label}</span>
                {f.summary && <span> — {f.summary}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={() => navigate(`/account/${accountId}?tab=chat`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-dim transition-colors"
        >
          <ExternalLink size={11} />
          Open {accountName} thread
        </button>
        {plays?.slice(0, 2).map((p) => (
          <button
            key={p.title}
            onClick={() => navigate(`/account/${accountId}?play=${p.agentId}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <Wand2 size={11} />
            {p.ctaLabel}
          </button>
        ))}
      </div>

      <div className="text-[11px] text-text-muted italic mt-2">
        ↳ Continuing in the account thread keeps stakeholders and prior drafts in one place.
      </div>
    </div>
  );
}

// ─── Daily Plan (with pin) ───────────────────────────────────────────
export function PlanResponse({ response, personaId, onPinChanged }) {
  const navigate = useNavigate();
  const { title, rows } = response;
  const pinned = getPinnedPlan(personaId);
  const isPinned = pinned && pinned.rows?.some((r) => rows.some((x) => x.accountId === r.accountId));

  const handlePin = () => {
    if (isPinned) {
      unpinDayPlan(personaId);
    } else {
      pinDayPlan(personaId, { generatedAt: new Date().toISOString(), title, rows });
    }
    onPinChanged?.();
  };

  if (!rows || rows.length === 0) {
    return <div className="text-sm text-text-secondary">No accounts to plan today — scope is empty.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-text-primary">{title || 'Daily Plan'}</div>
          <div className="text-[11px] text-text-muted">Top {rows.length}, ranked by weight × time-sensitivity</div>
        </div>
        <button
          onClick={handlePin}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${
            isPinned
              ? 'bg-primary text-white border-primary'
              : 'text-text-secondary border-border hover:text-text-primary hover:bg-surface-2'
          }`}
          title={isPinned ? 'Unpin plan' : 'Pin plan to Home'}
        >
          <Pin size={10} />
          {isPinned ? 'Pinned to Home' : 'Pin to Home'}
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.accountId} className="bg-surface border border-border rounded p-3">
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono text-text-muted pt-1 w-4">{i + 1}</span>
              <AccountAvatar name={r.accountName} color={r.accountLogo} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(`/account/${r.accountId}`)}
                    className="text-sm font-semibold text-text-primary hover:text-primary"
                  >
                    {r.accountName}
                  </button>
                  <span className="text-[10px] font-mono text-text-muted">w {r.weight}</span>
                  {r.hasRenewal && (
                    <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300">
                      Time-sensitive
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-text-secondary leading-snug mt-1">{r.headline}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {r.plays?.slice(0, 3).map((p) => (
                    <button
                      key={p.title}
                      onClick={() => navigate(`/account/${r.accountId}?play=${p.agentId}`)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/40 rounded hover:bg-primary/10 transition-colors"
                    >
                      {p.ctaLabel}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-primary text-white rounded hover:bg-primary-dim transition-colors">
          <ListTodo size={11} />
          Push {rows.length} tasks to Salesforce
        </button>
      </div>
    </div>
  );
}

// ─── What Changed (recent firings) ───────────────────────────────────
export function WhatChangedResponse({ response, personaId }) {
  const navigate = useNavigate();
  const { title, rows } = response;
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-text-secondary">Nothing new in the last few days.</div>;
  }
  return (
    <div>
      <div className="text-sm font-semibold text-text-primary mb-1">{title}</div>
      <div className="text-[11px] text-text-muted mb-3">Newest first · click a row to open the account</div>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <button
            key={r.accountId + '-' + i}
            onClick={() => navigate(`/account/${r.accountId}`)}
            className="w-full text-left bg-surface border border-border rounded p-2.5 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <AccountAvatar name={r.accountName} color={r.accountLogo} size={24} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-text-primary">{r.accountName}</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted">{r.category}</span>
                  <span className="text-[10px] text-text-muted">{relativeAgo(r.firedAt)}</span>
                </div>
                <div className="text-[11px] text-text-secondary leading-snug mt-0.5">
                  <span className="text-text-primary">{r.signalLabel}</span>
                  {r.summary && r.summary !== r.signalLabel && <span> — {r.summary}</span>}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Lookalikes (prospecting) ────────────────────────────────────────
export function LookalikesResponse({ response, personaId }) {
  const { seedName, dimensions, results, totalFound } = response;
  return (
    <div>
      <div className="text-sm text-text-primary mb-2">
        Found <span className="font-semibold">{totalFound}</span> account{totalFound === 1 ? '' : 's'} in
        Companies List (ICP-Match) that look like <span className="font-semibold">{seedName}</span>.
      </div>
      {dimensions?.length > 0 && (
        <div className="text-[11px] text-text-muted mb-3">
          Match dimensions: {dimensions.join(' · ')}
        </div>
      )}

      <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 mb-3 flex items-start gap-2">
        <AlertTriangle size={12} className="text-amber-700 dark:text-amber-300 mt-0.5 flex-shrink-0" />
        <div className="text-[11px] text-amber-900 dark:text-amber-200">
          These accounts are <span className="font-semibold">outside your book</span> — prospecting mode.
        </div>
      </div>

      <BulkActionBar rows={results} kind="out-of-book" />

      <div className="space-y-2 mt-3">
        {results.map((r, i) => (
          <div key={r.name + i} className="bg-surface border border-border rounded p-3">
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono text-text-muted pt-1 w-4">{i + 1}</span>
              <div
                className="w-7 h-7 rounded text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0"
                style={{ background: '#64748b' }}
              >
                {r.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-text-primary">{r.name}</span>
                  <span className="text-[10px] font-mono text-text-muted">weight {r.weight}</span>
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1"><Users size={9} />{r.emp} emp</span>
                  <span className="inline-flex items-center gap-1"><MapPin size={9} />{r.hq}</span>
                  <span className="inline-flex items-center gap-1"><Building2 size={9} />{r.installed}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SourcesFooter text={`ICP-Match universe · lookalike-vector(${seedName})`} />
    </div>
  );
}

// ─── Comparison (2 accounts side-by-side) ────────────────────────────
export function ComparisonResponse({ response, personaId }) {
  const navigate = useNavigate();
  const { a, b } = response;
  const row = (label, aVal, bVal) => (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-border last:border-b-0">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{label}</div>
      <div className="text-[11px] text-text-primary">{aVal || <span className="text-text-muted">—</span>}</div>
      <div className="text-[11px] text-text-primary">{bVal || <span className="text-text-muted">—</span>}</div>
    </div>
  );
  const listToText = (items) => {
    if (!items || items.length === 0) return null;
    return items.map((i) => i.summary || i.label).join(' · ');
  };
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-2 pb-2 border-b-2 border-border">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Attribute</div>
        <div className="flex items-center gap-2">
          <AccountAvatar name={a.accountName} color={a.accountLogo} size={20} />
          <span className="text-xs font-semibold text-text-primary">{a.accountName}</span>
        </div>
        <div className="flex items-center gap-2">
          <AccountAvatar name={b.accountName} color={b.accountLogo} size={20} />
          <span className="text-xs font-semibold text-text-primary">{b.accountName}</span>
        </div>
      </div>
      {row('Stage', a.stage, b.stage)}
      {row('Score', a.combinedScore ? `${a.combinedScore}` : null, b.combinedScore ? `${b.combinedScore}` : null)}
      {row('Total weight', a.weight, b.weight)}
      {row('Competitive', listToText(a.competitiveSignals), listToText(b.competitiveSignals))}
      {row('Buyer intent', listToText(a.intentSignals), listToText(b.intentSignals))}
      {row('1P activity', listToText(a.activitySignals), listToText(b.activitySignals))}
      {row('Partner / momentum', listToText(a.partnerMomentum), listToText(b.partnerMomentum))}
      {row(
        'Top play',
        a.topPlay?.title,
        b.topPlay?.title
      )}
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
        <button
          onClick={() => navigate(`/account/${a.accountId}`)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-text-secondary border border-border rounded hover:text-text-primary"
        >
          Open {a.accountName}
        </button>
        <button
          onClick={() => navigate(`/account/${b.accountId}`)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-text-secondary border border-border rounded hover:text-text-primary"
        >
          Open {b.accountName}
        </button>
      </div>
    </div>
  );
}

// ─── Bulk action bar (in-book vs out-of-book variants) ───────────────
function BulkActionBar({ rows, kind }) {
  if (!rows || rows.length === 0) return null;
  if (kind === 'out-of-book') {
    return (
      <div className="bg-bg/40 border border-border rounded p-2 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mr-1">Bulk:</span>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-primary text-white rounded hover:bg-primary-dim transition-colors">
          <FolderPlus size={11} />
          Save as workbook
        </button>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 transition-colors">
          <Play size={11} />
          Create sales play
        </button>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 transition-colors">
          <TrendingUp size={11} />
          Add all to book
        </button>
      </div>
    );
  }
  return (
    <div className="bg-bg/40 border border-border rounded p-2 flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mr-1">Bulk:</span>
      <button className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-primary text-white rounded hover:bg-primary-dim transition-colors">
        <Mail size={11} />
        Draft outreach for all
      </button>
      <button className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 transition-colors">
        <MoonStar size={11} />
        Snooze all
      </button>
      <button className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 transition-colors">
        <FolderPlus size={11} />
        Save as workbook
      </button>
    </div>
  );
}

// Sources footer — traceability per CLAUDE.md Rule 1
function SourcesFooter({ text }) {
  if (!text) return null;
  return (
    <div className="text-[10px] text-text-muted italic mt-3 pt-2 border-t border-border">
      Sources: {text}
    </div>
  );
}

// ─── Response dispatcher ─────────────────────────────────────────────
export function CopilotResponse({ response, personaId, onPinChanged }) {
  if (!response) return null;
  const map = {
    topN: TopNResponse,
    plan: PlanResponse,
    handoff: HandoffResponse,
    whatChanged: WhatChangedResponse,
    lookalikes: LookalikesResponse,
    comparison: ComparisonResponse,
    text: TextResponse,
  };
  const Component = map[response.kind] || TextResponse;
  return <Component response={response} personaId={personaId} onPinChanged={onPinChanged} />;
}
