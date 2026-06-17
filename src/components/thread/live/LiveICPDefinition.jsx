import { Edit3, Sparkles, Check } from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';

// Result turn — summarizes the ICP the AI derived (or the user defined). Each
// field is a chip; the "Edit" affordance scrolls back to the form turn that
// produced this card so the user can tweak inputs without losing context.
const FIELD_LABELS = {
  industries: 'Industries',
  geographies: 'Geography',
  revenue: 'Revenue band',
  employees: 'Employee band',
  technologies: 'Tech installs',
};

function FieldRow({ field, values, onEdit }) {
  return (
    <div className="grid grid-cols-[110px_1fr_auto] gap-3 items-start py-2 border-b border-border last:border-0">
      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold pt-0.5">
        {FIELD_LABELS[field] || field}
      </div>
      <div className="flex flex-wrap gap-1">
        {values.length === 0 ? (
          <span className="text-[11px] text-text-muted italic">Not set</span>
        ) : (
          values.map((v, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded text-[11px] font-medium"
            >
              {v}
            </span>
          ))
        )}
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-[10px] text-text-muted hover:text-primary transition-colors inline-flex items-center gap-1 pt-0.5"
        >
          <Edit3 size={9} />
          Edit
        </button>
      )}
    </div>
  );
}

export default function LiveICPDefinition({ icp, onEditField, onPin, derived = false, sourceCount }) {
  const fields = ['industries', 'geographies', 'revenue', 'employees'];
  if (icp.technologies?.length) fields.push('technologies');

  return (
    <LiveFrame
      title="Ideal Customer Profile"
      badge={derived ? `derived from ${sourceCount || 47} customers` : null}
      onPin={onPin}
      footer={
        derived ? (
          <span className="inline-flex items-center gap-1">
            <Sparkles size={10} className="text-primary" />
            Derived automatically — adjust any field below to refine SAM and SOM
          </span>
        ) : (
          'Manually defined'
        )
      }
    >
      <div className="bg-bg/40 border border-border rounded">
        {fields.map((f) => (
          <div key={f} className="px-3">
            <FieldRow
              field={f}
              values={icp[f] || []}
              onEdit={onEditField ? () => onEditField(f) : undefined}
            />
          </div>
        ))}
      </div>

      {derived && (
        <div className="mt-3 px-2 py-1.5 bg-success/[0.06] border border-success/20 rounded text-[11px] text-success inline-flex items-center gap-1.5">
          <Check size={11} />
          ICP locked · SAM and SOM recomputed below
        </div>
      )}
    </LiveFrame>
  );
}
