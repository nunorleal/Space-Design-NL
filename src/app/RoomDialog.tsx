import { useState } from 'react';
import type { Unit } from '../domain/model';
import { fromMetres, parseNumber, toMetres } from '../domain/units';

export function RoomDialog({ unit, onCreate }: {
  unit: Unit; onCreate: (name: string, width: number, depth: number, height: number) => void;
}) {
  const [error, setError] = useState('');
  return <form className="dialog-form" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const [width, depth, height] = ['width', 'depth', 'height'].map(key => toMetres(parseNumber(String(data.get(key))), unit));
    const name = String(data.get('name')).trim();
    if (!name || [width, depth, height].some(value => !Number.isFinite(value) || value < .001)) {
      setError('Introduza um nome e medidas válidas de pelo menos 1 mm.');
    } else onCreate(name, width, depth, height);
  }}>
    <label>Nome da divisão<input name="name" defaultValue="Divisão" required /></label>
    <label>Largura ({unit})<input name="width" inputMode="decimal" defaultValue={String(fromMetres(5, unit))} required /></label>
    <label>Profundidade ({unit})<input name="depth" inputMode="decimal" defaultValue={String(fromMetres(3, unit))} required /></label>
    <label>Altura ({unit})<input name="height" inputMode="decimal" defaultValue={String(fromMetres(2.5, unit)).replace('.', ',')} required /></label>
    {error && <p className="dialog-error" role="alert">{error}</p>}
    <button className="primary" type="submit">Criar divisão</button>
  </form>;
}
