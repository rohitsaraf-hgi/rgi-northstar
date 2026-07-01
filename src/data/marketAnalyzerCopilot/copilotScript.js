// Market Analyzer Copilot — all Copilot utterances live here.
//
// Section 2 of the spec: "All copy lives in content/copilot-script.ts.
// Do not inline strings in components — content is data."
//
// Two reasons:
//   1) Voice / tone tuning happens in one place
//   2) Engineers shipping the real product can swap fixtures for an LLM
//      without touching component code.
//
// Sections:
//   welcome   — greeting + suggested starter prompts
//   intent    — acknowledgment messages after intent classification
//   extraction — generic extraction patterns (per-question text lives on
//                the JTBD parameter itself)
//   analysis  — phase-transition messages while the API chain is running
//   confused  — fallback when no intent matches
//   bridge    — opening messages when one JTBD bridges to another

export const copilotScript = {
  welcome: {
    greeting: (firstName) => `Welcome back, ${firstName}.`,
    subtitle: 'What market question can I help you with today?',
    starterHeader: 'Try one of these — or describe what you\'re looking for.',
    starterPrompts: [
      {
        id: 'starter-jtbd1',
        jtbd: 1,
        label: 'Size the market',
        promptText: 'I want to size the market for Revenue Intelligence',
        examples: '$ TAM · SAM · SOM · competitor share · industry attractiveness',
      },
      {
        id: 'starter-jtbd4',
        jtbd: 4,
        label: 'Find whitespace',
        promptText: 'Show me whitespace accounts in my ICP',
        examples: 'Net-new logo (not in CRM, no competitor) — tiered by intent + spend',
      },
      {
        id: 'starter-jtbd6',
        jtbd: 6,
        label: 'Plan a displacement',
        promptText: 'I want to go after Gong\'s install base',
        examples: 'Aged installs + declining usage + intent — with per-tier messaging',
      },
      {
        id: 'starter-jtbd7',
        jtbd: 7,
        label: 'Manage ICP segments',
        promptText: 'Show me my saved ICP segments',
        examples: 'Coming soon — persistent segment library (JTBD 7)',
        comingSoon: true,
      },
    ],
  },

  intent: {
    acknowledged: (jtbdTitle) =>
      `Got it — sounds like a **${jtbdTitle}** question. Let me ask a couple of things to scope this.`,
    bridged: (jtbdTitle) =>
      `Continuing into **${jtbdTitle}** — I'll bring the context with me.`,
  },

  extraction: {
    confirmDefault: (label) =>
      label
        ? `I'll use your ${label} unless you'd like to change it.`
        : 'I\'ll use your saved default unless you\'d like to change it.',
    progress: (n, total) => `Step ${n} of ${total}`,
    skipLink: 'Use default',
    finished: 'Got everything I need. Running the analysis now.',
  },

  analysis: {
    starting: (jtbdShort) => `Running ${jtbdShort.toLowerCase()} analysis…`,
    rendered: 'Here\'s what I found.',
  },

  confused: {
    text:
      'I\'m not sure which analysis you\'re after. Pick one of the things I can run today:',
  },

  bridge: {
    crossJtbd: (fromTitle, toTitle) =>
      `Bridging from **${fromTitle}** to **${toTitle}** — passing the context across.`,
  },

  actions: {
    exportToast: (format) =>
      `Exported as ${format.toUpperCase()} — added to your downloads.`,
    pushToast: (destination) =>
      `Pushed to ${destination} — admins will route owners via Territory Design.`,
    alertToast: (alertType) =>
      `Alert set — I'll watch for ${alertType.replace(/_/g, ' ')} and ping you.`,
    refineToast: (dimension) =>
      `Re-running with ${dimension} breakdown… (stub for the prototype)`,
    saveSegmentToast: (name) =>
      `Saved "${name}" to your ICP Segment library. MoM tracking enabled.`,
  },
};
