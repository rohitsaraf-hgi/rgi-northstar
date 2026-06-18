// SourceIcons — renders a 3-icon stack showing which systems an account
// is present in: HG, Salesforce, HubSpot. Active brand color when present,
// faded grayscale when absent.

const HG_BLUE = '#0070FF';
const SF_BLUE = '#00A1E0';
const HS_ORANGE = '#FF7A59';

// Small inline SVGs keep us off external asset deps and let us tint by CSS.

function HgGlyph({ active }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke={active ? HG_BLUE : '#A1A1AA'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: active ? 1 : 0.3 }}
      aria-label="HG"
    >
      <path d="M6 4 C 6 12, 6 20, 6 20 M18 4 C 18 12, 18 20, 18 20 M6 12 L 18 12" />
    </svg>
  );
}

function SalesforceGlyph({ active }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill={active ? SF_BLUE : '#D4D4D8'}
      style={{ opacity: active ? 1 : 0.4 }}
      aria-label="Salesforce"
    >
      <path d="M14.5 3c-1.7 0-3.2.9-4.1 2.2C9.5 4.6 8.4 4.2 7.3 4.2c-2.4 0-4.3 1.9-4.3 4.3 0 .3 0 .6.1.9C1.7 9.9.7 11.3.7 12.9c0 2.3 1.8 4.1 4.1 4.1.3 0 .6 0 .9-.1.7 1.3 2.1 2.2 3.7 2.2 1.5 0 2.8-.7 3.6-1.9.6.2 1.3.3 2 .3 3.1 0 5.7-2.4 5.7-5.4 0-.5-.1-1-.2-1.5 1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4-.7 0-1.4.2-2 .5-.8-1.5-2.4-2.6-4-2.6z"/>
    </svg>
  );
}

function HubSpotGlyph({ active }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill={active ? HS_ORANGE : '#D4D4D8'}
      style={{ opacity: active ? 1 : 0.4 }}
      aria-label="HubSpot"
    >
      <path d="M18.6 8.6V5.9a2 2 0 1 0-2 0v2.7a6.5 6.5 0 0 0-3 1.2L6 6.4a2.5 2.5 0 1 0-1.2 1.5l7.2 3.3a6.5 6.5 0 0 0 6 9.7 6.5 6.5 0 0 0 .6-13zm-1 10.1a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/>
    </svg>
  );
}

export default function SourceIcons({ presentIn }) {
  const p = presentIn || {};
  return (
    <div
      className="inline-flex items-center gap-1"
      title={[
        p.hg && 'HG',
        p.salesforce && 'Salesforce',
        p.hubspot && 'HubSpot',
      ]
        .filter(Boolean)
        .join(' · ') || 'No source matched'}
    >
      <HgGlyph active={!!p.hg} />
      <SalesforceGlyph active={!!p.salesforce} />
      <HubSpotGlyph active={!!p.hubspot} />
    </div>
  );
}
