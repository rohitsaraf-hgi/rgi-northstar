// Teams — admin's surface for creating + editing seller teams.
//
// Three default teams ship for every tenant (Account Owners, CSMs, SDRs).
// Admins can create custom teams, edit any team's offerings/plays/scoring/
// agents, assign sellers, and (for new invitees) clone another seller's book.
//
// CRM-connected mode: when Salesforce is connected, teams can sync from
// Account.Owner.Role or a custom Account field. Banner at top exposes the
// mapping. (Sync execution stubbed in v1.)

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Users, Plus, Layers, Gauge, Swords, Bot, Edit2, Trash2, Plug,
} from 'lucide-react';
import {
  listTeams, listSellers, upsertTeam, deleteTeam, assignSellerToTeam,
  cloneBookFromSeller, subscribeTerritory, ROLES,
} from '../data/territoryDesign.js';
import { listOfferings } from '../data/offerings.js';
import { listPlays } from '../data/plays.js';
import { SCORING_MODELS } from '../data/scoringModels.js';
import { getScoringModelStatus } from '../data/configStore.js';
import { getIntegrationGovernance } from '../data/integrationGovernance.js';
import { getPlay } from '../data/plays.js';
import ManageTeamDrawer from '../components/admin/ManageTeamDrawer.jsx';
import { useToast } from '../context/ToastContext.jsx';

const AGENT_LABELS = {
  account_brief:      'Account Brief',
  email_outreach:     'Email Outreach',
  find_more_contacts: 'Find More Contacts',
  opportunity_finder: 'Opportunity Finder',
};

