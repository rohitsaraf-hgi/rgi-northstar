// Inline extraction widget rendered below the latest Copilot message
// during Phase 2 (Extraction Dialogue).
//
// One question at a time — input affordance matches the parameter type:
//   text          → single-line input
//   single-select → button group
//   multi-select  → toggleable chips, "Confirm" button to submit
//
// Optional parameters get a "Use default" link (spec §6).
// Required parameters with a defaultValue still show "Use default" — the
// pre-populated case (saved ICP, detected competitor).

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { copilotScript } from '../../data/marketAnalyzerCopilot/copilotScript.js';

function ProgressDots({ step, total }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
        {copilotScript.extraction.progress(step, total)}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i + 1 < step ? 'bg-primary' : i + 1 === step ? 'bg-primary' : 'bg-border-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function TextInput({ parameter, onSubmit }) {
  const [value, setValue] = useState(parameter.defaultValue || '');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed) onSubmit(trimmed);
      }}
      className="flex items-center gap-2"
    >
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={parameter.placeholder || ''}
        className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next <ChevronRight size={11} />
      </button>
    </form>
  );
}

function SingleSelectInput({ parameter, onSubmit }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {parameter.options.map((opt) => {
        const isDefault = opt === parameter.defaultValue;
        return (
          <button
            key={opt}
            onClick={() => onSubmit(opt)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
              isDefault
                ? 'bg-primary/10 text-primary border-primary/40 hover:bg-primary/20'
                : 'bg-surface text-text-secondary border-border hover:border-primary/40 hover:text-primary'
            }`}
          >
            {opt}
            {isDefault && <span className="ml-1 text-[9px] opacity-70">DEFAULT</span>}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelectInput({ parameter, onSubmit }) {
  const initial = useMemo(
    () => (Array.isArray(parameter.defaultValue) ? parameter.defaultValue : []),
    [parameter.defaultValue],
  );
  const [selected, setSelected] = useState(initial);
  const toggle = (opt) =>
    setSelected((prev) =>
      prev.includes(opt) ? prev.filter((p) => p !== opt) : [...prev, opt],
    );
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {parameter.options.map((opt) => {
          const isOn = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                isOn
                  ? 'bg-primary/10 text-primary border-primary/40'
                  : 'bg-surface text-text-secondary border-border hover:border-primary/40 hover:text-primary'
              }`}
            >
              {isOn && <Check size={10} />}
              {opt}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onSubmit(selected)}
        disabled={selected.length === 0}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Confirm {selected.length > 0 && `(${selected.length})`}
        <ChevronRight size={11} />
      </button>
    </div>
  );
}

export default function ExtractionPrompt({
  parameter,
  stepIndex,
  totalSteps,
  onSubmit,
  onUseDefault,
}) {
  // Reset internal state if the parameter swaps under us (e.g. fast clicks).
  useEffect(() => {
    // no-op — child inputs re-mount with the new parameter key
  }, [parameter.key]);

  const canUseDefault =
    parameter.defaultValue !== undefined && parameter.defaultValue !== null;

  return (
    <div className="ml-11 mt-2 mb-1 max-w-[85%] rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <ProgressDots step={stepIndex + 1} total={totalSteps} />
        {canUseDefault && (
          <button
            onClick={onUseDefault}
            className="text-[11px] text-text-muted hover:text-primary transition-colors underline-offset-2 hover:underline"
          >
            {copilotScript.extraction.skipLink}
          </button>
        )}
      </div>
      <div className="text-[13.5px] text-text-primary mb-2.5 leading-snug">
        {parameter.promptText}
      </div>
      {parameter.defaultLabel && (
        <div className="text-[11px] text-text-muted mb-2 italic">
          {copilotScript.extraction.confirmDefault(parameter.defaultLabel)}
        </div>
      )}
      {parameter.inputType === 'text' && (
        <TextInput key={parameter.key} parameter={parameter} onSubmit={onSubmit} />
      )}
      {parameter.inputType === 'single-select' && (
        <SingleSelectInput key={parameter.key} parameter={parameter} onSubmit={onSubmit} />
      )}
      {parameter.inputType === 'multi-select' && (
        <MultiSelectInput key={parameter.key} parameter={parameter} onSubmit={onSubmit} />
      )}
    </div>
  );
}
