// Pre-populated conversation histories for hero threads.
// Each turn: { id, role: 'user' | 'ai', timestamp, content, artifact?, asker? }
// content can include text and inline tables.

export const CONVERSATIONS = {
  'fintech-icp-q2': [
    {
      id: 't1',
      role: 'user',
      timestamp: 'April 22, 9:14 AM',
      content: 'Refresh my Fintech Mid-Market ICP for Q2 — overlay Q1 closed-won data and tell me what shifted.',
    },
    {
      id: 't2',
      role: 'ai',
      timestamp: 'April 22, 9:14 AM',
      content:
        "I refreshed your Fintech Mid-Market ICP using the 47 Q1 closed-won accounts as supervised signal. Three things shifted versus your January build:\n\n1. Headcount band tightened — closed-won lands between 220 and 1,400 employees, narrower than the 150–2,500 range you were originally targeting.\n2. Tech-stack signal strengthened — 89% of closed-won had Salesforce + a CDP (Segment, mParticle, or Rudderstack) installed. This is now a primary firmographic.\n3. Geography concentrated — North America accounted for 40 of 47 wins. APAC and EMEA underperformed, but sample is thin.\n\nThe refreshed segment has 4,200 companies. Score distribution: 340 Very Good, 890 Good, 1,580 Medium, 1,390 Low.",
      artifact: {
        id: 'a1',
        type: 'SEGMENT',
        name: 'Fintech Mid-Market — Q2 Refresh',
        meta: '4,200 companies · Very Good: 340 · Good: 890',
        timestamp: 'April 22, 9:15 AM',
        version: 'v2.0',
      },
    },
    {
      id: 't3',
      role: 'user',
      timestamp: 'April 23, 11:30 AM',
      content: 'Precision on the test holdout looks lower than v1. What\'s driving the drop?',
    },
    {
      id: 't4',
      role: 'ai',
      timestamp: 'April 23, 11:31 AM',
      content:
        "Precision dropped from 0.91 (v1) to 0.78 (v2). The driver is the CDP signal — it lifts recall but introduces false positives in the medium tier. Specifically, 12 accounts scored Very Good have CDP installed but are <150 employees, which is below your closed-won floor.\n\nTwo options:\n• Tighten the headcount floor as a hard filter (precision recovers to ~0.86, recall drops 4%)\n• Demote CDP signal weight from primary to secondary (precision recovers to ~0.82, recall holds)\n\nI'd recommend the first — your sales motion can't profitably pursue sub-150 accounts regardless of CDP fit. Want me to apply that and re-score?",
    },
    {
      id: 't5',
      role: 'user',
      timestamp: 'April 23, 11:32 AM',
      content: 'Loop in Priya — this is a model integrity question and I want her sign-off before I export.',
    },
    {
      id: 't6',
      role: 'ai',
      timestamp: 'April 23, 11:33 AM',
      content:
        "Done. I've added Priya Sharma as a contributor on this thread and posted a summary to her with the precision/recall trade-off, the holdout sample size, and my recommendation. She'll get it in her workspace and a Slack notification.",
    },
    {
      id: 't7',
      role: 'user',
      timestamp: 'April 24, 3:42 PM',
      asker: 'Priya',
      surface: 'slack',
      content: 'Tightened the floor and re-ran. Precision is back to 0.85 on the holdout, recall at 0.81. Approved to export — Maya, this is yours.',
    },
    {
      id: 't8',
      role: 'ai',
      timestamp: 'April 24, 3:43 PM',
      content:
        "Confirmed. Final segment: 3,640 companies. Score distribution: 312 Very Good, 820 Good, 1,440 Medium, 1,068 Low.\n\nReady to push to:\n• LinkedIn Audiences (Very Good + Good — 1,132 accounts)\n• Salesforce Campaigns (Very Good — 312 accounts, tagged for AE outreach)\n• Outreach (sequence assignment for Very Good tier)\n\nWhich destinations should I export to?",
      artifact: {
        id: 'a2',
        type: 'SEGMENT',
        name: 'Fintech Mid-Market — Q2 Refresh (v2.1, approved)',
        meta: '3,640 companies · Precision 0.85 · Recall 0.81',
        timestamp: 'April 24, 3:43 PM',
        version: 'v2.1',
      },
    },
    {
      id: 't9',
      role: 'user',
      timestamp: 'April 25, 8:42 AM',
      content: 'Export Very Good and Good tiers to LinkedIn Audiences. Push Very Good to Salesforce as a campaign — name it "Fintech Q2 Outbound — Very Good Fit". Hold Outreach for now.',
    },
    {
      id: 't10',
      role: 'ai',
      timestamp: 'April 25, 8:43 AM',
      content:
        "Drafting the export. Here's the action plan — review and confirm before I push:",
      artifact: {
        id: 'a3',
        type: 'DRAFT',
        name: 'Fintech Q2 — Export Plan',
        meta: 'LinkedIn (1,132) + Salesforce Campaign (312) · Outreach held',
        timestamp: 'April 25, 8:43 AM',
        version: 'v1',
      },
    },
  ],

  'apac-tam': [
    {
      id: 't1',
      role: 'user',
      timestamp: 'April 19, 2:10 PM',
      content:
        'Size the APAC fintech market for our expansion. Use the same firmographic template as our North America Fintech Mid-Market ICP — ~500+ employees, modern tech stack, in scope across AU, SG, JP, IN, HK.',
    },
    {
      id: 't2',
      role: 'ai',
      timestamp: 'April 19, 2:11 PM',
      content:
        "Done. Here's the sized market with your ICP applied across the 5 APAC geographies. The headline: 1,840 companies in SOM, $1.84B in addressable IT spend.\n\nA few things worth calling out before you go further:\n\n• 52% of the SOM has no detected vendor — cleaner whitespace than NA in this segment\n• Apollo.io is unusually thin here (8% vs 22% in NA), which suggests they haven't prioritized the region\n• Headcount filter is doing real work — if you loosened it, SAM grows 36%",
      live: {
        type: 'MarketSize',
        props: { variant: 'initial', highlight: 'som' },
      },
    },
    {
      id: 't3',
      role: 'user',
      timestamp: 'April 19, 2:14 PM',
      content: 'Break the SOM down by country. I want to see where the concentration is.',
    },
    {
      id: 't4',
      role: 'ai',
      timestamp: 'April 19, 2:14 PM',
      content:
        "Here's the country split. Two takeaways before you read the chart — Australia and Singapore together are 63% of SOM, and they're the only two markets with buying signal density that matches your top NA cohorts. India is interesting on volume but the average IT spend per company is lower; that's a different motion.",
      live: {
        type: 'MarketBreakdown',
        props: { initialDimension: 'country' },
      },
    },
    {
      id: 't5',
      role: 'user',
      timestamp: 'April 22, 10:02 AM',
      content: "How does our competitive landscape look in this segment? I want to know what we're walking into.",
    },
    {
      id: 't6',
      role: 'ai',
      timestamp: 'April 22, 10:03 AM',
      content:
        "Three things. ZoomInfo is dominant at 32% — same as their NA position, so no surprise there. Apollo is at 8% but growing fast (2.5x in the last year). The interesting number is the 52% with no incumbent — that's larger than any single competitor's share, and it's where the cleanest pursuit sits.\n\nToggle to the Trend tab in the chart to see Apollo's growth trajectory — if it holds, they cross 15% in about two quarters.",
      live: {
        type: 'CompetitorPenetration',
        props: { view: 'penetration' },
      },
    },
    {
      id: 't7',
      role: 'user',
      timestamp: 'April 22, 10:08 AM',
      content: "Show me the actual whitespace companies in AU and SG — I want a list I can hand to the team.",
    },
    {
      id: 't8',
      role: 'ai',
      timestamp: 'April 22, 10:08 AM',
      content:
        "Here are the top SOM accounts. I've defaulted to revenue-sorted, with whitespace types tagged. Filter to AU or SG using the dropdown, or sort by IT Spend if you want to lead with the largest budgets. Airwallex, Mercari, Razorpay, and Xendit are the four biggest no-incumbent accounts on the list — those are the cleanest pursuits.",
      live: {
        type: 'CompanyList',
        props: { initialFilter: 'All', initialCountry: 'All' },
      },
    },
    {
      id: 't9',
      role: 'user',
      timestamp: 'April 24, 4:20 PM',
      asker: 'Priya',
      surface: 'slack',
      content:
        "@Maya — quick question on the SAM definition. Are we counting companies with the modern tech stack signal, or just those that match firmographically? I want to make sure the routing rules I'm building line up.",
    },
    {
      id: 't10',
      role: 'ai',
      timestamp: 'April 24, 4:21 PM',
      content:
        "Good catch, Priya. Current SAM requires both firmographic match AND modern tech stack signal (Salesforce or HubSpot present, plus a CDP). That's what brings TAM down from 14,200 to 3,840.\n\nIf the routing rules use a looser definition (firmographic-only), you'll have ~5,200 additional accounts to route. Want me to surface those as a separate cohort?",
    },
    {
      id: 't11-cc-header',
      role: 'system',
      content: 'Maya started a Claude Code session targeting this thread · Today, 8:14 AM',
    },
    {
      id: 't11',
      role: 'user',
      timestamp: 'Today, 8:14 AM',
      surface: 'mcp',
      content:
        '$ claude --thread apac-tam "Read the latest analysis and draft a 1-page board memo. Lead with the AU/SG phasing recommendation. Tone: confident, board-ready, no hedging."',
    },
    {
      id: 't12',
      role: 'ai',
      timestamp: 'Today, 8:14 AM',
      surface: 'mcp',
      content:
        "Working on this thread. Pulling context...\n\n  ✓ get_thread('apac-tam')           → 10 turns, 5 artifacts\n  ✓ search_artifacts(...)             → APAC TAM/SAM/SOM, Country breakdown, Competitor presence, Company list\n  ✓ get_artifact('phased-launch-rec') → AU/SG phasing recommendation v1\n\nDrafting memo. Took 12 sources, synthesized to 1 page. Memo lands in your thread as a BRIEF artifact — review in your browser when ready.",
      artifact: {
        id: 'a-cc-memo',
        type: 'BRIEF',
        name: 'Q2 Board Memo — APAC Expansion',
        meta: '1 page · synthesized from 5 thread artifacts · ready for review',
        timestamp: 'Today, 8:14 AM',
        version: 'v1',
        surface: 'mcp',
      },
    },
    {
      id: 't13',
      role: 'user',
      timestamp: 'Today, 8:32 AM',
      content:
        "Reviewed the memo from Claude Code's draft. The headline number is right but the AU/SG phasing argument needs sharper financials. Make the per-rep TAM math more explicit — show the comparison to NA so the board has a clear yardstick.",
    },
    {
      id: 't14',
      role: 'ai',
      timestamp: 'Today, 8:33 AM',
      content:
        "Updated. Added a financial comparison block showing NA SOM ($7.65B / 6 reps = $1.27B per rep) vs APAC SOM ($1.84B / 2 reps = $920M per rep). Per-rep opportunity is 72% of NA — flagged that as a positive signal given it's a new market with no existing penetration. Memo updated to v2.\n\nThe memo's ready to share — preserved as a thread artifact, so it shows up the same whether you open it from your browser, share via Slack, or pull it from Claude Code later.",
      artifact: {
        id: 'a-memo-v2',
        type: 'BRIEF',
        name: 'Q2 Board Memo — APAC Expansion (v2)',
        meta: '1 page · per-rep financials added · v2',
        timestamp: 'Today, 8:33 AM',
        version: 'v2',
      },
    },
  ],

  'daily-triage': [
    {
      id: 't1',
      role: 'user',
      timestamp: 'April 25, 8:08 AM',
      content: 'What accounts should I work today?',
    },
    {
      id: 't2',
      role: 'ai',
      timestamp: 'April 25, 8:08 AM',
      content:
        "Pulled signals across your 247 accounts. Twelve need attention this week — three are renewals in the next 90 days, five are net-new prospects with active intent, and two are customer health risks. Ranked them by signal urgency × deal value × ICP fit.\n\nThe top one is Meridian Cloud — your call is in 47 minutes and there's a new stakeholder signal you'll want to read before you join.",
      live: { type: 'AccountTriageList', props: { variant: 'default' } },
    },
    {
      id: 't3',
      role: 'user',
      timestamp: 'April 25, 8:11 AM',
      content: 'Show only the renewals.',
    },
    {
      id: 't4',
      role: 'ai',
      timestamp: 'April 25, 8:11 AM',
      content:
        "Five renewals in your next 6 months. Two have stakeholder risk — Crowdcube's champion left in February, FinLine's left this month. One has expansion signal (Pulse Health, credit usage up 67%). Atlas is steady standard QBR. Meridian is your call today.\n\nIf you want to refine the cut more — by region, intent strength, or time-since-last-touch — open the filter panel.",
      live: { type: 'AccountTriageList', props: { variant: 'renewalsOnly' } },
    },
    {
      id: 't5',
      role: 'user',
      timestamp: 'April 25, 8:14 AM',
      content: "Yeah let me see the full filters — I want to find renewals that haven't been touched in a while.",
    },
    {
      id: 't6',
      role: 'ai',
      timestamp: 'April 25, 8:14 AM',
      content:
        "Opened the filter panel. Your renewals filter is preserved — add a Last touched constraint to surface the stale ones. Adjust anything and the list re-ranks instantly.",
      live: {
        type: 'AccountTriageList',
        props: { variant: 'renewalsOnly', expandedFilters: true },
      },
    },
    {
      id: 't7',
      role: 'system',
      content: 'Filter applied: Last touched = 7–30 days · Renewal window = Next 6 months',
    },
    {
      id: 't8',
      role: 'ai',
      timestamp: 'April 25, 8:15 AM',
      content:
        "Re-ranked. Three accounts haven't been touched in 14+ days but have active risk or expansion signals. Pulse Health stands out — they've shown clear expansion intent (credit usage +67%) but you haven't reached out in 22 days. That's the most actionable account on this list. FinLine and Crowdcube have stakeholder risk you should also address this week.\n\nThis cut is a useful weekly review — want me to save it as a list you can re-run?",
      live: { type: 'AccountTriageList', props: { variant: 'staleHighValue' } },
    },
    {
      id: 't9',
      role: 'user',
      timestamp: 'April 25, 8:16 AM',
      content: "Yes — pin this as 'Stale Renewal Risks'. I want to come back to it every Monday morning.",
    },
    {
      id: 't10',
      role: 'ai',
      timestamp: 'April 25, 8:16 AM',
      content:
        'Saved. The filter logic is captured, so when you re-run it the list will recompute against your current book — no stale snapshots.\n\nYou can find it in your workspace under Saved Lists, and I\'ve set a recurring nudge for Monday at 8 AM. Want me to also draft an outreach sequence for the top three (Pulse Health, FinLine, Crowdcube) so you have something queued for tomorrow?',
      artifact: {
        id: 'list-stale-renewals',
        type: 'LIST',
        name: 'Stale Renewal Risks',
        meta: '5 accounts · auto-recomputes · weekly Monday nudge',
        timestamp: 'April 25, 8:16 AM',
        version: 'v1',
      },
    },
    {
      id: 't11',
      role: 'user',
      timestamp: 'April 25, 8:17 AM',
      content: 'Yes — draft sequences for all three. Different play per account though, not a generic template.',
    },
    {
      id: 't12',
      role: 'ai',
      timestamp: 'April 25, 8:18 AM',
      content:
        "Drafted. Three sequences, three different plays — I matched the angle to each account's signal:\n\n• Pulse Health → Expansion (lead with their +67% usage growth, position our healthcare customer parallel)\n• FinLine → Champion replacement (warm intro to Kevin, send 1-page recap, offer to connect him with Aisha at Stripe)\n• Crowdcube → Save play (open with NPS drop, bring CSM in, close with explicit options including sunset)\n\nFirst email is Day 0 (today), follow-ups on Day 3 and Day 7. Open any email to review and tweak before scheduling.",
      live: { type: 'OutreachSequence', props: { sequenceId: 'top3-stale-renewals' } },
    },
  ],

  'whitespace-fintech': [
    {
      id: 't1',
      role: 'ai',
      timestamp: 'April 25, 9:42 AM',
      content:
        "Configuration so far: Fintech Mid-Market.\n\nTo kick off, tell me — what's the primary outcome you want from this thread? Are we building toward a one-time analysis, a recurring report, or an action-ready list?",
    },
    {
      id: 't2',
      role: 'user',
      timestamp: 'April 25, 9:43 AM',
      content:
        'I want to target companies which have salesforce CRM, based in US, revenue > $1B and employees > 50000',
    },
    {
      id: 't3',
      role: 'ai',
      timestamp: 'April 25, 9:43 AM',
      content:
        "I ran your filter — strict version returns only 5 companies (PayPal, Visa, Mastercard, Fiserv, Block). The 50K headcount floor cuts out most of the natural fintech mid-market.\n\nI relaxed the employee floor to **5,000** to capture the population that actually matches your ICP intent — 20 companies. I encoded your criteria as four AI-applied filter conditions you can see in the panel — they're tagged with sparkles so you can tell them apart from anything you add manually. Click any company to drill in.",
      live: {
        type: 'ProspectList',
        props: { variant: 'initial', presetKey: 'initial' },
      },
    },
    {
      id: 't4',
      role: 'user',
      timestamp: 'April 25, 9:48 AM',
      content: 'Filter to high propensity and has signals — show me the ones I should act on this week.',
    },
    {
      id: 't5',
      role: 'ai',
      timestamp: 'April 25, 9:48 AM',
      content:
        "12 companies match. The top 5 by propensity (Acme, Cyberhaven, Snowflake, HubSpot, Block) all have active competitor intent — strong displacement candidates. Acme and Cyberhaven both run ZoomInfo and 6sense — those are your sharpest plays this week.\n\nClick any row to drill into full detail.",
      live: {
        type: 'ProspectList',
        props: { variant: 'highPropensitySignals', presetKey: 'highPropensitySignals' },
      },
    },
    {
      id: 't6',
      role: 'user',
      timestamp: 'April 25, 9:51 AM',
      content:
        "Tighten this further — only prospects (not customers), running both Salesforce AND HubSpot, with active competitor intent. I want to see the cleanest displacement targets.",
    },
    {
      id: 't7',
      role: 'ai',
      timestamp: 'April 25, 9:51 AM',
      content:
        "That's a 5-condition filter — getting too dense for a one-line query, so I've opened the **filter panel** on the right and applied them all there. Each one is tagged with a sparkle so you know it came from me. From here you can:\n\n• Toggle any condition on/off — list updates instantly\n• Click X on a chip above the list to remove it\n• Add granular options I didn't include (e.g., specific renewal windows, CRM stages, install-verified dates)\n\nNo need to keep typing constraints in chat — fine-tune visually and I'll see your final state in the next turn.",
      live: {
        type: 'ProspectList',
        props: {
          variant: 'highPropensitySignals',
          presetKey: 'emeaTighten',
          openFiltersOnMount: true,
        },
      },
    },
    {
      id: 't8',
      role: 'user',
      timestamp: 'April 25, 9:55 AM',
      content: "Save the top 5 displacement candidates as 'Q2 Fintech Hot Targets'.",
    },
    {
      id: 't9',
      role: 'ai',
      timestamp: 'April 25, 9:55 AM',
      content:
        "Saved. The list captures the **filter logic** (not a snapshot of names), so when you re-run it next week the underlying companies are recomputed against fresh data. I also noticed Acme and Cyberhaven have intent spikes in the last 48 hours — want me to draft displacement plays for both?",
      artifact: {
        id: 'list-q2-fintech-hot',
        type: 'LIST',
        name: 'Q2 Fintech Hot Targets',
        meta: '5 displacement candidates · auto-recomputes · ZoomInfo & 6sense focus',
        timestamp: 'April 25, 9:55 AM',
        version: 'v1',
        rerunable: true,
      },
    },
  ],

  'build-playbook-healthcare': [
    {
      id: 't1',
      role: 'user',
      timestamp: 'April 25, 11:18 AM',
      content:
        "Build me a new sales play for Healthcare vertical displacement. Same shape as the Fintech one but adapted to healthcare buyers — they evaluate slower and care more about compliance.",
    },
    {
      id: 't2',
      role: 'ai',
      timestamp: 'April 25, 11:19 AM',
      content:
        "I'll walk you through this in five steps so we end up with something publishable, not a draft sitting in your queue. The whole thing is conversational — answer in plain language, I'll capture each step into the playbook config.\n\n**Step 1 of 5 — Triggers.** When should this play activate? For Fintech you used three: tech install (ZoomInfo OR 6sense), ICP match, and active competitor intent. For Healthcare, I'd suggest two adjustments based on the vertical:\n\n• Replace 6sense with **Definitive Healthcare** — that's the dominant competitive vendor in the healthcare buyer-intelligence segment\n• Tighten the headcount floor — healthcare buyers convert better above 1,000 employees (your closed-won data)\n• Keep the active intent topic requirement\n\nDoes that read right, or do you want different triggers?",
    },
    {
      id: 't3',
      role: 'user',
      timestamp: 'April 25, 11:21 AM',
      content: 'Yes, but also add Bombora competitor intent as a trigger — and require the account to be in CRM already (no cold prospects).',
    },
    {
      id: 't4',
      role: 'ai',
      timestamp: 'April 25, 11:21 AM',
      content:
        "Captured. Triggers locked:\n\n• Tech install: ZoomInfo OR Definitive Healthcare\n• Headcount ≥ 1,000\n• ICP match: Healthcare segment\n• Active intent: Bombora topic in last 30 days\n• In CRM: Yes (excludes cold)\n\n**Step 2 of 5 — Actions.** What does the play DO when triggered? For Fintech you have three actions: AI drafts a 3-touch outreach sequence, enriches install data, and adds the account to seller's daily triage above propensity 70.\n\nFor Healthcare, two changes I'd recommend:\n\n• Stretch the cadence — healthcare buyers need longer between touches. Day 0, Day 7, Day 21 instead of Day 0/3/7\n• Add a compliance-aware draft: lead with FedRAMP / HIPAA mentions if the account has those installed\n\nKeep the daily triage routing? Or different threshold?",
    },
    {
      id: 't5',
      role: 'user',
      timestamp: 'April 25, 11:24 AM',
      content: 'Keep daily triage but bump the threshold to propensity 80 — healthcare reps prefer fewer, higher-quality plays.',
    },
    {
      id: 't6',
      role: 'ai',
      timestamp: 'April 25, 11:24 AM',
      content:
        "Done. Actions locked:\n\n• Draft 3-touch sequence (Day 0, Day 7, Day 21) with compliance-aware framing when applicable\n• Enrich install data + Bombora intent score\n• Route to Daily Triage if propensity ≥ 80\n\n**Step 3 of 5 — Audience.** Who can run this play?\n\nLooking at your team, three healthcare-focused AEs would be natural recipients: **Sarah Lin** (ENT West, healthcare focus), **David Park** (Mid-market, healthcare), **Maria Patel** (Strategic accounts, includes top 10 healthcare).\n\nYou could also open it to all AEs and let them pull it themselves. Which do you prefer?",
    },
    {
      id: 't7',
      role: 'user',
      timestamp: 'April 25, 11:25 AM',
      content: "Just the three healthcare-focused AEs to start. We'll measure for two weeks then expand if it's working.",
    },
    {
      id: 't8',
      role: 'ai',
      timestamp: 'April 25, 11:26 AM',
      content:
        "Captured. Audience: Sarah Lin, David Park, Maria Patel (3 AEs). Set a 14-day measurement window.\n\n**Step 4 of 5 — Simulation.** Before publish, I ran the trigger conditions against your current book + active intent data. Here's what it would have surfaced:\n\n• **47 healthcare accounts** match all triggers right now\n• **18 of 47** have propensity ≥ 80 — those would route to the assigned AE's Daily Triage immediately\n• **12 of 18** are in active stages already (Discovery / Qualification) — the play would supplement existing motion\n• **6 of 18** are dormant accounts that haven't been touched in 90+ days — these are the highest-leverage outreach\n\nProjected first-week run rate: ~6 plays (assuming 2 per AE). For comparison, the Fintech play averaged 3.5 in its first week.",
      artifact: {
        id: 'a1',
        type: 'REPORT',
        name: 'Healthcare Play — Pre-Publish Simulation',
        meta: '47 accounts match · 18 high-propensity · projected 6 plays/week',
        timestamp: 'April 25, 11:26 AM',
        version: 'v1',
      },
    },
    {
      id: 't9',
      role: 'user',
      timestamp: 'April 25, 11:28 AM',
      content: "Looks good. Publish it as v1 and notify the three AEs.",
    },
    {
      id: 't10',
      role: 'ai',
      timestamp: 'April 25, 11:28 AM',
      content:
        '**Step 5 of 5 — Published.** ✓\n\nThe playbook is live. Sarah, David, and Maria each got a Slack notification + an entry in their workspace. Their next Daily Triage will surface healthcare displacement targets ranked by propensity.\n\nI\'ve set a 14-day measurement window — I\'ll surface a performance report in your workspace on May 9 with run count, reply rate, and pipeline influence. If it\'s underperforming, you can pause and tune. If it\'s strong, we can expand to more AEs.',
      artifact: {
        id: 'a2',
        type: 'DECISION',
        name: 'Healthcare Displacement Play — v1.0 published',
        meta: '3 AEs · 47 candidate accounts · 14-day measurement window',
        timestamp: 'April 25, 11:28 AM',
        version: 'v1',
      },
    },
  ],

  'champion-tracker': [
    {
      id: 't1',
      role: 'user',
      timestamp: 'April 25, 9:02 AM',
      content: 'Track my champions across the book — who\'s active, who changed jobs, who I should warm up.',
    },
    {
      id: 't2',
      role: 'ai',
      timestamp: 'April 25, 9:03 AM',
      content:
        "Pulled 12 champions across your book. The headline:\n\n• 4 changed jobs in the last 90 days — 2 of those landed at companies that fit your ICP (warm intros to net-new pipeline)\n• 1 just joined an account I sell to (Sarah Chen at DataFlow — yesterday, hottest signal)\n• 2 new champions need warming because the previous one left (Kevin at FinLine, Marcus at Meridian)\n• 1 champion at a Lost account (SilverPath, acquired) — net new signal: she's now at a different fit company\n\nThe most actionable cluster is the job-change group — they're warm contacts at new logos.",
      live: { type: 'ChampionTracker', props: { variant: 'all' } },
    },
    {
      id: 't3',
      role: 'user',
      timestamp: 'April 25, 9:05 AM',
      content: 'Show only the job changes — those are the ones I want to act on first.',
    },
    {
      id: 't4',
      role: 'ai',
      timestamp: 'April 25, 9:05 AM',
      content:
        "Four job changes. Two are unambiguous warm-intro plays at new companies (Aisha → Stripe, Lisa → NovaTech). The other two are champions at lost accounts whose new companies aren't ICP fits — lower priority but worth tracking. \n\nDavid Park (Klaviyo) is interesting — Klaviyo isn't on your book today but they're a Bombora install which means they're in your competitive displacement segment. Worth opening a prospect thread.",
      live: { type: 'ChampionTracker', props: { variant: 'jobChanges' } },
    },
    {
      id: 't5',
      role: 'user',
      timestamp: 'April 25, 9:07 AM',
      content: 'Pin this as "Champion Watch — Q2". I want a recurring monthly check.',
    },
    {
      id: 't6',
      role: 'ai',
      timestamp: 'April 25, 9:07 AM',
      content:
        'Saved. Recurring monthly check set for the 1st of each month. The list will re-run against your current book each time — new job changes, new champions, and warm-intro paths surface automatically.\n\nNext step worth considering: I can draft warm-intro emails to Aisha (Stripe) and Lisa (NovaTech) using the relationship history from your prior threads. Want me to draft those now or hold for later?',
      artifact: {
        id: 'list-champion-watch',
        type: 'LIST',
        name: 'Champion Watch — Q2',
        meta: '12 champions · auto-recomputes · monthly nudge',
        timestamp: 'April 25, 9:07 AM',
        version: 'v1',
      },
    },
  ],

  'meridian-deal': [
    {
      id: 't1',
      role: 'user',
      timestamp: 'April 25, 8:42 AM',
      content: 'Pull up everything I need to know before my 10 AM call with Meridian Cloud.',
    },
    {
      id: 't2',
      role: 'ai',
      timestamp: 'April 25, 8:43 AM',
      content:
        "Here's your pre-call brief for Meridian Cloud. A few things stand out this week:\n\nTwo stakeholders updated their LinkedIn bios — both now mention 'AI-driven GTM' as a focus. This is a new angle since your last call.\n\nSarah Kim (VP Ops) is your warmest contact — opened your last email twice. Marcus Reed (CFO) was added to the account team but hasn't been contacted yet.\n\nTheir tech stack shows Salesforce + HubSpot + Outreach — same as your top 5 closed won accounts in this vertical.",
      artifact: {
        id: 'a1',
        type: 'BRIEF',
        name: 'Meridian Cloud Pre-Call Brief',
        meta: 'April 25 · Updated 40 min ago',
        timestamp: 'April 25, 8:43 AM',
        version: 'v3',
      },
    },
    {
      id: 't3',
      role: 'user',
      timestamp: 'April 25, 8:50 AM',
      content: "What's the best angle for today given the AI-driven GTM signal?",
    },
    {
      id: 't4',
      role: 'ai',
      timestamp: 'April 25, 8:51 AM',
      content:
        "Lead with the intelligence activation angle, not the data enrichment angle you used last time. Specifically:\n\nThey're evaluating how to make their GTM motion more predictive — they said 'we're flying blind on intent' in your last call. That's your opening.\n\nRecommended discovery question: 'When you think about where your team spends the most time on manual data work, where does the AI opportunity feel most obvious?'\n\nThis positions HG's signal layer as the intelligence backbone, not just a data vendor.",
    },
    {
      id: 't5',
      role: 'user',
      timestamp: 'April 25, 9:02 AM',
      content: 'Draft a follow-up email for after the call that re-emphasizes our differentiation.',
    },
    {
      id: 't6',
      role: 'ai',
      timestamp: 'April 25, 9:03 AM',
      content:
        "Here's a draft. I've included a data proof point specific to their vertical:",
      artifact: {
        id: 'a2',
        type: 'DRAFT',
        name: 'Meridian Cloud Follow-Up',
        meta: 'April 25 · v1',
        timestamp: 'April 25, 9:03 AM',
        version: 'v1',
      },
    },
  ],
};

