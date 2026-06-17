import { Sparkles } from 'lucide-react';
import { PARTICIPANT_PROFILES } from '../../data/artifacts.js';
import Avatar from '../shared/Avatar.jsx';
import ArtifactCard from './ArtifactCard.jsx';
import SurfaceBadge from '../shared/SurfaceBadge.jsx';
import AgentRunTurn from './AgentRunTurn.jsx';
import LiveMarketSize from './live/LiveMarketSize.jsx';
import LiveMarketBreakdown from './live/LiveMarketBreakdown.jsx';
import LiveCompetitorPenetration from './live/LiveCompetitorPenetration.jsx';
import LiveCompanyList from './live/LiveCompanyList.jsx';
import LiveAccountTriageList from './live/LiveAccountTriageList.jsx';
import LiveOutreachSequence from './live/LiveOutreachSequence.jsx';
import LiveChampionTracker from './live/LiveChampionTracker.jsx';
import LiveProspectList from './live/LiveProspectList.jsx';
import LiveTamSamSomMarketSize from './live/LiveTamSamSomMarketSize.jsx';
import LiveTamSamSomBreakdown from './live/LiveTamSamSomBreakdown.jsx';
import LiveTamSamSomCompetitor from './live/LiveTamSamSomCompetitor.jsx';
import LiveTamSamSomWhitespaceList from './live/LiveTamSamSomWhitespaceList.jsx';
import LiveICPSourcePicker from './live/LiveICPSourcePicker.jsx';
import LiveCSVDropzone from './live/LiveCSVDropzone.jsx';
import LiveSpendCategoryPicker from './live/LiveSpendCategoryPicker.jsx';
import LiveThresholdSliders from './live/LiveThresholdSliders.jsx';
import LiveICPDefinition from './live/LiveICPDefinition.jsx';
import LiveCompetitorPicker from './live/LiveCompetitorPicker.jsx';
import LiveMarketBuilder from './live/LiveMarketBuilder.jsx';
import LiveScoringProfileBuilder from './live/LiveScoringProfileBuilder.jsx';
import LiveScoredCompanyList from './live/LiveScoredCompanyList.jsx';

const LIVE_COMPONENTS = {
  MarketSize: LiveMarketSize,
  MarketBreakdown: LiveMarketBreakdown,
  CompetitorPenetration: LiveCompetitorPenetration,
  CompanyList: LiveCompanyList,
  AccountTriageList: LiveAccountTriageList,
  OutreachSequence: LiveOutreachSequence,
  ChampionTracker: LiveChampionTracker,
  ProspectList: LiveProspectList,
  TamSamSomMarketSize: LiveTamSamSomMarketSize,
  TamSamSomBreakdown: LiveTamSamSomBreakdown,
  TamSamSomCompetitor: LiveTamSamSomCompetitor,
  TamSamSomWhitespaceList: LiveTamSamSomWhitespaceList,
  ICPSourcePicker: LiveICPSourcePicker,
  CSVDropzone: LiveCSVDropzone,
  SpendCategoryPicker: LiveSpendCategoryPicker,
  ThresholdSliders: LiveThresholdSliders,
  ICPDefinition: LiveICPDefinition,
  CompetitorPicker: LiveCompetitorPicker,
  MarketBuilder: LiveMarketBuilder,
  ScoringProfileBuilder: LiveScoringProfileBuilder,
  ScoredCompanyList: LiveScoredCompanyList,
};

// Form-style live components route their submissions through onLiveSubmit
// so the parent thread can advance the script.
const FORM_COMPONENTS = new Set([
  'ICPSourcePicker',
  'CSVDropzone',
  'SpendCategoryPicker',
  'ThresholdSliders',
  'CompetitorPicker',
  'MarketBuilder',
  'ScoringProfileBuilder',
]);

// Action-style live components have explicit action callbacks (Save / Export /
// Enrich) rather than a single submit. Parent passes them through.
const ACTION_COMPONENTS = new Set([
  'TamSamSomWhitespaceList',
  'ScoredCompanyList',
]);

