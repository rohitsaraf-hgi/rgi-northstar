// ManageTeamDrawer — admin editor for creating + editing teams.
//
// A team carries:
//   - name + description
//   - audience role (account_owner | csm | sdr)
//   - offerings[] — multi-select from confirmed offerings
//   - scoringProfileId — picked from live scoring models
//   - defaultPlays[] — multi-select from active plays
//   - defaultAgents[] — multi-select from available agents
//   - members[] — sellers assigned (with optional "clone book from" source)
//
// Visibility/ownership note: only admins can create/edit teams. The drawer
// is opened from TeamsRoute.

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Check, Save, Users, Layers, Gauge, Swords, Bot, Copy, ArrowRight,
} from 'lucide-react';
import { ROLES } from '../../data/territoryDesign.js';

const AGENT_OPTIONS = [
  { id: 'account_brief',      label: 'Account Brief' },
  { id: 'email_outreach',     label: 'Email Outreach' },
  { id: 'find_more_contacts', label: 'Find More Contacts' },
  { id: 'opportunity_finder', label: 'Opportunity Finder' },
];

function ChipMulti({ label, icon: Icon, options, selected, onChange, optionKey = 'id', optionLabel = 'label' }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5 inline-flex items-center gap-1">
        {Icon && <Icon size={10} />} {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const key = typeof o === 'string' ? o : o[optionKey];
          const text = typeof o === 'string' ? o : o[optionLabel];
          const active = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(active ? selected.filter((x) => x !== key) : [...selected, key])}
              className={`text-[11px] px-2.5 py-1 rounded border ${
                active
                  ? 'bg-primary/15 text-primary border-primary/40 font-semibold'
                  : 'bg-surface border-border text-text-secondary hover:border-primary/30'
              }`}
            >
              {active && <Check size={9} className="inline mr-1" />}
              {text}
            </button>
          );
        })}
        {options.length === 0 && (
          <span className="text-[11px] text-text-muted italic">None available</span>
        )}
      </div>
    </div>
  );
}

