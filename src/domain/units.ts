import type { Unit } from './model';

const factors = { m: 1, cm: 100, mm: 1000 };
export const toMetres = (value: number, unit: Unit) => value / factors[unit];
export const fromMetres = (value: number, unit: Unit) => value * factors[unit];

export function parseNumber(value: string) {
  const input = value.trim().replace(',', '.');
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(input) ? Number(input) : NaN;
}

export function formatNumber(value: number, maximumFractionDigits = 2, minimumFractionDigits = 0) {
  return new Intl.NumberFormat('pt-PT', { maximumFractionDigits, minimumFractionDigits, useGrouping: false }).format(value);
}

export const measure = (value: number, unit: Unit) =>
  `${formatNumber(fromMetres(value, unit), unit === 'm' ? 3 : 2, unit === 'm' ? 2 : 0)} ${unit}`;
