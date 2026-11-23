import { changeAnchor, closestSegments, plus, volume, wallClearanceOffset, type ObjectIssues } from '../../domain/volumes';
import { edges } from '../../domain/geometry';
import { measure } from '../../domain/units';
import type { ObjectCommands } from '../../app/useObjectCommands';
import { ObjectActions } from './ObjectActions';
import { Box, ChevronRight, DoorOpen, Trash2 } from 'lucide-react';
import type { Selection } from '../../app/store';
import type { Asset, ObjectInstance, Opening, Room, Unit } from '../../domain/model';
import { openingNames, putOpening } from '../../domain/openings';
import { NumberField } from './NumberField';

type ChangeRoom = (update: (room: Room) => Room, selected?: Selection) => boolean;

export function MaterialField({ label, value, options, onChange }: {
  label: string; value: string; options: Record<string, { label: string }>; onChange: (value: string) => void;
}) {
  return <label className="text-field">{label}
    <select value={value} onChange={event => onChange(event.target.value)}>
      {!Object.hasOwn(options, value) && <option value={value}>Outro material</option>}
      {Object.entries(options).map(([id, material]) => <option key={id} value={id}>{material.label}</option>)}
    </select>
  </label>;
}

export function ObjectPanel({ room, object, asset, unit, onRoom, issue, clearance, commands }: {
  room: Room; object: ObjectInstance; asset?: Asset; unit: Unit; onRoom: ChangeRoom;
  issue?: ObjectIssues; clearance: number; commands: ObjectCommands;
}) {
  const imported = asset?.kind === 'glb';
  const scaleVector = typeof object.scale === 'number' ? { x: object.scale, y: object.scale, z: object.scale } : object.scale;
  function scaleValue(value: number) {
    if (!Number.isFinite(value) || value < .000001 || value > 10000) throw new Error('Introduza um fator entre 0,000001 e 10 000.');
    return value;
  }
  const dimensionAxis = { width: 'x', height: 'y', depth: 'z' } as const;
  const dimensions = { width: 'Largura do objeto', depth: 'Profundidade do objeto', height: 'Altura do objeto' } as const;
  const coordinates = { x: 'Posição X', z: 'Posição Z', y: 'Elevação Y' } as const;
  function change(update: (object: ObjectInstance) => ObjectInstance) {
    return onRoom(room => ({
      ...room, objects: room.objects.map(item => item.id === object.id ? update(item) : item),
    }));
  }
  const anchors = { base: 'Centro da base', center: 'Centro do volume', corner: 'Canto da base', origin: 'Origem do modelo' };
  function valid(value: number, minimum = -Infinity) {
    if (!Number.isFinite(value) || value < minimum) throw new Error('Introduza uma medida válida.');
    return value;
  }
  return <div className="panel-body">
    <div className="entity"><span className="entity-icon"><Box size={17} /></span><div><h3>{asset?.name ?? 'Objeto'}</h3><span>{room.name}</span></div></div>
    <fieldset className="properties-lock" disabled={object.locked}>
    <section className="property-section">
      <h4>Dimensões</h4>
      {(Object.keys(dimensions) as (keyof typeof dimensions)[]).map(key =>
        imported ? <div className="readout" key={key}><span>{dimensions[key]}</span>
          <strong aria-label={dimensions[key]}>{measure(object.dimensions[key] * scaleVector[dimensionAxis[key]], unit)}</strong>
        </div> : <NumberField key={key + unit} label={dimensions[key]} unit={unit} value={object.dimensions[key]} onCommit={value =>
          change(object => ({ ...object, dimensions: { ...object.dimensions, [key]: valid(value, .001) } }))} />)}
      {imported && <div className="model-scale-form">
        <label className="text-field">Tipo de escala<select value={typeof object.scale === 'number' ? 'uniform' : 'axes'} onChange={event => {
          const useAxes = event.target.value === 'axes';
          change(object => ({ ...object, scale: useAxes ? scaleVector : scaleVector.x }));
        }}><option value="uniform">Uniforme</option><option value="axes">Por eixo</option></select></label>
        {typeof object.scale === 'number' ? <NumberField label="Escala uniforme" unit="×" value={object.scale}
          onCommit={scale => change(object => ({ ...object, scale: scaleValue(scale) }))} /> : <>
          <p className="object-warning">Escalas diferentes podem distorcer o modelo. A escala uniforme aplica o fator X aos três eixos.</p>
          {(['x', 'y', 'z'] as const).map(axis => <NumberField key={axis} label={`Escala ${axis.toUpperCase()}`} unit="×" value={scaleVector[axis]}
            onCommit={value => change(object => ({ ...object, scale: { ...scaleVector, [axis]: scaleValue(value) } }))} />)}
        </>}
      </div>}
    </section>
    <section className="property-section">
      <h4>Posição local</h4>
      <label className="text-field">Ponto de referência<select value={object.anchor}
        onChange={event => change(object => changeAnchor(object, event.target.value as ObjectInstance['anchor']))}>
        {Object.entries(anchors).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      {(Object.keys(coordinates) as (keyof typeof coordinates)[]).map(key =>
        <NumberField key={key + unit} label={coordinates[key]} unit={unit} value={object.position[key]} onCommit={value =>
          change(object => ({ ...object, position: { ...object.position, [key]: valid(value) } }))} />)}
      <NumberField label="Rotação em planta" unit="°" value={object.rotation.y * 180 / Math.PI}
        onCommit={value => change(object => ({ ...object, rotation: { ...object.rotation, y: (valid(value) % 360) * Math.PI / 180 } }))} />
      {!imported && <MaterialField label="Cor do objeto" value={object.materialOverrides?.body ?? 'default'}
        options={{ default: { label: 'Original' }, '#344f74': { label: 'Azul' }, '#878e78': { label: 'Verde' },
          '#c08767': { label: 'Terracota' }, '#c4b8a7': { label: 'Linho' }, '#5b6069': { label: 'Grafite' } }}
        onChange={color => change(object => {
          const materialOverrides = { ...object.materialOverrides };
          if (color === 'default') delete materialOverrides.body;
          else materialOverrides.body = color;
          return { ...object, materialOverrides };
        })} />}
    </section>
    <section className="property-section">
      <h4>Encaixe</h4>
      {issue && !issue.outside && <NumberField key={issue.wallGap.wall.id + unit} label={`Folga à parede ${issue.wallGap.index + 1}`} unit={unit} value={issue.wallGap.distance}
        onCommit={value => change(object => {
          const { wall } = issue.wallGap;
          const clearance = valid(value, 0);
          const delta = wallClearanceOffset(room, volume(object).footprint, wall, clearance);
          const placed = { ...object, position: plus(object.position, { ...delta, y: 0 }) };
          const actual = Math.min(...edges(volume(placed).footprint).map(([a, b]) => closestSegments(a, b, wall.start, wall.end).distance));
          if (Math.abs(actual - clearance) > 1e-7) throw new Error('Afaste o objeto do canto para definir a folga perpendicular a esta parede.');
          return placed;
        })} />}
      <button className="secondary wide" onClick={() => change(object => ({
        ...object, position: { ...object.position, y: object.position.y - volume(object).bottom },
      }))}>Encostar ao chão</button>
    </section>
    </fieldset>
    <section className="property-section">
      <h4>Folgas e colisões</h4>
      {issue && <>
        {issue.outside && <p className="object-warning">O objeto sai dos limites da divisão.</p>}
        {!!issue.walls.length && <p className="object-warning">Interseção com {issue.walls.length === 1 ? 'a parede' : 'as paredes'} {issue.walls.join(', ')}.</p>}
        {issue.vertical && <p className="object-warning">O objeto passa abaixo do chão ou acima do teto.</p>}
        {!!issue.colliding.length && <p className="object-warning">Colisão com {issue.colliding.length === 1 ? '1 objeto' : `${issue.colliding.length} objetos`}.</p>}
        {!!issue.near.length && <p className="panel-copy">Folga inferior a {measure(clearance, unit)} junto de outro objeto.</p>}
        {!issue.outside && issue.wallGap.distance < clearance - 1e-8 && <p className="panel-copy">Folga inferior a {measure(clearance, unit)} junto da parede.</p>}
        {issue.objectGap && <div className="readout"><span>Objeto mais próximo</span>
          <strong>{measure(Math.hypot(issue.objectGap.distance, issue.objectGap.vertical), unit)}</strong></div>}
      </>}
      <label className="object-check"><input type="checkbox" checked={object.allowOverlap ?? false}
        onChange={event => { const allowOverlap = event.target.checked; change(object => ({ ...object, allowOverlap })); }} /> Permitir sobreposição</label>
    </section>
    <ObjectActions commands={commands} />
  </div>;
}

export function OpeningPanel({ room, opening, unit, onRoom, onSelect }: {
  room: Room; opening: Opening; unit: Unit; onRoom: ChangeRoom; onSelect: (selection: Selection) => void;
}) {
  const index = room.walls.findIndex(wall => wall.id === opening.wallId);
  const selectedWall = { roomId: room.id, kind: 'wall', index } as const;
  const fields = { offset: 'Distância ao início', width: 'Largura da abertura', height: 'Altura da abertura', sillHeight: 'Altura do peitoril' } as const;
  return <div className="panel-body">
    <div className="entity"><span className="entity-icon"><DoorOpen size={17} /></span><div><h3>{openingNames[opening.kind]}</h3><span>{room.name}</span></div></div>
    <button className="back-button" onClick={() => onSelect(selectedWall)}>Propriedades da parede <ChevronRight size={14} /></button>
    <section className="property-section">
      <h4>Medidas da abertura</h4>
      {(Object.keys(fields) as (keyof typeof fields)[]).map(key =>
        <NumberField key={key + unit} label={fields[key]} unit={unit} value={opening[key]}
          onCommit={value => onRoom(room => putOpening(room, { ...opening, [key]: value }))} />)}
    </section>
    <button className="secondary wide danger" onClick={() => onRoom(room => ({
      ...room, openings: room.openings.filter(item => item.id !== opening.id),
    }), selectedWall)}><Trash2 size={16} /> Remover abertura</button>
  </div>;
}
