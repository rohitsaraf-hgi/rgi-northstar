import { useState } from 'react';
import { Check, DollarSign } from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';

const CATEGORIES = [
  { id: 'software', label: 'Software', spend: '$2.1T', companies: '24.1M' },
  { id: 'hardware', label: 'Hardware', spend: '$580B', companies: '12.4M' },
  { id: 'networking', label: 'Networking', spend: '$340B', companies: '8.2M' },
  { id: 'security', label: 'Security', spend: '$210B', companies: '5.8M' },
  { id: 'cloud', label: 'Cloud Infrastructure', spend: '$420B', companies: '14.2M' },
  { id: 'services', label: 'IT Services', spend: '$1.1T', companies: '18.5M' },
];

export default function LiveSpendCategoryPicker({ submitted, selectedCategories, onSubmit, onPin }) {
  const [picked, setPicked] = useState(submitted ? selectedCategories : ['software']);

  const toggle = (id) => {
    if (submitted) return;
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <LiveFrame
      title="Which spend categories define your TAM?"
      subtitle="Pick one or more. TAM is global IT spend within these categories — narrower categories = a more defensible TAM."
      onPin={onPin}
    >
      <LiveCoachNote
        tone="guide"
        headline="For fintech security buyers: Software + IT Services covers ~85% of relevant spend."
        body="Hardware and Networking are rarely directly procured by fintech IT teams — they're bundled with Services contracts. Cloud Infrastructure overlaps with Software for SaaS-only sales motions. My recommendation: start with Software, add Services if you sell into managed-services teams."
        more={[
          "If you sell on-prem appliances, add Hardware + Networking. TAM grows ~40% but most of that growth is in industries you don't target.",
          "If your buyer is the Cloud Center of Excellence (not the security team), Cloud Infrastructure becomes the primary anchor.",
        ]}
        compact
        className="mb-3"
      />
      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((c) => {
          const isPicked = picked.includes(c.id);
          return (
            <button
              key={c.id}
              disabled={submitted}
              onClick={() => toggle(c.id)}
              className={`text-left p-2.5 rounded border transition-all ${
                isPicked
                  ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border bg-bg/40 hover:border-border-2'
              } ${submitted ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <DollarSign size={11} className={isPicked ? 'text-primary' : 'text-text-muted'} />
                  <span className="text-xs font-semibold text-text-primary">{c.label}</span>
                </div>
                {isPicked && <Check size={11} className="text-primary" />}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-mono font-semibold text-text-primary">{c.spend}</span>
                <span className="text-[10px] text-text-muted">{c.companies} cos</span>
              </div>
            </button>
          );
        })}
      </div>

      {!submitted && (
        <div className="flex items-center justify-between mt-3">
          <div className="text-[11px] text-text-muted">
            {picked.length} {picked.length === 1 ? 'category' : 'categories'} selected
          </div>
          <button
            onClick={() => onSubmit && onSubmit({ categories: picked })}
            disabled={picked.length === 0}
            className="px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim disabled:opacity-40 transition-colors font-medium"
          >
            Update TAM
          </button>
        </div>
      )}
      {submitted && (
        <div className="mt-3 px-2 py-1.5 bg-primary/[0.06] border border-primary/20 rounded text-[11px] text-primary inline-flex items-center gap-1.5">
          <Check size={11} />
          TAM updated · {selectedCategories.length}{' '}
          {selectedCategories.length === 1 ? 'category' : 'categories'}
        </div>
      )}
    </LiveFrame>
  );
}