// =====================================================================
// CHANNEL THREAD CONVERSATIONS
// Slack DMs and Claude Code sessions stored as first-class threads. Same
// turn schema as project threads; surface badges (slack/mcp) make origin
// visible in standard ConversationTurn rendering.
// =====================================================================

CONVERSATIONS['slack-priya-sam'] = [
  {
    id: 't1',
    role: 'user',
    asker: 'Priya',
    surface: 'slack',
    timestamp: 'April 24, 4:18 PM',
    content:
      "@Maya quick — for SAM in the APAC analysis, are we counting companies with the modern tech-stack signal, or just those that match firmographically? I want to make sure the routing rules I'm building line up.",
  },
  {
    id: 't2',
    role: 'user',
    surface: 'slack',
    timestamp: 'April 24, 4:21 PM',
    content:
      "Both required — firmographic match AND modern tech-stack signal (Salesforce or HubSpot present, plus a CDP). That's what brings TAM down from 14,200 to 3,840. If you want a looser cohort for routing experiments, we can split it as a separate list.",
  },
  {
    id: 't3',
    role: 'user',
    asker: 'Priya',
    surface: 'slack',
    timestamp: 'April 24, 4:23 PM',
    content:
      "Got it — keeping SAM strict. I'll route the looser cohort separately. Thanks 🙏",
  },
];

