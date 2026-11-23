import { useState } from 'react';
import { formatNumber, fromMetres, parseNumber, toMetres } from '../../domain/units';
import type { Unit } from '../../domain/model';

interface Props {
  label: string;
  value: number;
  unit: Unit | '°' | '×';
  onCommit: (value: number) => boolean;
}

export function NumberField({ label, value, unit, onCommit }: Props) {
  const [draft, setDraft] = useState<string>();
  const [invalid, setInvalid] = useState(false);
  const shown = unit === '°' || unit === '×' ? value : fromMetres(value, unit);
  const displayed = formatNumber(shown, unit === 'm' ? 3 : unit === '×' ? 6 : 2, unit === 'm' ? 2 : 0);
  return <label className="number-field">
    <span>{label}</span>
    <span className="input-wrap">
      <input type="text" inputMode="decimal" aria-invalid={invalid} value={draft ?? displayed}
        onChange={event => { setDraft(event.target.value); setInvalid(false); }}
        onBlur={() => {
          if (draft === undefined || draft === displayed) { setDraft(undefined); return; }
          const input = parseNumber(draft);
          const parsed = unit === '°' || unit === '×' ? input : toMetres(input, unit);
          if (onCommit(parsed)) setDraft(undefined);
          else setInvalid(true);
        }}
        onKeyDown={event => {
          if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); }
          if (event.key === 'Escape') { setDraft(undefined); setInvalid(false); }
        }} />
      <span>{unit}</span>
    </span>
  </label>;
}
