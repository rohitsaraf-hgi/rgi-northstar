import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, AtSign, Check, X, Clock, ExternalLink, MessageSquare } from 'lucide-react';
import { SLACK_MESSAGES } from '../../data/surfaces.js';
import { usePersona } from '../../context/PersonaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

// Visual constants tuned to Slack's actual UI conventions — purple aubergine
// header, rounded message blocks, button rows with green/red/secondary tints.

function ChannelHeader({ channel }) {
  if (channel === 'DM') {
    return (
      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1">
        <AtSign size={9} />
        Direct message · RGI Bot
      </div>
    );
  }
  return (
    <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1">
      <Hash size={9} />
      {channel.replace('#', '')}
    </div>
  );
}

function MessageHeader({ msg }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <div
        className="w-6 h-6 rounded text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0"
        style={{ background: msg.senderColor }}
      >
        {msg.senderInitials}
      </div>
      <span className="text-sm font-bold text-text-primary">{msg.sender}</span>
      <span className="text-[10px] text-text-muted">{msg.timestamp}</span>
    </div>
  );
}

function ActionButton({ action, onClick, disabled = false, resolved = false, resolvedLabel }) {
  if (resolved) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/15 text-success rounded text-[11px] font-semibold">
        <Check size={11} />
        {resolvedLabel}
      </span>
    );
  }
  const styles =
    action.kind === 'approve'
      ? 'bg-[#007A5A] text-white hover:bg-[#006a4e]' // Slack's "primary" green
      : action.kind === 'reject'
      ? 'border border-border bg-surface text-danger hover:bg-danger/10'
      : action.kind === 'snooze'
      ? 'border border-border bg-surface text-text-secondary hover:bg-surface-2'
      : 'border border-border bg-surface text-text-primary hover:bg-surface-2';
  const icon =
    action.kind === 'approve' ? (
      <Check size={11} />
    ) : action.kind === 'reject' ? (
      <X size={11} />
    ) : action.kind === 'snooze' ? (
      <Clock size={11} />
    ) : (
      <ExternalLink size={11} />
    );
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${styles} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {icon}
      {action.label}
    </button>
  );
}

function MessageBlock({ msg, onAction, resolvedApprovals }) {
  const navigate = useNavigate();
  const isResolved = msg.approvalId && resolvedApprovals[msg.approvalId];

  return (
    <div className="border border-border rounded-md bg-surface p-3 mb-2">
      <ChannelHeader channel={msg.channel} />
      <div className="mt-2">
        <MessageHeader msg={msg} />

        {/* Body */}
        <div className="space-y-2 ml-8">
          {msg.text && (
            <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{msg.text}</div>
          )}
          {msg.title && (
            <div className="text-sm font-semibold text-text-primary">{msg.title}</div>
          )}
          {msg.body && (
            <div className="text-sm text-text-secondary leading-relaxed">{msg.body}</div>
          )}
          {msg.bullets && (
            <div className="bg-bg/40 border-l-2 border-primary/40 pl-3 py-2 space-y-1">
              {msg.bullets.map((b, i) => (
                <div key={i} className="text-xs text-text-secondary leading-relaxed">{b}</div>
              ))}
            </div>
          )}

          {/* Thread reference */}
          {msg.threadId && (
            <button
              onClick={() => navigate(`/thread/${msg.threadId}`)}
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary-dim transition-colors"
            >
              <ExternalLink size={9} />
              {msg.threadName}
            </button>
          )}
          {msg.replyCount > 0 && (
            <div className="text-[10px] text-text-muted flex items-center gap-1">
              <MessageSquare size={9} />
              {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'} in thread
            </div>
          )}

          {/* Action buttons */}
          {msg.actions && msg.actions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
              {msg.actions.map((a, i) => {
                if (msg.approvalId && (a.kind === 'approve' || a.kind === 'reject') && isResolved) {
                  if (a.kind === resolvedApprovals[msg.approvalId]) {
                    return (
                      <ActionButton
                        key={i}
                        action={a}
                        resolved
                        resolvedLabel={a.kind === 'approve' ? `${a.label} ✓` : `${a.label} ✗`}
                      />
                    );
                  }
                  return null;
                }
                return (
                  <ActionButton
                    key={i}
                    action={a}
                    onClick={() => onAction(msg, a)}
                    disabled={isResolved && a.kind !== 'open'}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SlackMessages({ resolvedApprovals, onApprovalAction }) {
  const { personaId, persona } = usePersona();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const messages = SLACK_MESSAGES[personaId] || [];

  const handleAction = (msg, action) => {
    if (action.kind === 'open' && msg.threadId) {
      navigate(`/thread/${msg.threadId}`);
      return;
    }
    if (action.kind === 'snooze') {
      showToast(`Snoozed in Slack — will not re-notify until tomorrow`);
      return;
    }
    if ((action.kind === 'approve' || action.kind === 'reject') && msg.approvalId) {
      onApprovalAction(msg.approvalId, action.kind, msg);
    }
  };

  return (
    <div>
      {/* Slack workspace header */}
      <div className="mb-3 px-3 py-2 bg-[#4A154B] rounded-md flex items-center gap-2">
        <div className="w-5 h-5 bg-white/15 rounded flex items-center justify-center text-white text-[9px] font-bold">
          HG
        </div>
        <div className="flex-1 text-white">
          <div className="text-xs font-semibold leading-tight">HG Insights · Sales</div>
          <div className="text-[10px] text-white/70">Connected to RGI · 47 users</div>
        </div>
        <div className="text-[10px] text-white/70">{persona.name.split(' ')[0]}'s view</div>
      </div>

      {/* Messages */}
      {messages.map((msg) => (
        <MessageBlock
          key={msg.id}
          msg={msg}
          onAction={handleAction}
          resolvedApprovals={resolvedApprovals}
        />
      ))}

      {/* Footer */}
      <div className="mt-3 px-3 py-2 bg-bg/40 border border-border rounded-md text-[11px] text-text-secondary leading-relaxed">
        <div className="flex items-center gap-1.5 mb-1">
          <MessageSquare size={11} className="text-primary" />
          <span className="text-text-primary font-semibold">How this works</span>
        </div>
        Slack is an ambient delivery layer — these messages are projections of platform state, not the source of truth. Tapping a button here mutates the canonical thread; any open browser tab updates in real time.
      </div>
    </div>
  );
}
