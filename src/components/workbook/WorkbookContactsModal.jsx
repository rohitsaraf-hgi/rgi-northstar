import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, ListPlus, Crown, Mail, Building2 } from 'lucide-react';
import { getContactsForAccounts, createContactWorkbook } from '../../data/workbooks.js';
import { usePersona } from '../../context/PersonaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

// WorkbookContactsModal — lists contacts across a set of selected companies.
// Multi-select inside; "Save as workbook" creates a CONTACT_LIST workbook.
export default function WorkbookContactsModal({ open, selectedAccountIds, sourceWorkbookId, onClose }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { persona } = usePersona();

  const contacts = useMemo(() => getContactsForAccounts(selectedAccountIds || []), [selectedAccountIds]);
  const [selectedContactIds, setSelectedContactIds] = useState(() => contacts.map((c) => c.id));
  const [wbName, setWbName] = useState('');

  // Reset selection when the underlying set of contacts changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedContactIds(contacts.map((c) => c.id));
  }, [contacts]);

  const grouped = useMemo(() => {
    const out = {};
    for (const c of contacts) {
      const key = c.companyAccountId;
      if (!out[key]) out[key] = { company: c.company, accountId: key, contacts: [] };
      out[key].contacts.push(c);
    }
    return Object.values(out);
  }, [contacts]);

  if (!open) return null;

  const toggleContact = (id) =>
    setSelectedContactIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelectedContactIds((prev) => (prev.length === contacts.length ? [] : contacts.map((c) => c.id)));

  const handleSaveAs = () => {
    const picked = contacts.filter((c) => selectedContactIds.includes(c.id));
    if (picked.length === 0) return;
    const name = wbName.trim() || `Contacts from ${selectedAccountIds.length} accounts`;
    const wb = createContactWorkbook({
      name,
      contacts: picked,
      ownerId: persona?.id,
      ownerName: persona?.name,
      visibility: 'private',
      sourceWorkbookId,
    });
    showToast(`Saved ${picked.length} contacts as "${wb.name}"`, 'success');
    onClose?.();
    navigate(`/workbook/${wb.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="bg-bg border border-border rounded-lg shadow-modal max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-rose-500/10 flex items-center justify-center">
              <Users size={15} className="text-rose-700 dark:text-rose-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Contacts across {selectedAccountIds?.length || 0} account{selectedAccountIds?.length === 1 ? '' : 's'}
              </h2>
              <p className="text-[11px] text-text-muted">
                {contacts.length} contact{contacts.length === 1 ? '' : 's'} found &middot; source: CRM + LinkedIn (mock)
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

        {contacts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
            <Users size={22} className="text-text-muted mb-2" />
            <div className="text-sm font-semibold text-text-primary">No contacts on these accounts yet</div>
            <p className="text-[11px] text-text-muted mt-1 max-w-md leading-relaxed">
              The buying committees for these accounts are empty. Run persona discovery on the workbook to find contacts.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2 border-b border-border bg-surface-2/40">
              <label className="inline-flex items-center gap-1.5 text-[11px] text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedContactIds.length === contacts.length}
                  ref={(el) => { if (el) el.indeterminate = selectedContactIds.length > 0 && selectedContactIds.length < contacts.length; }}
                  onChange={toggleAll}
                  className="rounded border-border cursor-pointer"
                />
                <span>{selectedContactIds.length} of {contacts.length} selected</span>
              </label>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {grouped.map((group) => (
                <div key={group.accountId}>
                  <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                    <Building2 size={10} />
                    {group.company}
                    <span className="text-text-muted">·</span>
                    <span className="font-mono">{group.contacts.length}</span>
                  </div>
                  <div className="space-y-1">
                    {group.contacts.map((c) => {
                      const isChecked = selectedContactIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors ${
                            isChecked ? 'border-primary/30 bg-primary/5' : 'border-border bg-bg/40 hover:bg-surface-2'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleContact(c.id)}
                            className="rounded border-border cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-text-primary">{c.name}</span>
                              {c.isChampion && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                  <Crown size={8} />
                                  Champion
                                </span>
                              )}
                              <span className="text-[10px] text-text-muted">&middot; {c.title}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-text-muted mt-0.5">
                              <Mail size={9} />
                              <span className="font-mono truncate">{c.email}</span>
                              <span className="ml-1">&middot; {c.source}</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-shrink-0 flex items-center gap-2 px-5 py-3 border-t border-border">
              <input
                type="text"
                value={wbName}
                onChange={(e) => setWbName(e.target.value)}
                placeholder={`Contacts from ${selectedAccountIds?.length || 0} accounts`}
                className="flex-1 px-2 py-1.5 text-xs bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary/40"
              />
              <button
                onClick={onClose}
                className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAs}
                disabled={selectedContactIds.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ListPlus size={11} />
                Save {selectedContactIds.length} as workbook
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
