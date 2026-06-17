import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Lightbulb,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import Avatar from '../../shared/Avatar.jsx';
import { JORDAN_CHAMPIONS, CHAMPION_VARIANTS, STATUS_LABELS } from '../../../data/championData.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { useCompanyDetail } from '../../../context/CompanyDetailContext.jsx';

function StatusPill({ status }) {
  const cfg = STATUS_LABELS[status] || STATUS_LABELS.active;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.tone}`}
    >
      {cfg.label}
    </span>
  );
}

function ChampionRow({ champion, onAction }) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { openCompany } = useCompanyDetail();

  const isMove = champion.status === 'changed-job';

  const goToThread = (e) => {
    e.stopPropagation();
    if (champion.threadId) navigate(`/thread/${champion.threadId}`);
    else if (champion.currentCompanyId) openCompany(champion.currentCompanyId);
    else showToast(`Opening ${champion.currentCompany} account view`, 'info');
  };

  const rowClickable = !!champion.currentCompanyId;
  return (
    <div
      onClick={() => rowClickable && openCompany(champion.currentCompanyId)}
      className={`grid grid-cols-[36px_220px_140px_1fr_auto] gap-3 items-center px-3 py-3 border-t border-border first:border-0 transition-colors ${
        rowClickable ? 'hover:bg-primary/5 cursor-pointer' : 'hover:bg-bg/30'
      }`}
    >
      <Avatar
        name={champion.name}
        initials={champion.headshotInitials}
        color={champion.headshotColor}
        size={32}
      />

      <div className="min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">{champion.name}</div>
        <div className="text-[11px] text-text-secondary truncate">
          {champion.currentRole} · {champion.currentCompany}
        </div>
        {isMove && champion.previousCompany && (
          <div className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
            <span className="line-through opacity-70">{champion.previousCompany}</span>
            <ArrowRight size={9} />
            <span className="text-amber-700 dark:text-amber-300">{champion.currentCompany}</span>
          </div>
        )}
      </div>

      <div>
        <StatusPill status={champion.status} />
        <div className="text-[10px] text-text-muted mt-1">{champion.signal}</div>
      </div>

      <div className="text-xs text-text-secondary leading-snug max-w-[420px]">
        {champion.insight}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={goToThread}
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-primary hover:bg-primary/10 rounded transition-colors"
          title="Open related thread or account"
        >
          <ExternalLink size={11} />
          Open
        </button>
        {(champion.status === 'changed-job' || champion.status === 'new-here' || champion.status === 'incoming') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              showToast(`AI is drafting a warm intro for ${champion.name}...`, 'info');
            }}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-primary/10 text-primary hover:bg-primary hover:text-white rounded transition-colors"
          >
            <Sparkles size={10} />
            Draft intro
          </button>
        )}
      </div>
    </div>
  );
}

export default function LiveChampionTracker({ variant = 'all', onPin }) {
  const data = CHAMPION_VARIANTS[variant] || CHAMPION_VARIANTS.all;
  const map = useMemo(() => new Map(JORDAN_CHAMPIONS.map((c) => [c.id, c])), []);
  const champions = data.ids.map((id) => map.get(id)).filter(Boolean);

  const counts = champions.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <LiveFrame
      title={data.title}
      subtitle={`Tracked across your book of accounts. ${champions.length} champions in this view.`}
      onPin={onPin}
      footer="Recurring monthly check available · re-runs against current book"
    >
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
          Breakdown
        </span>
        {Object.entries(counts).map(([status, count]) => {
          const cfg = STATUS_LABELS[status];
          if (!cfg) return null;
          return (
            <span
              key={status}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${cfg.bg}`}
            >
              <span className={`font-semibold uppercase tracking-wider ${cfg.tone}`}>
                {cfg.label}
              </span>
              <span className="text-text-secondary font-mono">{count}</span>
            </span>
          );
        })}
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        {champions.map((c) => (
          <ChampionRow key={c.id} champion={c} />
        ))}
      </div>

      <div className="flex items-start gap-2 mt-3 p-3 bg-primary/5 border border-primary/15 rounded-md">
        <Lightbulb size={12} className="text-primary mt-0.5 flex-shrink-0" />
        <div className="text-xs text-text-secondary leading-relaxed">{data.aiNote}</div>
      </div>
    </LiveFrame>
  );
}
