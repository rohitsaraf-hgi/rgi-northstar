import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAccountDrawer } from '../../context/AccountDrawerContext.jsx';

// Thin sticky strip that renders at the top of AccountThread when the
// seller landed there from a workbook drawer expand. Answers "where am
// I?" and keeps j/k-style navigation available on the full page too.
//
// The parent decides whether to mount this — it reads `?from=workbook`.

export default function MiniContextBar({ accountName, workbookLabel = 'Workbook' }) {
  const navigate = useNavigate();
  const { accountsList, openAccountDrawer } = useAccountDrawer();

  const currentIndex = accountsList.findIndex((a) => a.name === accountName);
  const hasContext = currentIndex >= 0 && accountsList.length > 1;

  const stepTo = (delta) => {
    if (!hasContext) return;
    const nextIdx = (currentIndex + delta + accountsList.length) % accountsList.length;
    const next = accountsList[nextIdx];
    if (next) navigate(`/account/${next.id}?from=workbook`);
  };

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur px-4 py-1.5 flex items-center gap-2 text-[11px]">
      <button
        onClick={() => navigate('/workbook')}
        className="inline-flex items-center gap-1 text-text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft size={11} />
        Back to {workbookLabel}
      </button>
      <span className="text-text-muted">·</span>
      <span className="text-text-muted truncate">
        {workbookLabel} <span className="mx-1">›</span>
        <span className="text-text-primary font-medium">{accountName}</span>
      </span>
      {hasContext && (
        <div className="ml-auto flex items-center gap-1">
          <span className="text-text-muted">
            <span className="text-text-secondary font-semibold">{currentIndex + 1}</span> of {accountsList.length}
          </span>
          <button
            onClick={() => stepTo(-1)}
            className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
            title="Previous account"
          >
            <ChevronLeft size={12} />
          </button>
          <button
            onClick={() => stepTo(1)}
            className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
            title="Next account"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
