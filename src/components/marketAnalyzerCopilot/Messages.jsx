// Message bubbles for the Copilot conversation.
//
// Spec §6:
//   User message: navy bg, white text, right-aligned, max-w 75%, rounded
//                 with bottom-right corner squared
//   Copilot message: white bg, gray-200 border, left-aligned, max-w 85%,
//                    rounded with bottom-left corner squared
//
// We adapt navy → primary (#4F7FFF) to match the existing RGI design
// tokens — the rest of the prototype already uses primary blue, not navy.
//
// inlineMarkdown is intentionally tiny — supports **bold** only. Heavier
// formatting belongs in Insight Cards, not message bubbles.

import { CopilotAvatar, UserAvatar } from './Avatars.jsx';

function inlineMarkdown(text) {
  if (typeof text !== 'string') return text;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function CopilotMessage({ children, text, dim = false }) {
  return (
    <div className="flex items-start gap-3">
      <CopilotAvatar />
      <div
        className={`max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2.5 border bg-surface ${
          dim ? 'border-border/60 text-text-secondary' : 'border-border text-text-primary'
        }`}
      >
        <div className="text-[13.5px] leading-relaxed">
          {text ? inlineMarkdown(text) : children}
        </div>
      </div>
    </div>
  );
}

export function UserMessage({ text, chips }) {
  return (
    <div className="flex items-start gap-3 justify-end">
      <div
        className="max-w-[75%] rounded-2xl rounded-br-md px-4 py-2.5 text-white"
        style={{ background: 'rgb(var(--color-primary))' }}
      >
        {text && (
          <div className="text-[13.5px] leading-relaxed">{text}</div>
        )}
        {Array.isArray(chips) && chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {chips.map((chip, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/15 border border-white/20"
              >
                <span className="opacity-80">{chip.label}:</span>
                <span>{chip.value}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <UserAvatar />
    </div>
  );
}

export function TypingIndicator({ label }) {
  return (
    <div className="flex items-start gap-3">
      <CopilotAvatar />
      <div className="rounded-2xl rounded-bl-md px-4 py-3 border border-border bg-surface inline-flex items-center gap-3">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        {label && <span className="text-[12px] text-text-secondary">{label}</span>}
      </div>
    </div>
  );
}
