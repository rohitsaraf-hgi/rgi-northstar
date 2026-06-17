import { STATUS_BADGES } from '../../data/threads.js';

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_BADGES[status];
  if (!cfg) return null;
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} rounded text-[10px] font-semibold uppercase tracking-wider bg-surface-2 ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
