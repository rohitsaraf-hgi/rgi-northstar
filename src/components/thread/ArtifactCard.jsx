import {
  Layers,
  FileText,
  Mail,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  ExternalLink,
  Download,
  Share2,
  Plus,
  MessageCircle,
} from 'lucide-react';
import { ARTIFACT_TYPES } from '../../data/artifacts.js';
import { useToast } from '../../context/ToastContext.jsx';
import SurfaceBadge from '../shared/SurfaceBadge.jsx';

const ICONS = {
  layers: Layers,
  'file-text': FileText,
  mail: Mail,
  'bar-chart-3': BarChart3,
  'check-circle-2': CheckCircle2,
  'clipboard-list': ClipboardList,
  sparkles: Sparkles,
};

export default function ArtifactCard({ artifact, inline = false, collaborative = false, commentCount = 0 }) {
  const cfg = ARTIFACT_TYPES[artifact.type] || ARTIFACT_TYPES.BRIEF;
  const Icon = ICONS[cfg.icon] || FileText;
  const { showToast } = useToast();

  const isDecision = artifact.type === 'DECISION';

  return (
    <div
      className={`
        group relative bg-surface-2 border-l-2 ${isDecision ? 'border-l-success' : 'border-l-primary'}
        border-y border-r border-border rounded-r-lg p-4
        ${inline ? 'my-3' : ''}
        hover:border-border-2 transition-colors
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon size={14} className={cfg.color} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
            {cfg.label}
          </span>
          {artifact.version && (
            <span className="text-[10px] text-text-muted font-mono">{artifact.version}</span>
          )}
          {artifact.surface && <SurfaceBadge surface={artifact.surface} size="xs" />}
        </div>
        {collaborative && commentCount > 0 && (
          <button className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary">
            <MessageCircle size={11} />
            {commentCount}
          </button>
        )}
      </div>

      <div className="text-sm font-semibold text-text-primary mb-1">{artifact.name}</div>
      {artifact.meta && (
        <div className="text-xs text-text-secondary mb-3 font-mono">{artifact.meta}</div>
      )}
      {artifact.timestamp && !artifact.meta && (
        <div className="text-xs text-text-muted mb-3">{artifact.timestamp}</div>
      )}

      <div className="flex items-center gap-1 -ml-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => showToast(`Opened "${artifact.name}"`, 'info')}
          className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:bg-bg/60 hover:text-text-primary rounded transition-colors"
        >
          <ExternalLink size={11} />
          View Full
        </button>
        <button
          onClick={() => showToast(`Exporting ${artifact.name}...`)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:bg-bg/60 hover:text-text-primary rounded transition-colors"
        >
          <Download size={11} />
          Export
        </button>
        <button
          onClick={() => showToast('Link copied to clipboard')}
          className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:bg-bg/60 hover:text-text-primary rounded transition-colors"
        >
          <Share2 size={11} />
          Share
        </button>
        {collaborative && (
          <button
            onClick={() => showToast('Comment posted')}
            className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:bg-bg/60 hover:text-text-primary rounded transition-colors"
          >
            <Plus size={11} />
            Comment
          </button>
        )}
      </div>
    </div>
  );
}