CONVERSATIONS['mcp-apac-memo'] = [
  {
    id: 't1',
    role: 'system',
    content: 'Claude Code session started · targeting thread/apac-tam · Today, 8:14 AM',
  },
  {
    id: 't2',
    role: 'user',
    surface: 'mcp',
    timestamp: 'Today, 8:14 AM',
    content:
      '$ claude --thread apac-tam "Read the latest analysis and draft a 1-page board memo. Lead with the AU/SG phasing recommendation. Tone: confident, board-ready, no hedging."',
  },
  {
    id: 't3',
    role: 'ai',
    surface: 'mcp',
    timestamp: 'Today, 8:14 AM',
    content:
      "Working on this thread. Pulling context...\n\n  ✓ get_thread('apac-tam')           → 10 turns, 5 artifacts\n  ✓ search_artifacts(...)             → APAC TAM/SAM/SOM, Country breakdown, Competitor presence, Company list\n  ✓ get_artifact('phased-launch-rec') → AU/SG phasing recommendation v1\n\nDrafted the memo. Synthesized 5 thread artifacts to a 1-page brief. Lands as a BRIEF artifact in apac-tam — review in your browser when ready.",
    artifact: {
      id: 'a-cc-memo',
      type: 'BRIEF',
      name: 'Q2 Board Memo — APAC Expansion',
      meta: '1 page · synthesized from 5 thread artifacts',
      timestamp: 'Today, 8:14 AM',
      version: 'v1',
      surface: 'mcp',
    },
  },
];

