import { useState } from 'react';
import type { Point, Unit } from '../../domain/model';
import { parseNumber, toMetres } from '../../domain/units';

export function MeasureCoordinates({ unit, onMeasure }: { unit: Unit; onMeasure: (a: Point, b: Point) => void }) {
  const [invalid, setInvalid] = useState(false);
  return <details className="measure-coordinates">
    <summary>Medir por coordenadas</summary>
    <form className="coordinate-form" onChange={() => { if (invalid) setInvalid(false); }} onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const value = (name: string) => toMetres(parseNumber(String(data.get(name) ?? '')), unit);
      const a = { x: value('ax'), z: value('az') };
      const b = { x: value('bx'), z: value('bz') };
      if (![a.x, a.z, b.x, b.z].every(Number.isFinite)) { setInvalid(true); return; }
      setInvalid(false);
      onMeasure(a, b);
    }}>
      {(['A', 'B'] as const).flatMap(point => (['X', 'Z'] as const).map(axis => {
        const field = (point + axis).toLowerCase();
        return <label key={field}>{point} · {axis} ({unit})<input name={field} inputMode="decimal" required /></label>;
      }))}
      <button className="secondary wide" type="submit">Calcular distância</button>
    </form>
    {invalid && <p className="dialog-error" role="alert">Introduza coordenadas válidas nos quatro campos.</p>}
  </details>;
}
