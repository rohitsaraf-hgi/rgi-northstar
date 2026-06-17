export const OUTREACH_SEQUENCES = {
  'top3-stale-renewals': {
    title: 'Outreach Sequence — Top 3 Stale Renewal Risks',
    accounts: [
      {
        id: 'pulse-health',
        name: 'Pulse Health',
        playType: 'Expansion',
        playColor: 'text-emerald-700 dark:text-emerald-300',
        playBg: 'bg-emerald-500/10 border-emerald-500/20',
        contextOneLiner:
          "Credit usage +67% in March, no outreach in 22 days. Champion (Tom Reilly, CTO) is the expansion lever.",
        emails: [
          {
            day: 'Day 0',
            subject: 'Quick note on your team\'s growth',
            sendAt: 'Today, 11:00 AM PT',
            body: `Hi Tom,

Saw your team's credit usage is up 67% MoM — that's a strong adoption signal. It usually means one of two things: the GTM team is starting to lean on the data layer harder, or you're hitting capacity.

Either way, it's worth a 15-min sync. I'd love to share two patterns we've seen with fast-growing healthcare customers (one quietly added a second product line, the other restructured their seat allocation and unlocked another 30% of value without buying more credits).

Have time on Thursday or Friday morning?

— Jordan`,
            signalHook: 'Usage +67% MoM',
          },
          {
            day: 'Day 3',
            subject: 'How TruHealth handled the same usage curve',
            sendAt: 'Apr 28, 10:00 AM PT',
            body: `Tom — quick follow-up.

Was thinking about your usage trend and remembered TruHealth (similar size, similar growth pattern in Q3 last year). They were two months ahead of where you are now and ended up adding our Sales Copilot module — saved their AEs ~6 hours a week and shortened deal cycles by 11 days.

I'm not pitching the module today — happy to just walk you through their before/after numbers in 15 minutes if useful.

— Jordan`,
            signalHook: 'Customer parallel',
          },
          {
            day: 'Day 7',
            subject: 'Closing the loop — happy to go async',
            sendAt: 'May 2, 9:00 AM PT',
            body: `Tom, last note from me on this thread — I know inboxes are loud.

If a live sync isn't the right shape, I'm happy to send a 3-slide async write-up on the expansion patterns I mentioned. Just reply with "send it" and I'll have it in your inbox tomorrow.

If now isn't the moment, no problem — I'll check back in mid-Q2.

— Jordan`,
            signalHook: 'Soft close',
          },
        ],
      },
      {
        id: 'finline',
        name: 'FinLine',
        playType: 'Champion replacement',
        playColor: 'text-amber-700 dark:text-amber-300',
        playBg: 'bg-amber-500/10 border-amber-500/20',
        contextOneLiner:
          "Aisha Patel (longtime champion) left for Stripe last week. Kevin O'Brien is the new VP Marketing — needs warming.",
        emails: [
          {
            day: 'Day 0',
            subject: 'Catching up after Aisha\'s transition',
            sendAt: 'Today, 11:30 AM PT',
            body: `Hi Kevin,

Wanted to introduce myself — I'm Jordan, your account contact at HG Insights. Aisha and I worked closely over the past two years and she'll be missed.

I'd love to find 20 minutes to walk you through how the team's been using the platform and where we've delivered value historically. No agenda beyond that — just want to make sure we're set up to be useful in your transition.

Are you open to a brief intro call this week or next?

— Jordan`,
            signalHook: 'Champion change',
          },
          {
            day: 'Day 3',
            subject: '1-page recap of HG → FinLine value to date',
            sendAt: 'Apr 28, 10:30 AM PT',
            body: `Kevin — figured I'd send a TL;DR while you're getting up to speed.

Attached: a 1-page summary of how FinLine has used HG Insights since Q3 2024. The headline: 47 net-new accounts identified, 11 closed-won attributed to platform signals, $1.4M of pipeline traceable to outbound plays your team ran from our scoring.

Happy to walk through it live or you can keep it for later. Either works.

— Jordan`,
            signalHook: 'Value summary',
          },
          {
            day: 'Day 7',
            subject: 'One more — intro to your peer at Stripe',
            sendAt: 'May 2, 9:30 AM PT',
            body: `Kevin — last note for now.

Side note: Aisha just landed at Stripe and she's running their growth team. If you ever want a warm intro for benchmarking on platform strategy, I can connect you. She speaks fluently to our value, so it's a useful sanity check from someone who's been in your seat.

— Jordan`,
            signalHook: 'Network value',
          },
        ],
      },
      {
        id: 'crowdcube',
        name: 'Crowdcube',
        playType: 'Save play',
        playColor: 'text-rose-700 dark:text-rose-300',
        playBg: 'bg-rose-500/10 border-rose-500/20',
        contextOneLiner:
          "NPS dropped 8 → 4. Usage down 38%. Champion left in February. Renewal in 90 days.",
        emails: [
          {
            day: 'Day 0',
            subject: 'Listening — quick check-in',
            sendAt: 'Today, 12:00 PM PT',
            body: `Hi team,

I noticed your NPS shifted recently and usage is down compared to Q1. Want to be upfront: I'd rather hear what's not working than send you a sales note.

Could we book 20 minutes this week? Bring whoever's closest to the platform day-to-day. The goal is for me to listen, not pitch.

— Jordan`,
            signalHook: 'NPS drop, low usage',
          },
          {
            day: 'Day 3',
            subject: 'A different lens — bringing in our CSM',
            sendAt: 'Apr 28, 11:00 AM PT',
            body: `Hi again,

If a sales-led conversation isn't the right shape, I'd like to bring our CSM (Priya) into the call too. She manages our top healthcare customers and has seen the playbook for re-anchoring value when usage drops.

We can do this in 30 minutes total: 10 min listening, 10 min Priya walking through what's worked elsewhere, 10 min open Q&A.

Are mornings or afternoons better for you?

— Jordan`,
            signalHook: 'Bring CSM',
          },
          {
            day: 'Day 7',
            subject: 'Honest check — should we keep going?',
            sendAt: 'May 2, 10:00 AM PT',
            body: `Last note from me on this thread.

If the platform isn't pulling its weight for you right now, I'd rather know than not. We can either:
1. Re-scope what we're solving and reset
2. Pause until your team is ready to re-engage
3. Sunset the relationship — no friction

A reply with the number that fits is enough. No follow-up if I don't hear back.

— Jordan`,
            signalHook: 'Direct close',
          },
        ],
      },
    ],
  },
};
