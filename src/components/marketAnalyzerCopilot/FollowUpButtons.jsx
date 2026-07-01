// Follow-up buttons — pill-shaped, horizontal flex row.
//
// Each button maps to a follow-up action defined on the JTBD fixture:
//   action: 'export' | 'push' | 'alert' | 'bridge' | 'refine' | 'extend'
//
// The Copilot shell decides what each action does — buttons just emit
// the click. Primary action gets a solid bg.

import { ArrowRight, Download, Send, Bell, GitBranch, Sparkles, Bookmark } from 'lucide-react';

const ACTION_ICON = {
  export:         Download,
  push:           Send,
  alert:          Bell,
  bridge:         GitBranch,
  refine:         Sparkles,
  extend:         Sparkles,
  'save-segment': Bookmark,
};

export default function FollowUpButtons({ followUps, onAction }) {
  if (!Array.isArray(followUps) || followUps.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 ml-11">
      {followUps.map((fu) => {
        const Icon = ACTION_ICON[fu.action] || ArrowRight;
        return (
          <button
            key={fu.id}
            onClick={() => onAction(fu)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              fu.primary
                ? 'bg-primary text-white border-primary hover:bg-primary-dim'
                : 'bg-surface text-text-secondary border-border hover:border-primary/40 hover:text-primary'
            }`}
          >
            <Icon size={11} />
            {fu.label}
            <ArrowRight size={10} className="opacity-70" />
          </button>
        );
      })}
    </div>
  );
}
