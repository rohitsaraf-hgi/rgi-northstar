import { CheckCircle2, Lightbulb, CircleSlash2, MinusCircle } from 'lucide-react';
import { MEDDIC_STATUS_TIERS } from '../../data/accountBriefData.js';

const ICONS = {
  Confirmed: CheckCircle2,
  Inferred: Lightbulb,
  Partial: MinusCircle,
  Unknown: CircleSlash2,
};

// Compact evidence-strength badge used by the Account Brief MEDDIC table and
// by per-section status callouts. Clickable variant cycles the status.
export default function EvidenceBadge({ status, onClick, size = 'sm', showLabel = true }) {
  const cfg = MEDDIC_STATUS_TIERS[status] || MEDDIC_STATUS_TIERS.Unknown;
  const Icon = ICONS[status] || CircleSlash2;
  const isInteractive = !!onClick;

  const padding = size === 'xs' ? 'px-1 py-0' : 'px-1.5 py-0.5';
  const textSize = size === 'xs' ? 'text-[9px]' : 'text-[10px]';
  const iconSize = size === 'xs' ? 9 : 10;

  return (
    <button
      onClick={onClick}
      disabled={!isInteractive}
      title={isInteractive ? `Click to change · currently ${cfg.label}` : cfg.label}
      className={`inline-flex items-center gap-1 ${padding} rounded font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border} ${textSize} ${
        isInteractive ? 'hover:ring-1 hover:ring-primary/40 cursor-pointer transition-all' : 'cursor-default'
      }`}
    >
      <Icon size={iconSize} />
      {showLabel && cfg.short}
    </button>
  );
}