function LiveBlock({ turn, live, onPin, onFilterRemove, onLiveSubmit, onEditClick }) {
  const Component = LIVE_COMPONENTS[live.type];
  if (!Component) return null;

  const formProps = FORM_COMPONENTS.has(live.type)
    ? { onSubmit: (payload) => onLiveSubmit && onLiveSubmit(turn.id, live.type, payload) }
    : {};

  const actionProps = ACTION_COMPONENTS.has(live.type)
    ? {
        onSave: (payload) => onLiveSubmit && onLiveSubmit(turn.id, `${live.type}.save`, payload),
        onExport: (payload) => onLiveSubmit && onLiveSubmit(turn.id, `${live.type}.export`, payload),
        onEnrich: (payload) => onLiveSubmit && onLiveSubmit(turn.id, `${live.type}.enrich`, payload),
      }
    : {};

  return (
    <Component
      {...(live.props || {})}
      {...formProps}
      {...actionProps}
      onPin={() => onPin && onPin(live)}
      onFilterRemove={onFilterRemove}
      onEditClick={onEditClick}
    />
  );
}

export default function ConversationTurn({
  turn,
  collaborative = false,
  onPinLive,
  onFilterRemove,
  onAgentApprove,
  onAgentDismiss,
  onLiveSubmit,
  onEditClick,
}) {
  const isUser = turn.role === 'user';

  if (turn.role === 'agent') {
    return (
      <AgentRunTurn
        turn={turn}
        onApprove={onAgentApprove}
        onDismiss={onAgentDismiss}
      />
    );
  }

  if (turn.role === 'system') {
    return (
      <div className="my-3 flex items-center justify-center gap-2 text-xs text-text-muted">
        <span className="h-px flex-1 bg-border" />
        <span className="px-2 italic">{turn.content}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }

  if (isUser) {
    const asker = turn.asker ? PARTICIPANT_PROFILES[turn.asker.toLowerCase()] : null;
    return (
      <div className="flex flex-col items-end gap-1.5 mb-5">
        {collaborative && asker && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Avatar name={asker.name} initials={asker.initials} color={asker.color} size={16} />
            <span>{asker.name} asked</span>
          </div>
        )}
        <div
          className={`max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-md ${
            turn.surface === 'mcp'
              ? 'bg-amber-500/10 border border-amber-500/30 text-text-primary font-mono'
              : turn.surface === 'slack'
              ? 'bg-purple-500/10 border border-purple-500/30 text-text-primary'
              : 'bg-primary/10 border border-primary/20 text-text-primary'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{turn.content}</div>
        </div>
        <div className="flex items-center gap-2">
          {turn.surface && <SurfaceBadge surface={turn.surface} size="xs" />}
          {turn.timestamp && (
            <div className="text-[10px] text-text-muted">{turn.timestamp}</div>
          )}
        </div>
      </div>
    );
  }

  // AI turn
  const isMcp = turn.surface === 'mcp';
  // Stable DOM id used by the right rail to scroll to a specific turn.
  const domId = turn.id ? `turn-${turn.id}` : undefined;
  return (
    <div id={domId} className={`mb-6 pl-3 border-l-2 scroll-mt-4 ${isMcp ? 'border-amber-500/40' : 'border-primary/30'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isMcp ? 'bg-amber-500/15' : 'bg-primary/15'}`}>
          <Sparkles size={11} className={isMcp ? 'text-amber-700 dark:text-amber-300' : 'text-primary'} />
        </div>
        <span className="text-xs font-semibold text-text-primary">{isMcp ? 'RGI · via Claude Code' : 'RGI'}</span>
        {turn.surface && <SurfaceBadge surface={turn.surface} size="xs" />}
        {turn.timestamp && <span className="text-[10px] text-text-muted">{turn.timestamp}</span>}
      </div>
      <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{turn.content}</div>
      {turn.live && (
        <div className="mt-1">
          <LiveBlock
            turn={turn}
            live={turn.live}
            onPin={onPinLive}
            onFilterRemove={onFilterRemove}
            onLiveSubmit={onLiveSubmit}
            onEditClick={onEditClick}
          />
        </div>
      )}
      {turn.artifact && (
        <div className="mt-3">
          <ArtifactCard artifact={turn.artifact} inline collaborative={collaborative} commentCount={turn.commentCount || 0} />
        </div>
      )}
    </div>
  );
}
