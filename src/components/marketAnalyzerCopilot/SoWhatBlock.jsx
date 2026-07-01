// "So What" block — attaches visually to the Insight Card above it.
//
// Spec §6: dark navy gradient bg, three insight rows. Each row has a
// small colored icon (32px square, rounded), a bold opening phrase,
// then the rest of the insight.
//
// We adapt navy → a deeper primary-dim gradient with a purple wash to
// match the Copilot avatar palette. Reads as "this is interpretation,
// not raw data."

import { Lightbulb, AlertOctagon, Target } from 'lucide-react';

const ROWS = [
  {
    key: 'opportunity',
    label: 'Opportunity',
    Icon: Lightbulb,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-300',
    border: 'border-emerald-400/50',
  },
  {
    key: 'risk',
    label: 'Risk',
    Icon: AlertOctagon,
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-300',
    border: 'border-rose-400/50',
  },
  {
    key: 'action',
    label: 'Action',
    Icon: Target,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-300',
    border: 'border-amber-400/50',
  },
];

export default function SoWhatBlock({ soWhat }) {
  return (
    <div
      className="rounded-xl p-5 text-white"
      style={{
        background:
          'linear-gradient(135deg, #1A2547 0%, #1F2B52 40%, #2E2752 100%)',
      }}
    >
      <div className="text-[10px] uppercase tracking-wider font-bold text-white/60 mb-3 inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
        So What
      </div>
      <div className="space-y-3">
        {ROWS.map((row) => {
          const insight = soWhat[row.key];
          if (!insight) return null;
          return (
            <div
              key={row.key}
              className={`flex items-start gap-3 border-l-2 pl-3 ${row.border}`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${row.iconBg}`}
              >
                <row.Icon size={14} className={row.iconColor} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-bold text-white/50 mb-0.5">
                  {row.label}
                </div>
                <div className="text-[13.5px] font-semibold text-white leading-snug">
                  {insight.headline}
                </div>
                <div className="text-[12px] text-white/75 mt-1 leading-relaxed">
                  {insight.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
