import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ListPlus, Building2 } from 'lucide-react';
import { createCustomWorkbook } from '../../data/workbooks.js';
import { useToast } from '../../context/ToastContext.jsx';
import { usePersona } from '../../context/PersonaContext.jsx';

// SaveWorkbookAsModal — freezes the currently-visible rows into a new
// account workbook. Static snapshot; caller decides whether to pass
// `selectedIds` (subset) or the whole filtered list.
export default function SaveWorkbookAsModal({ open, rows, sourceWorkbook, filterSummary, onClose }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { persona } = usePersona();
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState('private');

  useEffect(() => {
    if (open) {
      const stamp = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const source = sourceWorkbook?.name ? ` · ${sourceWorkbook.name}` : '';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(`Saved list${source} · ${stamp}`);
    }
  }, [open, sourceWorkbook]);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = name.trim() || `Saved list · ${new Date().toISOString().slice(0, 10)}`;
    const wb = createCustomWorkbook({
      name: trimmed,
      rows: rows || [],
      ownerId: persona?.id,
      ownerName: persona?.name,
      visibility,
    });
    showToast(`Saved "${wb.name}" (${rows?.length || 0} records)`, 'success');
    onClose?.();
    navigate(`/workbook/${wb.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="bg-bg border border-border rounded-lg shadow-modal max-w-md w-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <ListPlus size={15} className="text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Save as workbook</h2>
              <p className="text-[11px] text-text-muted">
                Freeze the current {rows?.length || 0} record{rows?.length === 1 ? '' : 's'} into a new workbook.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-2 rounded transition-colors text-text-secondary"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-sm bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-primary/40"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Visibility</label>
            <div className="flex items-center gap-1 mt-1 bg-surface border border-border rounded-md p-0.5">
              <button
                onClick={() => setVisibility('private')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
                  visibility === 'private' ? 'bg-primary/15 text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Private
              </button>
              <button
                onClick={() => setVisibility('organization')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
                  visibility === 'organization' ? 'bg-primary/15 text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Organization
              </button>
            </div>
          </div>

          {sourceWorkbook && (
            <div className="px-3 py-2 rounded border border-border bg-bg/40 text-[11px] text-text-secondary">
              <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                <Building2 size={10} />
                Snapshot source
              </div>
              <div>
                From <span className="font-semibold text-text-primary">{sourceWorkbook.name}</span>
                {filterSummary && <> &middot; {filterSummary}</>}
              </div>
              <div className="text-[10px] text-text-muted mt-1">
                This is a frozen copy — rows don&rsquo;t refresh even if the source workbook changes.
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !rows || rows.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ListPlus size={11} />
            Save {rows?.length || 0} record{rows?.length === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  );
}
