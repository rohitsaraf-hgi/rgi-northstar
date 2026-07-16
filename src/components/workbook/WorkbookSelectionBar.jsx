import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, ListPlus } from 'lucide-react';
import { getContactsForAccounts, createContactWorkbook } from '../../data/workbooks.js';
import { useToast } from '../../context/ToastContext.jsx';
import { usePersona } from '../../context/PersonaContext.jsx';

// Sticky bulk-action bar shown when ≥1 workbook row is selected.
//
// Focused on CONTACT-SPECIFIC actions. Create Sales Play + Save-as-Workbook
// (accounts) live in the persistent toolbar at the top of the workbook,
// which is always visible and updates its label with the selection count.
export default function WorkbookSelectionBar({
  workbookId,
  selectedIds,
  onClear,
  onViewContacts,
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { persona } = usePersona();
  const [saveOpen, setSaveOpen] = useState(false);
  const [wbName, setWbName] = useState('');

  const contacts = useMemo(() => getContactsForAccounts(selectedIds), [selectedIds]);
  const contactCount = contacts.length;

  if (!selectedIds || selectedIds.length === 0) return null;

  const handleSaveContacts = () => {
    const name = wbName.trim() || `Contacts from ${selectedIds.length} accounts`;
    const wb = createContactWorkbook({
      name,
      contacts,
      ownerId: persona?.id,
      ownerName: persona?.name,
      visibility: 'private',
      sourceWorkbookId: workbookId,
    });
    showToast(`Saved ${contacts.length} contacts as "${wb.name}"`, 'success');
    setSaveOpen(false);
    setWbName('');
    onClear?.();
    navigate(`/workbook/${wb.id}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed left-1/2 -translate-x-1/2 bottom-6 z-40 w-[min(880px,calc(100%-3rem))]"
      >
        <div className="bg-bg border border-border shadow-modal rounded-lg px-4 py-3 flex items-center gap-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/15 text-primary text-[11px] font-semibold">
              {selectedIds.length} selected
            </span>
            {contactCount > 0 && (
              <span className="text-[10px] text-text-muted">
                &middot; {contactCount} contact{contactCount === 1 ? '' : 's'} in scope
              </span>
            )}
            <span className="text-[10px] text-text-muted">
              &middot; Create Sales Play + Save as Workbook available in the toolbar above
            </span>
          </div>

          <div className="flex-1" />

          <button
            onClick={onViewContacts}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
            title="View contacts across selected companies"
          >
            <Users size={11} />
            View contacts
            {contactCount > 0 && (
              <span className="text-[10px] font-mono px-1 rounded bg-surface-2">{contactCount}</span>
            )}
          </button>

          <button
            onClick={() => setSaveOpen(true)}
            disabled={contactCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Save contacts as a new contact-list workbook"
          >
            <ListPlus size={11} />
            Save contacts as workbook
          </button>

          <button
            onClick={onClear}
            className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-surface-2 rounded transition-colors"
            title="Clear selection"
          >
            <X size={12} />
          </button>
        </div>

        {saveOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 bg-bg border border-border shadow-modal rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <ListPlus size={12} className="text-primary" />
              <span className="text-xs font-semibold text-text-primary">Save contacts as a new workbook</span>
              <button
                onClick={() => setSaveOpen(false)}
                className="ml-auto text-text-muted hover:text-text-secondary"
              >
                <X size={11} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={wbName}
                onChange={(e) => setWbName(e.target.value)}
                placeholder={`Contacts from ${selectedIds.length} accounts`}
                className="flex-1 px-2 py-1.5 text-xs bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary/40"
              />
              <button
                onClick={handleSaveContacts}
                className="px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
              >
                Save {contactCount} contacts
              </button>
            </div>
            <div className="text-[10px] text-text-muted mt-1.5">
              A private CONTACT_LIST workbook will be created with a back-pointer to this workbook.
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