CONVERSATIONS['slack-alex-meridian'] = [
  {
    id: 't1',
    role: 'user',
    surface: 'slack',
    timestamp: 'April 24, 6:42 PM',
    content:
      "Hey Alex — gut check on Meridian for tomorrow's call. Two stakeholders updated their bios this week to mention 'AI-driven GTM'. Thinking I lead with the intelligence-activation angle (not the data enrichment angle from last call). Sound right?",
  },
  {
    id: 't2',
    role: 'user',
    asker: 'Jordan',
    surface: 'slack',
    timestamp: 'April 24, 6:58 PM',
    content:
      "Yeah, lean into AI-driven. They said 'flying blind on intent' last call — that's your hook. Skip the data enrichment angle entirely, you'll sound transactional. Want me to join the first 10 min?",
  },
  {
    id: 't3',
    role: 'user',
    surface: 'slack',
    timestamp: 'April 24, 7:01 PM',
    content: "Yes if you can. I'll send the calendar invite. Brief is in apac-tam — wait, in their thread. Lemme grab the link.",
  },
];

CONVERSATIONS['slack-ae-team-dataflow'] = [
  {
    id: 't1',
    role: 'user',
    surface: 'slack',
    timestamp: 'Today, 9:14 AM',
    content:
      "Heads up team — Sarah Chen just joined DataFlow Inc as VP RevOps (LinkedIn signal hit my feed this morning). She was a champion at her previous account where I closed $180K. Net-new for HG, opening a thread on it.",
  },
  {
    id: 't2',
    role: 'user',
    asker: 'James',
    surface: 'slack',
    timestamp: 'Today, 11:32 AM',
    content:
      "@Jordan nice catch. DataFlow overlaps with my territory next quarter when we restructure — could you do a warm intro to Sarah once you've engaged? Especially if it stalls on your end, would love a relay.",
  },
  {
    id: 't3',
    role: 'user',
    surface: 'slack',
    timestamp: 'Today, 11:40 AM',
    content: "Sure, will keep you in the loop. Goal is to land it in Q2 either way — but if territory shifts, you take it.",
  },
];

