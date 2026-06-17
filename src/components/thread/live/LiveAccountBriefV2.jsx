import { useState } from 'react';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Users as UsersIcon,
  Crown,
  Activity,
  AlertTriangle,
  FileDown,
  Plug,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Target,
  Lightbulb,
} from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';
import EvidenceBadge from '../../shared/EvidenceBadge.jsx';
import {
  getAccountBriefData,
  SELLER_CONTEXT,
  MEDDIC_STATUS_CYCLE,
} from '../../../data/accountBriefData.js';
import { useDemo } from '../../../context/DemoContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { useTenant } from '../../../context/TenantContext.jsx';
import { searchResourcesForAgent } from '../../../data/researchResources.js';

function DirIcon({ direction }) {
  if (direction === 'up') return <TrendingUp size={11} className="text-emerald-700 dark:text-emerald-300" />;
  if (direction === 'down') return <TrendingDown size={11} className="text-rose-700 dark:text-rose-300" />;
  return <Minus size={11} className="text-text-muted" />;
}

function Section({ icon: Icon, title, subtitle, children, defaultOpen = true, accent = 'text-text-muted', accentBg = 'bg-text-muted/15' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border first:border-t-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-bg/40 transition-colors text-left"
      >
        <div className={`w-6 h-6 rounded ${accentBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={12} className={accent} />
        </div>
        <span className="flex-1 text-sm font-semibold text-text-primary">{title}</span>
        {subtitle && <span className="text-[11px] text-text-muted">{subtitle}</span>}
        {open ? <ChevronDown size={13} className="text-text-muted" /> : <ChevronRight size={13} className="text-text-muted" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function FAIPill({ label, value }) {
  return (
    <div className="px-2 py-1 bg-bg/40 border border-border rounded">
      <div className="text-[9px] uppercase tracking-wider text-text-muted font-semibold">{label}</div>
      <div className="text-xs font-semibold text-text-primary">{value}</div>
    </div>
  );
}

function downloadBrief(target, brief) {
  // Generate a minimal HTML page and download. v1 placeholder for PDF export.
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Account Brief — ${target}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: auto; color: #1c1c1c; }
  h1 { font-size: 22px; margin: 0 0 8px; }
  h2 { font-size: 14px; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #ddd; text-transform: uppercase; letter-spacing: 0.05em; color: #555; }
  .meta { color: #888; font-size: 12px; margin-bottom: 16px; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-right: 4px; }
  .confirmed { background: #d1fae5; color: #065f46; }
  .inferred { background: #dbeafe; color: #1e40af; }
  .partial { background: #fef3c7; color: #92400e; }
  .unknown { background: #f3f4f6; color: #6b7280; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td, th { padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; font-size: 13px; text-align: left; }
  th { font-size: 11px; color: #888; text-transform: uppercase; }
  ul { margin: 4px 0; padding-left: 20px; font-size: 13px; }
  li { margin: 4px 0; }
</style></head><body>
<h1>Account Brief — ${target}</h1>
<div class="meta">Generated ${new Date().toLocaleString()} · Lens: ${SELLER_CONTEXT.name} (${SELLER_CONTEXT.products.join(', ')})</div>

<h2>Pain Match</h2>
<p>${brief.painMatch.headline}</p>
<ul>${brief.painMatch.bullets.map((b) => `<li>${b.evidence} <em>(${b.source})</em></li>`).join('')}</ul>

<h2>Business Signals</h2>
<table>
<tr><th>Dimension</th><th>Value</th><th>Trend</th><th>Note</th></tr>
${brief.businessSignals.map((s) => `<tr><td>${s.dim}</td><td>${s.value}</td><td>${s.change}</td><td>${s.note}</td></tr>`).join('')}
</table>

<h2>MEDDIC</h2>
<table>
<tr><th>Dimension</th><th>Status</th><th>Evidence</th><th>Source</th></tr>
${brief.meddic.map((d) => `<tr><td><strong>${d.letter}</strong> ${d.dim}</td><td><span class="pill ${d.status.toLowerCase()}">${d.status}</span></td><td>${d.evidence}</td><td>${d.source}</td></tr>`).join('')}
</table>

<h2>Recommended Next Action</h2>
<p><strong>${brief.recommendedAction.headline}</strong></p>
<ul>${brief.recommendedAction.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Account Brief — ${target}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function LiveAccountBriefV2({ target = 'Acme Corp', onPin }) {
  const { config: demoConfig } = useDemo();
  const { showToast } = useToast();
  const { tenant } = useTenant();
  const hasCRM = demoConfig.integrationsConnected.includes('salesforce');
  const baseBrief = getAccountBriefData(target, { hasCRM });
  const cited = searchResourcesForAgent({
    tenantId: tenant.id,
    contextTags: baseBrief.painMatch.bullets.flatMap((b) => b.evidence.split(' ').slice(0, 3)),
    limit: 3,
  });

  // Local MEDDIC overrides so users can manually advance status
  const [meddicOverrides, setMeddicOverrides] = useState({});

  const meddic = baseBrief.meddic.map((d) => {
    const overrideStatus = meddicOverrides[d.dim];
    return overrideStatus ? { ...d, status: overrideStatus, manuallySet: true } : d;
  });

  const advanceStatus = (dim) => {
    const current = meddic.find((d) => d.dim === dim)?.status || 'Unknown';
    const idx = MEDDIC_STATUS_CYCLE.indexOf(current);
    const next = MEDDIC_STATUS_CYCLE[(idx + 1) % MEDDIC_STATUS_CYCLE.length];
    setMeddicOverrides((prev) => ({ ...prev, [dim]: next }));
    showToast(`${dim} → ${next}`, 'success');
  };

  const counts = meddic.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    },
    {}
  );
  const totalDims = meddic.length;
  const confirmedCount = counts.Confirmed || 0;
  const completenessPct = Math.round(((counts.Confirmed || 0) + (counts.Inferred || 0) * 0.6 + (counts.Partial || 0) * 0.3) * 100 / totalDims);

  return (
    <LiveFrame
      title={`Account Brief — ${baseBrief.account.name}`}
      subtitle={`Lens: ${SELLER_CONTEXT.name} · ${SELLER_CONTEXT.products.join(' · ')}`}
      onPin={onPin}
    >
      {/* Header band: FAI + completeness + actions */}
      <div className="grid grid-cols-[1fr_auto] gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5">
          <FAIPill label="Revenue" value={baseBrief.account.fai.revenue} />
          <FAIPill label="Growth" value={baseBrief.account.fai.revenueGrowth} />
          <FAIPill label="Headcount" value={baseBrief.account.fai.headcount} />
          <FAIPill label="HQ" value={baseBrief.account.hq} />
          <FAIPill label="ICP Fit" value={`${baseBrief.account.fai.hgIcpFit}/100`} />
          <FAIPill label="Stage" value={baseBrief.account.fai.stage} />
        </div>
        <div className="flex items-start gap-2">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Completeness</div>
            <div className="text-lg font-semibold text-text-primary leading-tight">{completenessPct}%</div>
            <div className="text-[10px] text-text-muted">
              {confirmedCount}/{totalDims} MEDDIC confirmed
            </div>
          </div>
          <button
            onClick={() => {
              downloadBrief(baseBrief.account.name, { ...baseBrief, meddic });
              showToast('Brief exported as HTML', 'success');
            }}
            className="ml-2 flex items-center gap-1 px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border rounded hover:border-border-2 transition-colors"
            title="Download brief as HTML (PDF coming soon)"
          >
            <FileDown size={11} />
            Export
          </button>
        </div>
      </div>

      {!hasCRM && (
        <LiveCoachNote
          tone="caution"
          headline="Salesforce not connected — Account 360 is inferred from public signals only."
          body={`${(totalDims - confirmedCount)} of ${totalDims} MEDDIC dimensions need first-party data. Connect Salesforce in Admin Hub to unlock champion engagement, multi-thread tracking, and decision-process state.`}
          className="mb-3"
        />
      )}

      <div className="bg-bg/30 border border-border rounded-md overflow-hidden">
        {/* 1. Pain Match */}
        <Section icon={Target} title="Pain Match" subtitle="Why this account fits your product" accent="text-emerald-700 dark:text-emerald-300" accentBg="bg-emerald-500/15">
          <div className="text-sm text-text-primary leading-relaxed mb-3 whitespace-pre-line">{baseBrief.painMatch.headline}</div>
          <div className="space-y-1">
            {baseBrief.painMatch.bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-emerald-700 dark:text-emerald-300 font-mono pt-0.5">✓</span>
                <span className="text-text-secondary flex-1 leading-relaxed">{b.evidence}</span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold pt-0.5">{b.source}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* 2. Business Signals */}
        <Section icon={TrendingUp} title="Business Signals" subtitle={`${baseBrief.businessSignals.length} dimensions`} accent="text-blue-700 dark:text-blue-300" accentBg="bg-blue-500/15">
          <div className="space-y-2">
            {baseBrief.businessSignals.map((s, i) => (
              <div key={i} className="grid grid-cols-[110px_1fr_auto] gap-3 items-start text-xs py-1.5 border-b border-border/60 last:border-0">
                <div className="text-text-muted font-semibold text-[11px]">{s.dim}</div>
                <div>
                  <div className="text-text-primary font-medium">{s.value} <span className="text-text-muted font-normal">· {s.change}</span></div>
                  <div className="text-[11px] text-text-secondary leading-snug mt-0.5">{s.note}</div>
                  {s.productLensNote && (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-snug mt-1 inline-flex items-start gap-1">
                      <Sparkles size={9} className="mt-0.5 flex-shrink-0" />
                      <span>{s.productLensNote}</span>
                    </div>
                  )}
                </div>
                <DirIcon direction={s.direction} />
              </div>
            ))}
          </div>
        </Section>

        {/* 3. Account 360 */}
        <Section icon={UsersIcon} title="Account 360" subtitle={hasCRM ? 'CRM + first-party data' : 'CRM not connected'} accent="text-purple-700 dark:text-purple-300" accentBg="bg-purple-500/15">
          {hasCRM && baseBrief.account360Connected ? (
            <div className="space-y-3">
              {/* Champion */}
              <div className="flex items-start gap-2 p-2.5 bg-emerald-500/[0.06] border border-emerald-500/30 rounded">
                <Crown size={13} className="text-emerald-700 dark:text-emerald-300 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-text-primary">
                    {baseBrief.account360Connected.champion.name} <span className="text-text-muted font-normal">· {baseBrief.account360Connected.champion.title}</span>
                  </div>
                  <div className="text-[11px] text-text-muted">{baseBrief.account360Connected.champion.tenure}</div>
                  <div className="text-[11px] text-text-secondary leading-relaxed mt-1">{baseBrief.account360Connected.champion.note}</div>
                </div>
                <EvidenceBadge status={baseBrief.account360Connected.champion.strength} size="xs" />
              </div>

              {/* Multi-thread map */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
                  Multi-threaded · {baseBrief.account360Connected.multiThreaded.count} stakeholders
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {baseBrief.account360Connected.multiThreaded.stakeholders.map((s, i) => (
                    <div key={i} className="px-2 py-1 bg-bg/40 border border-border rounded text-[11px]">
                      <span className="font-medium text-text-primary">{s.name}</span>
                      <span className="text-text-muted"> · {s.role}</span>
                      <div className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold uppercase tracking-wider mt-0.5">{s.engagement}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent activity */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">Recent activity</div>
                <div className="space-y-0.5">
                  {baseBrief.account360Connected.recentActivity.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] py-0.5">
                      <span className="text-text-muted w-12 font-mono text-[10px]">{a.date}</span>
                      <span className="flex-1 text-text-secondary">{a.event}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-semibold ${a.sentiment === 'Positive' ? 'text-emerald-700 dark:text-emerald-300' : 'text-text-muted'}`}>{a.sentiment}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Open concerns */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">Open concerns</div>
                <div className="space-y-1">
                  {baseBrief.account360Connected.openConcerns.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <AlertTriangle size={10} className="text-amber-700 dark:text-amber-300 mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary leading-relaxed"><span className="font-semibold text-text-primary">{c.kind}:</span> {c.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* First-party */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">First-party signals</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="px-2 py-1 bg-bg/40 border border-border rounded text-[11px]">
                    <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Amplitude</div>
                    <div className="text-text-secondary leading-snug mt-0.5">{baseBrief.account360Connected.firstParty.amplitude}</div>
                  </div>
                  <div className="px-2 py-1 bg-bg/40 border border-border rounded text-[11px]">
                    <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Marketo</div>
                    <div className="text-text-secondary leading-snug mt-0.5">{baseBrief.account360Connected.firstParty.marketo}</div>
                  </div>
                  <div className="px-2 py-1 bg-bg/40 border border-border rounded text-[11px]">
                    <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Segment</div>
                    <div className="text-text-secondary leading-snug mt-0.5">{baseBrief.account360Connected.firstParty.segment}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-amber-500/[0.06] border border-amber-500/30 rounded">
                <Plug size={13} className="text-amber-700 dark:text-amber-300 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-text-primary">Connect Salesforce to populate this section</div>
                  <div className="text-[11px] text-text-secondary leading-relaxed mt-0.5">
                    Currently inferred from public signals only. CRM unlocks champion engagement, multi-thread tracking, recent activity, and open-concern history.
                  </div>
                </div>
                <button
                  onClick={() => showToast('Open Admin Hub → Connected Apps to authorize Salesforce', 'info')}
                  className="px-2 py-1 text-[11px] text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 rounded transition-colors font-medium"
                >
                  Connect →
                </button>
              </div>

              {/* Inferred candidates */}
              {baseBrief.account360Inferred && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
                    Likely champions (inferred from LinkedIn)
                  </div>
                  <div className="space-y-1">
                    {baseBrief.account360Inferred.likelyChampions.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-bg/40 border border-border rounded text-[11px]">
                        <Lightbulb size={11} className="text-blue-700 dark:text-blue-300 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium text-text-primary">{c.name}</span>
                          <span className="text-text-muted"> · {c.title}</span>
                          <div className="text-[10px] text-text-muted leading-relaxed mt-0.5">{c.source}</div>
                        </div>
                        <EvidenceBadge status="Inferred" size="xs" showLabel={false} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* 4. MEDDIC */}
        <Section icon={Activity} title="MEDDIC" subtitle={`${confirmedCount}/${totalDims} confirmed`} accent="text-rose-700 dark:text-rose-300" accentBg="bg-rose-500/15">
          <div className="text-[11px] text-text-muted mb-2">
            Click any status badge to manually update — Unknown → Inferred → Partial → Confirmed.
          </div>
          <div className="border border-border rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-bg/40 text-text-muted">
                <tr>
                  <th className="text-left px-2 py-1.5 font-semibold w-20">Dim</th>
                  <th className="text-left px-2 py-1.5 font-semibold w-24">Status</th>
                  <th className="text-left px-2 py-1.5 font-semibold">Evidence</th>
                  <th className="text-left px-2 py-1.5 font-semibold w-32">Source</th>
                </tr>
              </thead>
              <tbody>
                {meddic.map((d) => (
                  <tr key={d.dim} className="border-t border-border hover:bg-bg/40">
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-bold text-text-primary">{d.letter}</span>
                        <span className="text-[11px] text-text-secondary">{d.dim}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <EvidenceBadge status={d.status} onClick={() => advanceStatus(d.dim)} />
                      {d.manuallySet && (
                        <div className="text-[9px] text-text-muted mt-0.5 italic">manually set</div>
                      )}
                    </td>
                    <td className="px-2 py-2 text-text-secondary leading-relaxed">{d.evidence}</td>
                    <td className="px-2 py-2 text-[11px] text-text-muted">{d.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 5. Recommended next action */}
        <Section icon={Sparkles} title="Recommended Next Action" subtitle="Computed from gaps + signals" accent="text-amber-700 dark:text-amber-300" accentBg="bg-amber-500/15">
          <div className="text-sm font-semibold text-text-primary leading-relaxed mb-3">
            {baseBrief.recommendedAction.headline}
          </div>
          <ul className="space-y-1.5">
            {baseBrief.recommendedAction.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
                <span className="text-amber-700 dark:text-amber-300 mt-0.5">→</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Cited resources from the tenant's library */}
      {cited.length > 0 && (
        <div className="mt-4 px-3 py-2.5 bg-sky-500/[0.05] border border-sky-500/30 rounded">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={11} className="text-sky-700 dark:text-sky-300" />
            <span className="text-[10px] uppercase tracking-wider text-sky-700 dark:text-sky-300 font-bold">Resources cited</span>
            <span className="text-[10px] text-text-muted">via kb_resource_search</span>
          </div>
          <div className="space-y-1">
            {cited.map((r) => (
              <div key={r.id} className="flex items-start gap-2 text-[11px]">
                <span className="text-sky-700 dark:text-sky-300 font-mono pt-0.5">→</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-text-primary">{r.title}</span>
                  <span className="text-text-muted"> — {r.summary}</span>
                </div>
                <span className="text-[10px] text-text-muted whitespace-nowrap">added by {r.owner}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </LiveFrame>
  );
}