function MemberRow({ seller, allSellers, onRemove, onSetCloneSource, cloneSource }) {
  // Eligible "clone from" sources = sellers other than this one, with at
  // least one account in their book.
  const sources = allSellers.filter((s) => s.id !== seller.id && s.status === 'active');
  return (
    <div className="bg-surface border border-border rounded p-2 flex items-center gap-2 text-[12px]">
      <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center font-semibold">
        {seller.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-text-primary truncate">{seller.name}</div>
        <div className="text-[10px] text-text-muted truncate">{seller.email}</div>
      </div>
      {seller.status === 'invited' && (
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <Copy size={9} />
          <span>Clone book from:</span>
          <select
            value={cloneSource || ''}
            onChange={(e) => onSetCloneSource(seller.id, e.target.value || null)}
            className="text-[10px] bg-bg/40 border border-border rounded px-1 py-0.5 text-text-primary"
          >
            <option value="">— None —</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
      <button onClick={() => onRemove(seller.id)} className="text-text-muted hover:text-rose-600">
        <X size={11} />
      </button>
    </div>
  );
}

export default function ManageTeamDrawer({
  team,
  offerings,
  plays,
  scoringModels,
  sellers,
  onSave,
  onClose,
}) {
  const isEdit = !!team?.id;
  const blank = {
    id: `team-${Date.now()}`,
    name: '',
    description: '',
    audience: 'account_owner',
    offerings: offerings.map((o) => o.id), // default = all
    scoringProfileId: scoringModels.find((m) => m.liveStatus !== 'draft')?.id || scoringModels[0]?.id || null,
    defaultPlays: plays.filter((p) => p.confirmed || p.status === 'active').slice(0, 3).map((p) => p.id),
    defaultAgents: ['account_brief', 'email_outreach'],
    memberSellerIds: [],
    cloneSourceBySellerId: {}, // { [sellerId]: sourceSellerId }
  };
  const [draft, setDraft] = useState(team || blank);

  // Seller picker — show all sellers; mark which are already in this team.
  const memberIds = draft.memberSellerIds || sellers.filter((s) => (s.teamId || s.team) === team?.id).map((s) => s.id);
  const memberSellers = sellers.filter((s) => memberIds.includes(s.id));
  const nonMemberSellers = sellers.filter((s) => !memberIds.includes(s.id));

  function patch(updates) {
    setDraft((prev) => ({ ...prev, ...updates }));
  }

  function addMember(sellerId) {
    patch({ memberSellerIds: [...memberIds, sellerId] });
  }
  function removeMember(sellerId) {
    patch({
      memberSellerIds: memberIds.filter((id) => id !== sellerId),
      cloneSourceBySellerId: Object.fromEntries(
        Object.entries(draft.cloneSourceBySellerId || {}).filter(([k]) => k !== sellerId),
      ),
    });
  }
  function setCloneSource(sellerId, sourceId) {
    patch({
      cloneSourceBySellerId: { ...(draft.cloneSourceBySellerId || {}), [sellerId]: sourceId },
    });
  }

  function canSave() {
    return draft.name.trim().length > 0;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-surface border border-border rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg/40 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-primary" />
            <h2 className="text-sm font-semibold text-text-primary">
              {isEdit ? `Edit ${team.name}` : 'Create a team'}
            </h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name + description */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">Team name</label>
            <input
              autoFocus
              type="text"
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="e.g. Enterprise West"
              className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={2}
              placeholder="Short description of this team's motion"
              className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none resize-none"
            />
          </div>

          {/* Audience role */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">Audience role</label>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => patch({ audience: r.id })}
                  className={`text-[11px] px-2.5 py-1 rounded border ${
                    draft.audience === r.id
                      ? 'bg-primary/15 text-primary border-primary/40 font-semibold'
                      : 'bg-surface border-border text-text-secondary hover:border-primary/30'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Offerings */}
          <ChipMulti
            label="Offerings"
            icon={Layers}
            options={offerings.map((o) => ({ id: o.id, label: o.shortName || o.name }))}
            selected={draft.offerings || []}
            onChange={(offeringsSel) => patch({ offerings: offeringsSel })}
          />

          {/* Scoring profile */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5 inline-flex items-center gap-1">
              <Gauge size={10} /> Scoring profile
            </label>
            <div className="flex flex-wrap gap-1.5">
              {scoringModels.map((m) => {
                const active = draft.scoringProfileId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => patch({ scoringProfileId: m.id })}
                    className={`text-[11px] px-2.5 py-1 rounded border ${
                      active
                        ? 'bg-primary/15 text-primary border-primary/40 font-semibold'
                        : 'bg-surface border-border text-text-secondary hover:border-primary/30'
                    }`}
                  >
                    {active && <Check size={9} className="inline mr-1" />}
                    {m.name}
                  </button>
                );
              })}
              {scoringModels.length === 0 && (
                <span className="text-[11px] text-text-muted italic">No scoring models — confirm one in Admin → Scoring</span>
              )}
            </div>
          </div>

          {/* Default plays */}
          <ChipMulti
            label="Default plays"
            icon={Swords}
            options={plays.map((p) => ({ id: p.id, label: p.name }))}
            selected={draft.defaultPlays || []}
            onChange={(playsSel) => patch({ defaultPlays: playsSel })}
          />

          {/* Default agents */}
          <ChipMulti
            label="Default agents"
            icon={Bot}
            options={AGENT_OPTIONS}
            selected={draft.defaultAgents || []}
            onChange={(agentsSel) => patch({ defaultAgents: agentsSel })}
          />

          {/* Members */}
          <div className="bg-bg/30 border border-border/60 rounded p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-text-muted">
              <Users size={11} /> Members
              <span className="text-text-muted/60 normal-case tracking-normal font-normal ml-1">
                — clone-book option appears for invited (not yet active) sellers
              </span>
            </div>
            {memberSellers.length > 0 && (
              <div className="space-y-1.5">
                {memberSellers.map((seller) => (
                  <MemberRow
                    key={seller.id}
                    seller={seller}
                    allSellers={sellers}
                    onRemove={removeMember}
                    onSetCloneSource={setCloneSource}
                    cloneSource={draft.cloneSourceBySellerId?.[seller.id]}
                  />
                ))}
              </div>
            )}
            {nonMemberSellers.length > 0 && (
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block mb-1 mt-2">
                  Add seller
                </label>
                <select
                  value=""
                  onChange={(e) => e.target.value && addMember(e.target.value)}
                  className="w-full px-2 py-1.5 bg-surface border border-border rounded text-[12px] text-text-primary focus:border-primary/40 focus:outline-none"
                >
                  <option value="">— Pick a seller to add —</option>
                  {nonMemberSellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email}){s.status === 'invited' ? ' · invited' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border bg-bg/40 flex items-center justify-end gap-2 sticky bottom-0">
          <button
            onClick={onClose}
            className="text-[12px] px-3 py-1.5 rounded border border-border text-text-secondary hover:border-primary/30"
          >
            Cancel
          </button>
          <button
            disabled={!canSave()}
            onClick={() => onSave(draft)}
            className="text-[12px] px-3 py-1.5 rounded bg-primary text-white hover:bg-primary-dim disabled:opacity-40 font-semibold inline-flex items-center gap-1.5"
          >
            <Save size={11} /> {isEdit ? 'Save changes' : 'Create team'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