CONVERSATIONS['slack-revops-hubspot'] = [
  {
    id: 't1',
    role: 'system',
    content: 'RGI Bot posted to #revops-alerts · April 23, 9:14 AM',
  },
  {
    id: 't2',
    role: 'ai',
    surface: 'slack',
    timestamp: 'April 23, 9:14 AM',
    content:
      "⚠️ HubSpot OAuth token expired at 09:14 UTC. Pending exports: 3 jobs blocked. Inbound Lead Qualification workflow paused. Re-auth required by an admin.",
  },
  {
    id: 't3',
    role: 'user',
    asker: 'Priya',
    surface: 'slack',
    timestamp: 'April 23, 10:08 AM',
    content: "Acknowledged. Will handle this morning.",
  },
  {
    id: 't4',
    role: 'user',
    asker: 'Priya',
    surface: 'slack',
    timestamp: 'Today, 8:42 AM',
    content:
      "Update — still pending. Got pulled into the Fintech v2.1 publish yesterday. Re-auth on today's list before standup.",
  },
];

CONVERSATIONS['mcp-bulk-models'] = [
  {
    id: 't1',
    role: 'system',
    content: 'Claude Code session started · workspace-scoped · Yesterday, 5:48 PM',
  },
  {
    id: 't2',
    role: 'user',
    surface: 'mcp',
    timestamp: 'Yesterday, 5:48 PM',
    content:
      '$ claude "Audit all 4 active scoring models. Show precision/recall trends over the last 30 days, flag any model where precision dropped >5pp. Output as a report."',
  },
  {
    id: 't3',
    role: 'ai',
    surface: 'mcp',
    timestamp: 'Yesterday, 5:48 PM',
    content:
      "Pulling model performance...\n\n  ✓ list_threads(filter: {type:'model'})  → 4 active models\n  ✓ get_artifact('precision-history')      → 30-day window per model\n\nResults:\n• Customer Fit — Fintech: precision 0.91 → 0.78 (−13pp) · ⚠️ flagged\n• Customer Fit — Enterprise: 0.88 → 0.86 (−2pp) · stable\n• Inbound Lead Score: 0.84 → 0.85 (+1pp) · stable\n• Engagement LTB: 0.79 → 0.79 · stable\n\nFintech is the only model with a meaningful drop. Created a REPORT artifact in fintech-model-q2 thread with the breakdown.",
    artifact: {
      id: 'a-mcp-report',
      type: 'REPORT',
      name: 'Q2 Model Audit — Fintech Drift Flagged',
      meta: '4 models audited · 1 drift detected',
      timestamp: 'Yesterday, 5:48 PM',
      version: 'v1',
      surface: 'mcp',
    },
  },
];

