// Avatars for Copilot conversation bubbles.
//
// CopilotAvatar — gradient circle with an "MA" mark (spec §6).
// UserAvatar    — initials on a warm-cream tone, matches the rest of
//                  the chrome's PersonaSwitcher.

export function CopilotAvatar({ size = 32 }) {
  return (
    <div
      className="flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white text-[10px] tracking-tight"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #4F7FFF 0%, #6B4FA0 100%)',
      }}
      title="Market Analyzer Copilot"
    >
      MA
    </div>
  );
}

export function UserAvatar({ initials = 'RS', size = 32 }) {
  return (
    <div
      className="flex-shrink-0 rounded-full flex items-center justify-center font-bold text-text-primary text-[11px] bg-surface-2 border border-border-2"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}
