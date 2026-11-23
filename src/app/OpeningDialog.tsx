import { useState } from 'react';
import { distance } from '../domain/geometry';
import type { Opening, Unit, Wall } from '../domain/model';
import { openingNames } from '../domain/openings';
import { fromMetres, parseNumber, toMetres } from '../domain/units';

const defaults = { door: [.80, 2.10, 0], window: [1, 1.05, .95], void: [.90, 2.1, 0] } as const;

export function OpeningDialog({ wall, unit, onCreate }: {
  wall: Wall; unit: Unit; onCreate: (opening: Omit<Opening, 'id' | 'wallId'>) => void;
}) {
  const [kind, setKind] = useState<Opening['kind']>('door');
  const [width, height, sill] = defaults[kind];
  const offset = Math.max(0, Math.round((distance(wall.start, wall.end) - width) * 50) / 100);
  const display = (metres: number) => String(fromMetres(metres, unit)).replace('.', ',');
  return <form className="dialog-form" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (field: string) => toMetres(parseNumber(String(data.get(field))), unit);
    onCreate({ kind, offset: get('offset'), width: get('width'), height: get('height'), sillHeight: get('sill') });
  }}>
    <label>Tipo de abertura<select value={kind} onChange={event => setKind(event.target.value as Opening['kind'])}>
      {Object.entries(openingNames).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
    </select></label>
    {([
      ['offset', 'Distância ao início', offset], ['width', 'Largura', width],
      ['height', 'Altura', height], ['sill', 'Altura do peitoril', sill],
    ] as const).map(([name, label, value]) => <label key={kind + name}>{label} ({unit})
      <input name={name} defaultValue={display(value)} inputMode="decimal" required />
    </label>)}
    <button className="primary" type="submit">Criar abertura</button>
  </form>;
}