// Rerun "diff" turns — when a saved LIST is re-run from the library, we
// append these synthetic turns to the source thread to demonstrate that
// saved assets are recomputable, not snapshots.

export const RERUN_TURNS = {
  'list-stale-renewals': [
    {
      id: 'rerun-u',
      role: 'user',
      timestamp: 'Today, 1:42 PM',
      content: 'Re-run "Stale Renewal Risks" against current data.',
    },
    {
      id: 'rerun-ai',
      role: 'ai',
      timestamp: 'Today, 1:42 PM',
      content:
        "Re-running the saved filter logic against your current book — last computed April 25 at 8:16 AM.\n\nChanges since you saved this list (5 days ago):\n\n• Pulse Health · still on the list, expansion play landed — Tom Reilly replied to your Day 0 email\n• FinLine · still on the list, Kevin O'Brien introduced himself yesterday (warm signal moved up)\n• Crowdcube · still on the list, NPS recovered from 4 → 6 (improving but not safe)\n• Coastal Banking · DROPPED from list — moved out of ICP (deprioritized)\n• Atlas Networks · ADDED to list — renewal window moved up to 90 days\n\nThe list is recomputed, not a snapshot — your filter logic ran fresh against today's data. Re-pin if you want to lock the new state.",
      live: { type: 'AccountTriageList', props: { variant: 'staleHighValue' } },
    },
  ],
  'list-champion-watch': [
    {
      id: 'rerun-u',
      role: 'user',
      timestamp: 'Today, 2:10 PM',
      content: 'Re-run "Champion Watch — Q2" against current data.',
    },
    {
      id: 'rerun-ai',
      role: 'ai',
      timestamp: 'Today, 2:10 PM',
      content:
        'Re-running against your current book — last computed April 25 at 9:07 AM.\n\nChanges since you saved this list:\n\n• Sarah Chen · contacted yesterday (status moved Active)\n• Aisha Patel · still warm at Stripe — no action taken yet\n• Lisa Wong · NEW: she just posted a senior data role at NovaTech (hiring signal added)\n• David Park · NEW: Klaviyo announced Series E funding this week — opens budget conversation\n• Marcus Reed · still no contact at Meridian — flag this before today\'s call\n\nFour items still need action. Want me to draft the outreach for them?',
      live: { type: 'ChampionTracker', props: { variant: 'all' } },
    },
  ],
};

