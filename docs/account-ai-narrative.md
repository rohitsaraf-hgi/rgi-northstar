# Account AI — the Account Coach

*An agentic layer that carries the full context of an account and helps the seller move from "what's going on with this account" to "here's my plan for the next two weeks" — faster than they could figure out alone.*

---

## The framing

Account AI isn't an in-account chatbot. It's the seller's **Account Coach** — grounded in the full context of one account (HG proprietary data × the tenant's first-party data) and opinionated about what the rep should do next.

Two things distinguish Account Coach from generic AI chat:

1. **Grounded per-account.** Every claim traces to a source — an HG signal, a CRM field, a call transcript, an email. No generic frameworks parachuted in.
2. **Opinionated.** It doesn't just present information; it recommends. When it doesn't have enough context to be precise, it *asks* — instead of guessing.

---

## The four jobs Account Coach does

### 1. Diagnose — *"Where is this account right now?"*

- **Account summary** — the current state in one paragraph, refreshed automatically
- **Recent activity digest** — what's happened in the last 7 / 14 / 30 days across CRM, email, meetings, and first-party events
- **Health & momentum** — is the deal moving, stalling, or slipping? Directional score with reasons
- **Risks surfaced** — single-threading, silent stakeholder, competitor gaining ground, timing slipping
- **Opportunities surfaced** — multi-product fit, adjacent buyer entering, budget event, exec change

### 2. Strategize — *"What should I do?"*

- **Account strategy** — a 2–4 week plan grounded in the account's current state
- **Next best action** — one specific, timed recommendation (not a menu of five)
- **Entry point** — for a new account or new persona: who to reach first, and why
- **Play recommendation** — which of the tenant's Sales Plays fits this account today
- **Multi-threading map** — persona coverage gaps + who to add + why they'd care

### 3. Execute — *"Help me do the next thing"*

- **Personalized outreach** — email and LinkedIn drafts tied to a specific person, moment, and pain point
- **Meeting prep brief** — a pre-meeting one-pager on attendees, prior context, and likely objections
- **Objection handling** — for known objections, a talk track grounded in the account's own context
- **Content generation** — battlecards, ROI narratives, executive summaries
- **Uncover new contacts** — persona-driven discovery via HG + LinkedIn signals

### 4. Coach — *"What am I missing?"*

- **Pattern surfacing** — *"In similar deals your team lost, this signal preceded churn. Watch for it."*
- **Champion health** — *"Your champion hasn't opened a message in 21 days. When this happened at [X], the deal stalled by [Y] weeks."*
- **What-if analysis** — *"If your champion leaves, here's your fallback plan."*
- **Post-mortem prep** — for won or lost deals, help the rep summarize what worked and what didn't

---

## A worked example: the single-champion case

> **Coach detects** — Only one meaningful contact on JPMorgan Chase (Sarah Chen). Deal size $285K. Stage: Discovery.
>
> **Coach diagnoses** — *"You're single-threaded. 60% of enterprise deals with one contact stall or slip. Sarah hasn't opened an email in 14 days — her engagement is decaying."*
>
> **Coach strategizes** — *"Multi-thread. Three personas matter here given your CNAPP pitch: (a) VP Cloud Security — Diana Park is in HG's contact universe, not in your CRM; (b) CFO — Patricia Singh, active on LinkedIn about security spend; (c) CTO office — Marcus Wei, LinkedIn shows he's evaluating CNAPP vendors."*
>
> **Coach executes** — *"Want me to draft three intro emails, each personalized to that persona's angle? Or should we start with an intro request through Sarah?"*
>
> **Coach coaches** — *"Two similar single-threaded deals this quarter stalled at the same stage. The reps who unblocked them started with the technical persona first, not the exec — better response rate."*

That's what Account Coach should feel like. Not one giant answer — a diagnosis that leads to a plan that leads to an offer to execute, with coaching layered on top.

---

## Interaction principles (how it behaves)

The capabilities matter less than the *behavior*. Five principles Account Coach lives by:

1. **Opens with a point of view, not a blank prompt.** Landing on the account, the rep sees *"3 things worth your time today"* — not *"How can I help you?"*
2. **Clarifies before executing.** If a rep says *"draft an email,"* Coach asks *"to whom, about what, and what outcome are you targeting?"* — then drafts something precise.
3. **Cites everything.** Every claim traces to a source. No unattributed assertions.
4. **Returns options, not walls of text.** Three angles, three drafts, three actions — not one long answer.
5. **Ends every response with a handrail.** *"Want me to draft the follow-up? Should I check who else is engaging?"* Every turn leads forward.

---

## Multi-agent architecture, one experience

Account Coach is an orchestrator, not a single model. Underneath, it composes atomic agents already in the platform:

- **Read agents** — Get account context · Get engagement history · Find buying personas · Score account · Find competitor accounts
- **Write agents** — Draft personalized email · Generate account brief · Create CRM tasks · Add contacts to sequence
- **Reason agents** — Health assessment · Risk detection · Strategy synthesis · Pattern matching

The rep never sees this decomposition. They see a coach. But the architecture means each capability is testable, replaceable, and improvable independently — and every action Coach takes runs through the platform's existing approval gates and audit trail.

---

## Where it lives

Account Coach is the **primary surface** on every account. When a rep opens an account, they land on Coach by default — current state, top 3 recommendations, and a conversation input. Everything else (Contacts, Artifacts, Overview, MEDDIC) is one click away.

Every artifact Coach generates — briefs, emails, battlecards — persists to the account's Artifacts so the rep can re-open, edit, or send later. Every action Coach recommends can be executed inline, or promoted to a tenant-wide Sales Play so the pattern gets encoded for reuse.

---

## Why this compounds

The reason Account Coach matters isn't the individual capabilities. It's that every rep interaction with an account produces three kinds of leverage:

- **Better context** — what got tried, what worked, what got a response
- **Better patterns** — which recommendations landed, which didn't
- **Better plays** — successful moves get promoted to tenant-wide Sales Plays

Coach isn't just serving one rep on one account. It's the thin surface that lets HG's data, the tenant's CRM, and the rep's own judgment compound into a system that gets sharper every week.

---

**Account Coach turns the account view from a report you read into a coach you talk to — one that knows this account, has an opinion about what to do next, and can run the play with you.**
