// IcpPill — sticky summary of the tenant's Ideal Customer Profile.
// Shown at the top of the admin workbook so admins know the universe is
// pre-filtered. Pencil icon deep-links to Admin Hub → Tenant Profile,
// where the ICP can actually be edited.

import { Target, Edit3 } from 'lucide-react';

function summarize(icp) {
  if (!icp) return [];
  const parts = [];
  if (Array.isArray(icp.industries) && icp.industries.length > 0) {
    parts.push(`${icp.industries.length} industries`);
  }
  if (icp.employeeBand?.low && icp.employeeBand?.high) {
    parts.push(`${icp.employeeBand.low}–${icp.employeeBand.high} employees`);
  } else if (icp.employeeBand?.low) {
    parts.push(`${icp.employeeBand.low}+ employees`);
  }
  if (icp.revenueBand?.low && icp.revenueBand?.high) {
    parts.push(`${icp.revenueBand.low}–${icp.revenueBand.high} revenue`);
  }
  if (Array.isArray(icp.geos) && icp.geos.length > 0) {
    parts.push(`${icp.geos.length} ${icp.geos.length === 1 ? 'geo' : 'geos'}`);
  }
  return parts;
}

export default function IcpPill({ icp, onEdit }) {
  const parts = summarize(icp);
  const empty = parts.length === 0;
  return (
    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/5 border border-primary/30 text-[11px]">
      <Target size={11} className="text-primary flex-shrink-0" />
      <span className="text-text-secondary">
        <span className="font-semibold text-primary">ICP-filtered</span>
        {empty ? (
          <span className="text-text-muted italic ml-1">· no ICP set</span>
        ) : (
          <span className="text-text-muted ml-1">· {parts.join(' · ')}</span>
        )}
      </span>
      {onEdit && (
        <button
          onClick={onEdit}
          className="ml-1 inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary-dim font-semibold"
          title="Edit ICP in Admin Hub"
        >
          <Edit3 size={10} />
          {empty ? 'Set ICP' : 'Edit'}
        </button>
      )}
    </div>
  );
}