// Rotating AI response templates for live conversation input
export const AI_RESPONSE_TEMPLATES = [
  "Pulled the data. Here's what I see:\n\nThree accounts moved from Medium to Good fit this week, all driven by hiring signals — they posted senior data roles in the last 14 days, which historically correlates with platform adoption.\n\nWant me to add them to your active prospecting thread, or hold them for the next batch review?",
  "Refreshed the segment. Seven additions, two removals, one re-tier:\n\n• Added: Vertex Systems, NovaTech, DataBridge, Pulse Health, Atlas Networks, Crowdcube, FinLine\n• Removed: SilverPath (acquired by Rapid7 last week), Coastal Banking (downgraded to Low Fit)\n• Re-tiered: GlobalTech moved from Good → Very Good (intent signal triggered)\n\nNet movement is positive — segment health is up 4%.",
  "Done. The artifact is ready in your thread. A note on confidence: the underlying data has 86% coverage on technographic signals for this cohort. The remaining 14% I had to infer from job postings and earnings call mentions — flagged in the export.\n\nNothing surprising in the output, which is the boring kind of good.",
  "Two interesting signals just landed:\n\n1. CloudTech announced a price increase effective May 1 — 14% on enterprise tier. This is your strongest displacement window in 18 months. I'd queue an outreach campaign to the 47 CloudTech accounts in your book this week.\n\n2. The APAC segment now has 1,840 scored accounts. None have been actioned yet. This is the largest unactioned cohort in your workspace.\n\nWhich one do you want to act on first?",
  "Generated the analysis. Here's the headline:\n\nYour current ICP captures 78% of historical closed-won, but only 12% of the addressable market. That's a precision-heavy profile — accurate but narrow.\n\nIf you widen the headcount band by 30% on either side, recall goes to 91% and addressable market doubles to 24% capture. Precision drops to 0.71 (still acceptable for outbound).\n\nThe trade-off is whether your downstream sales motion can absorb the lower precision. Worth a conversation with Priya before publishing.",
];
