import { MeasureCoordinates } from './MeasureCoordinates';
import type { ObjectCommands } from '../../app/useObjectCommands';
import { defaultClearance, type ObjectIssues } from '../../domain/volumes';
import { ObjectActions } from './ObjectActions';
import { Box } from 'lucide-react';
import { MaterialField, ObjectPanel, OpeningPanel } from './EntityPanels';
import { floorMaterials, paintMaterials } from '../../domain/materials';
import { openingNames } from '../../domain/openings';
import { AlignLeft, Check, ChevronRight, CirclePlus, Grid2X2, Ruler, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { area, bounds, distance, perimeter } from '../../domain/geometry';
import type { Point, Project, Room } from '../../domain/model';
import { formatNumber, measure, parseNumber, toMetres } from '../../domain/units';
import type { Selection } from '../../app/store';
import { NumberField } from './NumberField';
import type { Measurement, Tool } from './types';

interface Props {
  project: Project;
  room: Room | undefined;
  selection: Selection;
  tool: Tool;
  draft: Point[];
  measurement: Measurement | null;
  commands: ObjectCommands;
  issues: Map<string, ObjectIssues>;
  onSelect: (selection: Selection) => void;
  onRoom: (change: (room: Room) => Room, selected?: Selection) => boolean;
  onAddOpening: () => void;
  onResize: (axis: 'x' | 'z', value: number) => boolean;
  onMove: (room: Room, index: number, point: Point) => boolean;
  onLength: (index: number, length: number) => boolean;
  onRemove: () => void;
  onDraw: (point: Point) => void;
  onFinish: () => void;
  onRemovePoint: () => void;
  onClearMeasure: () => void;
  onMeasureCoordinates: (a: Point, b: Point) => void;
  onRectangle: () => void;
  onSettings: () => void;
}

export function Inspector(props: Props) {
  const { project, room, selection, tool, draft, measurement } = props;
  const unit = project.settings.unit;
  const [materials, setMaterials] = useState(false);
  const [extras, setExtras] = useState(false);
  const [coordinates, setCoordinates] = useState({ x: '', z: '' });
  const title = tool === 'polygon' ? 'Polígono' : tool === 'measure' ? 'Medição' :
    selection?.kind === 'wall' ? 'Parede' : selection?.kind === 'vertex' ? 'Vértice' : 'Divisão';
  const box = room && bounds(room.floorPolygon);
  const wall = selection?.kind === 'wall' && room?.walls[selection.index];
  const vertex = selection?.kind === 'vertex' && room?.floorPolygon[selection.index];

  const object = selection?.kind === 'object' && room?.objects.find(item => item.id === selection.itemId);
  const opening = selection?.kind === 'opening' && room?.openings.find(item => item.id === selection.itemId);

  function dimension(label: string, value: number, update: (value: number) => boolean, key = label) {
    return <NumberField key={key + unit} label={label} unit={unit} value={value} onCommit={update} />;
  }

  return <>
    <div className="panel-heading"><SlidersHorizontal size={17} /><h2 id="inspector-heading" tabIndex={-1}>Propriedades</h2></div>
    {tool === 'polygon' ? <div className="panel-body">
      <div className="entity"><span className="entity-icon"><AlignLeft size={17} /></span><div><h3>Nova divisão</h3><span>{draft.length} {draft.length === 1 ? 'vértice' : 'vértices'}</span></div></div>
      <p className="panel-copy">Marque os vértices na planta ou introduza as coordenadas abaixo. Termine no primeiro vértice para fechar a divisão.</p>
      <form className="coordinate-form" onSubmit={event => {
        event.preventDefault();
        props.onDraw({ x: toMetres(parseNumber(coordinates.x), unit), z: toMetres(parseNumber(coordinates.z), unit) });
      }}>
        <label>X ({unit})<input inputMode="decimal" required value={coordinates.x} onChange={event => setCoordinates({ ...coordinates, x: event.target.value })} /></label>
        <label>Z ({unit})<input inputMode="decimal" required value={coordinates.z} onChange={event => setCoordinates({ ...coordinates, z: event.target.value })} /></label>
        <button className="secondary wide" type="submit"><CirclePlus size={16} /> Adicionar vértice</button>
      </form>
      {draft.length > 0 && <ol className="point-list">
        {draft.map((point, index) => <li key={index}><span>V{index + 1}</span> <b>{measure(point.x, unit)}, {measure(point.z, unit)}</b></li>)}
      </ol>}
      <button className="primary wide" disabled={draft.length < 3} onClick={props.onFinish}><Check size={16} /> Fechar divisão</button>
      {draft.length > 0 && <button className="secondary wide" onClick={props.onRemovePoint}>Retirar último vértice</button>}
    </div> : tool === 'measure' ? <div className="panel-body">
      <div className="entity"><span className="entity-icon"><Ruler size={17} /></span><div><h3>Medir distância</h3><span>Ponto a ponto</span></div></div>
      <p className="panel-copy">{!measurement ? 'Escolha o ponto inicial na planta.' : !measurement[1] ? 'Escolha o ponto final na planta.' : 'Escolha outro ponto para iniciar uma nova medição.'}</p>
      {measurement?.[1] && <div className="readout" role="status"><span>Distância</span><strong>{measure(distance(measurement[0], measurement[1]), unit)}</strong></div>}
      {measurement && <button className="secondary wide" onClick={props.onClearMeasure}>Limpar medição</button>}
      <MeasureCoordinates key={unit} unit={unit} onMeasure={props.onMeasureCoordinates} />
    </div> : props.commands.selected.length > 1 ? <div className="panel-body">
      <div className="entity"><span className="entity-icon"><Box size={17} /></span><div><h3>{props.commands.selected.length} objetos selecionados</h3>
        <span>{room?.name}</span></div></div>
      {props.commands.anyLocked && <p className="panel-copy">Desbloqueie os objetos para os mover ou alinhar.</p>}
      <ObjectActions commands={props.commands} />
    </div> : room && object ? <ObjectPanel key={object.id} room={room} object={object}
      asset={project.assets.find(item => item.id === object.assetId)} unit={unit} onRoom={props.onRoom} commands={props.commands} issue={props.issues.get(object.id)} clearance={project.settings.clearance ?? defaultClearance} /> :
    room && opening ? <OpeningPanel key={opening.id} room={room} opening={opening} unit={unit} onRoom={props.onRoom} onSelect={props.onSelect} /> :
    room && box ? <div className="panel-body">
      <div className="entity">
        <span className="entity-icon">{vertex ? <CirclePlus size={17} /> : wall ? <Ruler size={17} /> : <Grid2X2 size={17} />}</span>
        <div><h3>{wall || vertex ? `${title} ${(selection && 'index' in selection ? selection.index : 0) + 1}` : room.name}</h3>
          <span>{room.floorPolygon.length} paredes{wall || vertex ? ` · ${room.name}` : ''}</span></div>
      </div>
      {(wall || vertex) && <button className="back-button" onClick={() => props.onSelect({ roomId: room.id, kind: 'room' })}>Propriedades da divisão <ChevronRight size={14} /></button>}
      <section className="property-section">
        <h4>{vertex ? 'Coordenadas locais' : 'Dimensões'}</h4>
        {selection?.kind === 'vertex' && vertex ? <>
          {dimension('Coordenada X', vertex.x, x => props.onMove(room, selection.index, { ...vertex, x }), `${room.id}-${selection.index}-x`)}
          {dimension('Coordenada Z', vertex.z, z => props.onMove(room, selection.index, { ...vertex, z }), `${room.id}-${selection.index}-z`)}
        </> : selection?.kind === 'wall' && wall ? <>
          {dimension('Comprimento', distance(wall.start, wall.end), length => props.onLength(selection.index, length), wall.id + '-length')}
          {dimension('Espessura', wall.thickness, thickness => props.onRoom(room => {
            if (!(thickness >= .001)) throw new Error('Introduza uma espessura de pelo menos 1 mm.');
            return { ...room, walls: room.walls.map(item => item.id === wall.id ? { ...item, thickness } : item) };
          }), wall.id + '-thickness')}
          <div className="readout"><span>Altura</span><strong>{measure(wall.height, unit)}</strong></div>
        </> : <>
          {dimension('Largura (X)', box.maxX - box.minX, value => props.onResize('x', value), room.id + '-width')}
          {dimension('Profundidade (Z)', box.maxZ - box.minZ, value => props.onResize('z', value), room.id + '-depth')}
          {dimension('Altura', room.wallHeight, wallHeight => props.onRoom(room => {
            if (!(wallHeight >= .001)) throw new Error('Introduza uma altura de pelo menos 1 mm.');
            if (room.openings.some(item => item.height + item.sillHeight > wallHeight)) throw new Error('Uma abertura deixaria de caber na parede.');
            return { ...room, wallHeight, walls: room.walls.map(wall => ({ ...wall, height: wallHeight })) };
          }), room.id + '-height')}
        </>}
      </section>
      {wall && <section className="property-section">
        <h4>Acabamento e aberturas</h4>
        <MaterialField label="Material da parede" value={wall.materialId} options={paintMaterials} onChange={materialId =>
          props.onRoom(room => ({ ...room, walls: room.walls.map(item => item.id === wall.id ? { ...item, materialId } : item) }))} />
        {room.openings.filter(item => item.wallId === wall.id).map(item =>
          <button key={item.id} className="back-button"
            onClick={() => props.onSelect({ roomId: room.id, kind: 'opening', itemId: item.id })}>
            {openingNames[item.kind]} · {measure(item.width, unit)} <ChevronRight size={14} />
          </button>)}
        <button className="secondary wide" onClick={props.onAddOpening}><CirclePlus size={16} /> Adicionar abertura</button>
      </section>}
      {!wall && !vertex && <section className="property-section">
        <h4>Dados da planta</h4>
        <div className="readout"><span>Área útil</span><strong>{formatNumber(area(room.floorPolygon), 3, 2)} m²</strong></div>
        <div className="readout"><span>Perímetro</span><strong>{measure(perimeter(room.floorPolygon), unit)}</strong></div>
      </section>}
      {!wall && !vertex && <section className="property-section">
        <button className="disclosure" aria-expanded={materials} onClick={() => setMaterials(!materials)}>Materiais da divisão <ChevronRight size={16} /></button>
        {materials && <>
          <MaterialField label="Material do pavimento" value={room.floorMaterial} options={floorMaterials}
            onChange={floorMaterial => props.onRoom(room => ({ ...room, floorMaterial }))} />
          <MaterialField label="Material do teto" value={room.ceilingMaterial} options={paintMaterials}
            onChange={ceilingMaterial => props.onRoom(room => ({ ...room, ceilingMaterial }))} />
        </>}
        <button className="disclosure" aria-expanded={extras} onClick={() => setExtras(!extras)}>Nome, origem e paredes <ChevronRight size={16} /></button>
        {extras && <>
          <label className="text-field">Nome da divisão<input key={room.id + room.name} defaultValue={room.name} onBlur={event => {
            const name = event.target.value.trim();
            if (name && name !== room.name) props.onRoom(room => ({ ...room, name }));
            else event.target.value = room.name;
          }} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></label>
          {dimension('Origem X', room.origin.x, x => props.onRoom(room => ({ ...room, origin: { ...room.origin, x } })))}
          {dimension('Origem Z', room.origin.z, z => props.onRoom(room => ({ ...room, origin: { ...room.origin, z } })))}
          <div className="geometry-links">
            {room.walls.map((item, index) => <div key={item.id}>
              <button onClick={() => props.onSelect({ roomId: room.id, kind: 'wall', index })}>Parede {index + 1}</button>
              <button onClick={() => props.onSelect({ roomId: room.id, kind: 'vertex', index })}>Vértice {index + 1}</button>
            </div>)}
          </div>
          <button className="danger secondary wide" onClick={props.onRemove}><Trash2 size={15} /> Remover divisão</button>
        </>}
      </section>}
    </div> : <div className="panel-body">
      <p className="panel-copy">Selecione uma divisão na planta para consultar ou editar as suas medidas.</p>
      <button className="secondary wide" onClick={props.onRectangle}><CirclePlus size={16} /> Criar retângulo</button>
    </div>}
    <div className="panel-bottom"><button className="secondary wide" onClick={props.onSettings}><Grid2X2 size={16} /> Grelha e unidades</button></div>
  </>;
}