function TeamCard({ team, sellers, offerings, scoringModels, onEdit, onDelete }) {
  const role = ROLES.find((r) => r.id === team.audience);
  const teamSellers = sellers.filter((s) => (s.teamId || s.team) === team.id);
  const invitedSellers = teamSellers.filter((s) => s.status === 'invited');

  // Resolve offering labels — team's offerings[] may be ids or labels
  const teamOfferingIds = team.offerings || [];
  const offeringLabels = teamOfferingIds
    .map((id) => {
      const o = offerings.find((of) => of.id === id);
      return o ? (o.shortName || o.name) : id;
    })
    .filter(Boolean);

  // Scoring model name
  const scoringModel = scoringModels.find((m) => m.id === team.scoringProfileId);
  const scoringName = scoringModel?.name || 'Default tenant scoring';

  return (
    <div className="bg-surface border border-border rounded-md p-4 group">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <Users size={16} className="text-blue-700 dark:text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="text-sm font-semibold text-text-primary">{team.name}</h3>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-2 text-text-muted font-semibold">
              {role?.label || team.audience}
            </span>
          </div>
          <p className="text-[12px] text-text-secondary leading-snug">{team.description}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="text-[11px] px-2 py-1 rounded border border-border hover:border-primary/30 text-text-secondary hover:text-primary inline-flex items-center gap-1"
          >
            <Edit2 size={10} /> Edit
          </button>
          <button
            onClick={onDelete}
            className="text-[11px] px-2 py-1 rounded border border-border hover:border-rose-500/40 text-text-muted hover:text-rose-600"
            title="Delete team"
          >
            <Trash2 size={10} />
          </button>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <div className="text-lg font-semibold text-text-primary">{teamSellers.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted">
            {teamSellers.length === 1 ? 'Seller' : 'Sellers'}
          </div>
          {invitedSellers.length > 0 && (
            <div className="text-[10px] text-blue-700 dark:text-blue-300 mt-0.5">
              · {invitedSellers.length} pending
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] mb-3">
        <div className="flex items-start gap-1.5">
          <Layers size={11} className="text-violet-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-text-muted">Offerings:</span>{' '}
            <span className="text-text-primary">
              {offeringLabels.length > 0 ? offeringLabels.join(', ') : 'All confirmed (inherits tenant)'}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <Gauge size={11} className="text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-text-muted">Scoring:</span>{' '}
            <span className="text-text-primary">{scoringName}</span>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <Swords size={11} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-text-muted">Plays:</span>{' '}
            <span className="text-text-primary">
              {(team.defaultPlays || []).map((pid) => getPlay(pid)?.name || pid).filter(Boolean).join(', ') || '—'}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <Bot size={11} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-text-muted">Agents:</span>{' '}
            <span className="text-text-primary">
              {(team.defaultAgents || []).map((aid) => AGENT_LABELS[aid] || aid).join(', ')}
            </span>
          </div>
        </div>
      </div>

      {teamSellers.length > 0 && (
        <div className="pt-3 border-t border-border/60">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">Members</div>
          <div className="flex flex-wrap gap-1.5">
            {teamSellers.map((s) => (
              <div
                key={s.id}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] ${
                  s.status === 'invited'
                    ? 'border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300'
                    : 'border-border bg-bg/40 text-text-secondary'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] flex items-center justify-center font-bold">
                  {s.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                </span>
                {s.name}
                {s.status === 'invited' && <span className="text-[9px] uppercase">· pending</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CrmBanner({ hasCrm }) {
  if (!hasCrm) return null;
  return (
    <div className="mb-5 bg-emerald-500/5 border border-emerald-500/30 rounded p-3 flex items-center gap-3">
      <Plug size={14} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0" />
      <div className="text-[12px] text-text-secondary flex-1">
        <strong className="text-text-primary">Salesforce connected.</strong> Teams can sync automatically
        from <code className="bg-surface-2 px-1 py-0.5 rounded font-mono text-[11px]">Account.Owner.Role</code>{' '}
        or a custom field. Mapping config ships in the next iteration.
      </div>
      <button className="text-[11px] text-primary hover:underline font-semibold flex-shrink-0">
        Configure mapping →
      </button>
    </div>
  );
}

export default function TeamsRoute() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(null); // team object | 'new' | null
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [, setTick] = useState(0);
  useEffect(() => subscribeTerritory(() => setTick((t) => t + 1)), []);

  const teams = listTeams();
  const sellers = listSellers();
  const offerings = listOfferings();
  const plays = listPlays();
  const scoringModels = SCORING_MODELS.map((m) => ({
    ...m,
    liveStatus: getScoringModelStatus(m.id).liveStatus,
  }));

  const hasCrm = getIntegrationGovernance('salesforce')?.agentAccess === true ||
                 getIntegrationGovernance('hubspot')?.agentAccess === true;

  function handleSave(draft) {
    // Persist the team config first
    upsertTeam({
      id: draft.id,
      name: draft.name,
      description: draft.description,
      audience: draft.audience,
      offerings: draft.offerings,
      scoringProfileId: draft.scoringProfileId,
      defaultPlays: draft.defaultPlays,
      defaultAgents: draft.defaultAgents,
    });

    // Apply member assignments — also handle book-cloning for invited sellers
    // whose admin selected a "clone from" source.
    const memberIds = draft.memberSellerIds || [];
    for (const sellerId of memberIds) {
      assignSellerToTeam(sellerId, draft.id);
      const cloneSource = draft.cloneSourceBySellerId?.[sellerId];
      if (cloneSource) {
        cloneBookFromSeller(cloneSource, sellerId);
      }
    }

    setEditing(null);
    showToast(`Team "${draft.name}" saved`, 'success');
  }

  function handleDelete(id) {
    const team = teams.find((t) => t.id === id);
    deleteTeam(id);
    setConfirmDelete(null);
    showToast(`Team "${team?.name}" deleted`, 'info');
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Admin Hub
      </button>

      <div className="mb-2 text-xs text-text-muted">User Management · Teams</div>

      <div className="flex items-end justify-between mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
        >
          <Plus size={12} />
          New team
        </button>
      </div>

      <p className="text-sm text-text-secondary mb-6 max-w-3xl">
        Three default teams ship for every tenant — Account Owners (AEs / AMs), CSMs, and SDRs / BDRs.
        CSV uploads with the <code className="bg-surface-2 px-1 py-0.5 rounded text-[11px] font-mono">owner_role</code>{' '}
        column auto-assign new sellers to the matching team. Edit any team's offerings, scoring, plays, and
        agents below; assign members; and clone an existing seller's book when ramping new invitees.
      </p>

      <CrmBanner hasCrm={hasCrm} />

      <div className="grid grid-cols-1 gap-3">
        {teams.map((t) => (
          <TeamCard
            key={t.id}
            team={t}
            sellers={sellers}
            offerings={offerings}
            scoringModels={scoringModels}
            onEdit={() => setEditing(t)}
            onDelete={() => setConfirmDelete(t.id)}
          />
        ))}
      </div>

      <AnimatePresence>
        {editing && (
          <ManageTeamDrawer
            team={editing === 'new' ? null : editing}
            offerings={offerings}
            plays={plays}
            scoringModels={scoringModels}
            sellers={sellers}
            onSave={handleSave}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-surface border border-border rounded-lg p-5 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-text-primary mb-1">Delete this team?</h3>
              <p className="text-[12px] text-text-secondary mb-4">
                Sellers in this team will be unassigned (kept on the platform). Their book ownership and
                invitation status are unaffected.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-[12px] px-3 py-1.5 rounded border border-border text-text-secondary hover:border-primary/30"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="text-[12px] px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-500 font-semibold"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
