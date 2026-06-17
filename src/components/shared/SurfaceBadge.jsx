import { Globe, MessageSquare, Terminal, Code2, Mail } from 'lucide-react';
import { SURFACES } from '../../data/surfaces.js';

const ICONS = {
  globe: Globe,
  'message-square': MessageSquare,
  terminal: Terminal,
  'code-2': Code2,
  mail: Mail,
};

// Pill — used in Library and headers where space allows the label
export default function SurfaceBadge({ surface, size = 'sm', showLabel = true, alwaysShow = false }) {
  const cfg = SURFACES[surface] || SURFACES.browser;
  if (!alwaysShow && !cfg.show) return null;
  const Icon = ICONS[cfg.icon] || Globe;
  const padding = size === 'xs' ? 'px-1 py-0' : 'px-1.5 py-0.5';
  const text = size === 'xs' ? 'text-[9px]' : 'text-[10px]';
  const iconSize = size === 'xs' ? 8 : 10;
  return (
    <span
      className={`inline-flex items-center gap-1 ${padding} rounded ${cfg.bg} ${cfg.color} font-bold uppercase tracking-wider ${text}`}
      title={`Created via ${cfg.label}`}
    >
      <Icon size={iconSize} />
      {showLabel && cfg.short}
    </span>
  );
}

// Tiny dot — used inline next to timestamps where a full pill is too much
export function SurfaceDot({ surface }) {
  const cfg = SURFACES[surface] || SURFACES.browser;
  if (!cfg.show) return null;
  const Icon = ICONS[cfg.icon] || Globe;
  return (
    <span
      className={`inline-flex items-center ${cfg.color}`}
      title={`Created via ${cfg.label}`}
    >
      <Icon size={10} />
    </span>
  );
}
