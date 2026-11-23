import { useDrawerFocus } from './useDrawerFocus';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Columns2, EyeOff, ListChecks, Lock, TriangleAlert, CircleHelp, Download, FilePlus2, FolderOpen, Grid2X2, Hand, Layers2, MousePointer2,
  PanelLeft, PanelRight, Pentagon, Plus, Redo2, Ruler, Save, ScanLine, Settings2, Square, Undo2, Upload,
} from 'lucide-react';
import { updatedAfter, useEditor, type Selection } from './store';
import { useWorkspace } from '../storage/useWorkspace';
import { installProject, parseProject } from '../storage/projects';
import { Dialog } from './Dialog';
import { ProjectList } from './ProjectList';
import { StoragePanel } from './StoragePanel';
import { downloadFile, planPng } from '../importExport/capture';
import type { CaptureSlot } from '../features/viewer3d/CaptureBridge';
import { RoomDialog } from './RoomDialog';
import { OpeningDialog } from './OpeningDialog';
import { CatalogDialog } from './CatalogDialog';
import { pickObject } from './objectSelection';
import { useObjectCommands } from './useObjectCommands';
import { selectionIds, transformObjects, type ObjectPreview } from '../domain/placement';
import { defaultClearance, roomIssues } from '../domain/volumes';
import { NumberField } from '../features/editor2d/NumberField';
import { assetTemplate, createInstance, type Template } from '../domain/catalog';
import { putOpening } from '../domain/openings';
import { ViewerBoundary } from '../features/viewer3d/ViewerBoundary';
import type { ViewMode, WallsMode } from '../features/viewer3d/types';
import { add, area, bounds, createRoom, distance, rectangle, subtract } from '../domain/geometry';
import { changeLength, splitWall, updatePolygon } from '../domain/edits';
import { createProject, defaultImportLimitMB, id, type Asset, type Opening, type Point, type Project, type Room } from '../domain/model';
import { formatNumber, measure } from '../domain/units';
import { Plan } from '../features/editor2d/Plan';
import { Inspector } from '../features/editor2d/Inspector';
import type { Measurement, Tool, VertexPreview } from '../features/editor2d/types';

const ImportModelDialog = lazy(() => import('../features/modelImport/ImportModelDialog').then(module => ({ default: module.ImportModelDialog })));
const Viewer = lazy(() => import('../features/viewer3d/Viewer').then(module => ({ default: module.Viewer })));
const views = [
  { id: 'plan', label: 'Planta 2D', icon: Grid2X2 },
  { id: 'model', label: 'Vista 3D', icon: Box },
  { id: 'split', label: 'Vista dividida', icon: Columns2 },
] as const;

const tools = [
  { id: 'select', label: 'Selecionar', key: 'V', icon: MousePointer2, hint: 'Selecione uma divisão ou parede. Arraste um vértice para ajustar a planta.' },
  { id: 'rectangle', label: 'Retângulo', key: 'R', icon: Square, hint: 'Arraste na planta ou clique para criar uma divisão com medidas exatas.' },
  { id: 'polygon', label: 'Polígono', key: 'P', icon: Pentagon, hint: 'Marque os vértices. Clique no primeiro ou prima Enter para fechar a divisão.' },
  { id: 'wall', label: 'Dividir parede', key: 'W', icon: ScanLine, hint: 'Clique numa parede para a dividir. Mova o novo vértice para mudar o traçado.' },
  { id: 'measure', label: 'Medir', key: 'M', icon: Ruler, hint: 'Marque dois pontos na planta para medir a distância.' },
  { id: 'pan', label: 'Mão', key: 'H', icon: Hand, hint: 'Arraste a planta para mover o enquadramento.' },
] as const;

const hasExternalFiles = (project: Project) => project.assets.some(asset => asset.kind === 'glb' || asset.blobKey || asset.model);

const statuses = { loading: 'A abrir…', pending: 'A guardar…', saved: 'Guardado no dispositivo', error: 'Gravação pendente' };
type DialogType = 'create' | 'open' | 'rename' | 'rectangle' | 'settings' | 'help' | 'opening' | 'catalog' | 'model-import' | 'export' | 'project-import';

export function App() {
  const { project, selection, select, past, future, open, edit, undo, redo } = useEditor();
  const workspace = useWorkspace();
  const [working, setWorking] = useState(false);
  const [fileMessage, setFileMessage] = useState('');
  const [dialog, setDialog] = useState<DialogType>();
  const [view, setView] = useState<ViewMode>('plan');
  const [walls, setWalls] = useState<WallsMode>('cut');
  const [tool, setTool] = useState<Tool>('select');
  const [drawer, setDrawer] = useState<'left' | 'right'>();
  const panels = useDrawerFocus(drawer, !!dialog, () => setDrawer(undefined));
  const [draft, setDraft] = useState<Point[]>([]);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [multiSelect, setMultiSelect] = useState(false);
  const [objectPreview, setObjectPreview] = useState<ObjectPreview | null>(null);
  const [vertexPreview, setVertexPreview] = useState<VertexPreview | null>(null);
  const [origin, setOrigin] = useState<Point>();
  const [fitRequest, setFitRequest] = useState(0);
  const [zoomScale, setZoomScale] = useState(80);
  const [issue, setIssue] = useState('');
  const captureSlot: CaptureSlot = useRef(null);
  const planViewport = useRef<HTMLDivElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const room = project.rooms.find(item => item.id === selection?.roomId);
  const wall = room && selection?.kind === 'wall' ? room.walls[selection.index] : undefined;
  const currentTool = tools.find(item => item.id === tool)!;
  const unit = project.settings.unit;
  const shortcuts = project.settings.singleKeyShortcuts ?? true;
  const clearance = project.settings.clearance ?? defaultClearance;
  const commands = useObjectCommands(project, room, selection, edit);
  const objectProject = useMemo(() => objectPreview ? {
    ...project, rooms: project.rooms.map(room => room.id === objectPreview.roomId ? transformObjects(room, objectPreview) : room),
  } : project, [project, objectPreview]);
  const diagnosticCache = useRef(new WeakMap<Room, { clearance: number; issues: ReturnType<typeof roomIssues> }>());
  const issues = useMemo(() => new Map(objectProject.rooms.flatMap(room => {
    const cached = diagnosticCache.current.get(room);
    if (cached?.clearance === clearance) return [...cached.issues];
    const issues = roomIssues(room, clearance);
    diagnosticCache.current.set(room, { clearance, issues });
    return [...issues];
  })), [objectProject.rooms, clearance]);
  const alerts = [...issues.values()].filter(issue => issue.outside || issue.vertical || issue.walls.length || issue.colliding.length || issue.near.length ||
    issue.wallGap.distance < clearance - 1e-8).length;
  const modelProject = useMemo(() => {
    if (!vertexPreview || view !== 'split') return objectProject;
    const target = objectProject.rooms.find(room => room.id === vertexPreview.roomId);
    if (!target) return objectProject;
    try {
      const points = target.floorPolygon.map((point, index) => index === vertexPreview.index ? vertexPreview.point : point);
      const updated = updatePolygon(target, points);
      return { ...objectProject, rooms: objectProject.rooms.map(room => room.id === target.id ? updated : room) };
    } catch {
      return objectProject;
    }
  }, [objectProject, vertexPreview, view]);

  function activate(next: Tool) {
    setIssue('');
    if (next === 'rectangle') setOrigin(undefined);
    if (view === 'model' && next !== 'select') setView('split');
    if (tool !== next) {
      setDraft([]);
      setMeasurement(null);
    }
    setTool(next);
  }

  function choose(next: Selection, additive = false) {
    setIssue('');
    if (next?.kind === 'object') {
      const room = project.rooms.find(item => item.id === next.roomId);
      if (room) select(pickObject(room, next.itemId, selection, additive || multiSelect));
    } else select(next);
  }

  function commitObject(preview: ObjectPreview) {
    commands.transform(preview);
    setObjectPreview(null);
  }

  function nudgeSelection(direction: Point, large: boolean) {
    if (!room || selection?.kind !== 'object') return false;
    const step = (project.settings.snap || .01) * (large ? 10 : 1);
    commitObject({ roomId: room.id, ids: selectionIds(selection), delta: {
      x: direction.x * step, y: 0, z: direction.z * step,
    } });
    return true;
  }

  async function onOpen(project: Project, existing = false) {
    if (existing) {
      await workspace.save();
      project = workspace.latest(project);
    }
    open(project);
    setObjectPreview(null);
    setMultiSelect(false);
    setDialog(undefined);
    setDrawer(undefined);
    activate('select');
  }

  function addRoom(name: string, points: Point[], height = 2.5, origin: Point = points[0]) {
    const room = createRoom(name, points.map(point => subtract(point, origin)), height, origin);
    const count = project.rooms.length;
    try {
      updatePolygon(room, room.floorPolygon);
      edit(project => ({ ...project, rooms: [...project.rooms, room] }), { roomId: room.id, kind: 'room' });
      if (!count) setFitRequest(value => value + 1);
      activate('select');
      setDialog(undefined);
      return true;
    } catch (error) {
      setIssue((error as Error).message);
      return false;
    }
  }

  function rectangleDialog() {
    activate('rectangle');
    setDialog('rectangle');
  }

  function createRectangle(name: string, width: number, depth: number, height: number) {
    const roomPoints = project.rooms.flatMap(room => room.floorPolygon.map(point => add(point, room.origin)));
    const box = roomPoints.length ? bounds(roomPoints) : null;
    const start = origin ?? (box ? { x: box.maxX + 1, z: box.minZ } : { x: 0, z: 0 });
    if (addRoom(name, rectangle(width, depth).map(point => add(point, start)), height, start)) setFitRequest(value => value + 1);
  }

  function draw(point: Point, close = false) {
    if (close) { finish(); return; }
    if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) {
      setIssue('Introduza coordenadas válidas.');
      return;
    }
    if (draft.some(other => distance(other, point) < .001)) {
      setIssue('Cada vértice precisa de coordenadas distintas.');
      return;
    }
    setDraft([...draft, point]);
    setIssue('');
  }

  function finish() { addRoom(`Divisão ${project.rooms.length + 1}`, draft); }

  function changeRoom(target: Room, change: (room: Room) => Room, selected?: Selection) {
    try {
      const updated = change(target);
      edit(project => ({ ...project, rooms: project.rooms.map(item => item.id === target.id ? updated : item) }), selected);
      setIssue('');
      return true;
    } catch (error) {
      setIssue((error as Error).message);
      return false;
    }
  }

  function addOpening(values: Omit<Opening, 'id' | 'wallId'>) {
    if (!room || !wall) return;
    const opening = { ...values, id: id(), wallId: wall.id };
    if (changeRoom(room, room => putOpening(room, opening), { roomId: room.id, kind: 'opening', itemId: opening.id })) setDialog(undefined);
  }

  function addObject(template: Template) {
    if (!room) return;
    const instance = createInstance(room, template);
    edit(project => ({
      ...project,
      assets: project.assets.some(asset => asset.id === template.asset.id) ? project.assets : [...project.assets, template.asset],
      rooms: project.rooms.map(item => item.id === room.id ? { ...item, objects: [...item.objects, instance] } : item),
    }), { roomId: room.id, kind: 'object', itemId: instance.id });
    activate('select');
    setDialog(undefined);
  }

  function finishModelImport(asset: Asset, place: boolean) {
    if (place && room) {
      addObject(assetTemplate(asset));
      if (view === 'plan') setView('split');
    } else {
      edit(project => ({ ...project, assets: [...project.assets, asset] }));
      setDialog(room ? 'catalog' : undefined);
      setIssue(`Modelo «${asset.name}» guardado na biblioteca.`);
    }
  }

  function moveVertex(room: Room, index: number, point: Point) {
    return changeRoom(room, room => updatePolygon(room, room.floorPolygon.map((p, i) => index === i ? point : p)),
      { roomId: room.id, kind: 'vertex', index });
  }

  function resize(axis: 'x' | 'z', value: number) {
    if (!room) return false;
    return changeRoom(room, room => {
      if (!(value >= .001)) throw new Error('Introduza uma medida de pelo menos 1 mm.');
      const box = bounds(room.floorPolygon);
      const [min, max] = axis === 'x' ? [box.minX, box.maxX] : [box.minZ, box.maxZ];
      return updatePolygon(room, room.floorPolygon.map(point => ({ ...point, [axis]: min + (point[axis] - min) * value / (max - min) })));
    });
  }

  async function exportFile(format: 'zip' | 'json' | 'plan' | 'model') {
    if (working) return;
    setWorking(true);
    setFileMessage('');
    const filename = project.name.replace(/[^\p{L}\p{N} -]/gu, '_').slice(0, 100) || 'Projeto';
    try {
      if (format === 'zip') {
        const { exportProjectZip } = await import('../importExport/projectPackage');
        downloadFile(await exportProjectZip(project), `${filename}.spaceplan.zip`);
      } else if (format === 'json') {
        if (hasExternalFiles(project)) {
          throw new Error('Este projeto contém modelos externos. Use o ZIP para incluir modelos e texturas.');
        }
        downloadFile(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), `${filename}.spaceplan.json`);
      } else if (format === 'plan') {
        const svg = planViewport.current?.querySelector('svg');
        if (!svg || view === 'model') throw new Error('Abra a planta para exportar a imagem 2D.');
        downloadFile(await planPng(svg), `${filename}-planta.png`);
      } else {
        const capture = captureSlot.current;
        if (!capture) throw new Error('Abra uma vista 3D funcional antes de exportar a imagem.');
        downloadFile(await capture(), `${filename}-3D.png`);
      }
      setDialog(undefined);
    } catch (error) {
      setFileMessage(error instanceof Error ? error.message : 'Não foi possível exportar o ficheiro.');
    } finally { setWorking(false); }
  }

  async function importProject(file: File) {
    if (working) return;
    setDialog('project-import');
    setWorking(true);
    setFileMessage('');
    try {
      const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      const zipSignature = header[0] === 80 && header[1] === 75 &&
        ((header[2] === 3 && header[3] === 4) || (header[2] === 5 && header[3] === 6));
      if (/\.zip$/i.test(file.name) || zipSignature) {
        const { importProjectZip } = await import('../importExport/projectPackage');
        const decoded = await importProjectZip(file);
        try { await installProject(decoded.project, decoded.files); }
        catch { throw new Error('Não foi possível guardar a cópia importada. Verifique o espaço no dispositivo e tente novamente.'); }
        await onOpen(decoded.project);
      } else {
        if (file.size > 5 * 1024 * 1024) throw new Error('Escolha um ficheiro JSON até 5 MB ou um pacote ZIP de projeto.');
        let data: unknown;
        try { data = JSON.parse(await file.text()); } catch { throw new Error('Escolha um ficheiro JSON ou ZIP válido do SpacePlan.'); }
        const imported = parseProject(data);
        if (hasExternalFiles(imported)) {
          throw new Error('Este projeto requer os ficheiros originais dos modelos num pacote ZIP.');
        }
        await onOpen({ ...imported, id: id(), updatedAt: new Date().toISOString() });
      }
    } catch (error) {
      setFileMessage(error instanceof Error && error.name !== 'ZodError' ? error.message :
        'O ficheiro contém dados incompatíveis. Exporte novamente o projeto no SpacePlan 3D e importe o novo ficheiro.');
    } finally { setWorking(false); }
  }

  async function deleteProject(target: Project) {
    await workspace.remove(target.id);
    if (target.id === project.id) {
      const next = workspace.saved.find(item => item.id !== target.id);
      await onOpen(next ? workspace.latest(next) : createProject());
    }
  }

  async function restoreProject(snapshot: Project) {
    const current = [project, ...workspace.saved].find(item => item.id === snapshot.id);
    if (project.id === snapshot.id) {
      edit(() => snapshot, snapshot.rooms[0] ? { roomId: snapshot.rooms[0].id, kind: 'room' } : null);
      await workspace.save();
      setDialog(undefined);
    } else {
      await onOpen({ ...snapshot, updatedAt: updatedAfter(current?.updatedAt ?? snapshot.updatedAt) });
      await workspace.save();
    }
  }

  const keyboard = useRef<(event: KeyboardEvent) => void>(() => {});
  keyboard.current = event => {
    if (event.defaultPrevented || workspace.status === 'loading' || dialog || (event.target instanceof HTMLElement &&
        (event.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)))) return;
    const key = event.key.toLowerCase();
    if (event.metaKey || event.ctrlKey) {
      if (key === 'z' || key === 'y') {
        event.preventDefault();
        setIssue('');
        if (event.shiftKey || key === 'y') redo(); else undo();
      } else if (key === 'c' && commands.selected.length && !window.getSelection()?.toString()) {
        event.preventDefault();
        commands.copy();
      } else if (key === 'v' && commands.hasClipboard() && (room || project.rooms.length)) {
        event.preventDefault();
        commands.paste();
      } else if (key === 'd' && commands.selected.length) {
        event.preventDefault();
        commands.duplicate();
      } else if (key === 's') {
        event.preventDefault();
        void workspace.save();
      }
      return;
    }
    if (event.altKey) return;
    if (key === 'escape') { activate('select'); setDrawer(undefined); setMultiSelect(false); setObjectPreview(null); }
    else if ((key === 'delete' || key === 'backspace') && commands.selected.length) {
      event.preventDefault();
      commands.remove();
    }
    else if (key === 'enter' && tool === 'polygon' && draft.length >= 3 && !(event.target instanceof HTMLButtonElement)) finish();
    else if (shortcuts) {
      const shortcut = tools.find(item => item.key.toLowerCase() === key);
      const nextView = ['plan', 'model', 'split'] as const;
      const chosenView = ['1', '2', '3'].indexOf(key);
      if (shortcut) { event.preventDefault(); activate(shortcut.id); }
      else if (chosenView >= 0) { event.preventDefault(); setView(nextView[chosenView]); }
      else if (key === '?') { event.preventDefault(); setDialog('help'); }
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => keyboard.current(event);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onClose = () => { if (working) return; setDialog(undefined); if (dialog === 'rectangle') activate('select'); };

  return <div className="workspace">
    <header className="topbar">
      <div className="brand"><img src={`${import.meta.env.BASE_URL}icon.svg`} width="36" height="36" alt="" /><h1>SpacePlan <b>3D</b></h1></div>
      <button className="project-title" title="Mudar nome do projeto" onClick={() => setDialog('rename')}>
        <span>PROJETO</span><strong>{project.name}</strong>
      </button>
      <div className="project-actions" role="group" aria-label="Ficheiro do projeto">
        <button onClick={() => setDialog('create')} title="Novo projeto" aria-label="Novo projeto"><FilePlus2 size={17} /><span>Novo</span></button>
        <button onClick={() => setDialog('open')} title="Abrir projeto" aria-label="Abrir projeto"><FolderOpen size={17} /><span>Abrir</span></button>
        <button onClick={() => void workspace.save()} title="Guardar projeto (⌘ S)" aria-label="Guardar projeto"><Save size={17} /><span>Guardar</span></button>
      </div>
      <div className="file-actions" role="group" aria-label="Importação e exportação">
        <button onClick={() => importInput.current?.click()} title="Importar projeto" aria-label="Importar projeto"><Upload size={17} /><span>Importar</span></button>
        <button onClick={() => { setFileMessage(''); setDialog('export'); }} title="Exportar projeto" aria-label="Exportar projeto"><Download size={17} /><span>Exportar</span></button>
        <button onClick={() => setDialog('settings')} title="Definições" aria-label="Definições"><Settings2 size={19} /></button>
        <input ref={importInput} type="file" accept=".zip,.json,application/zip,application/json" hidden onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void importProject(file);
        }} />
      </div>
    </header>
    <div className="tooldeck">
      <div className="toolset">
        <button ref={panels.leftToggle} className="drawer-toggle icon-button" aria-controls="rooms-panel" aria-label="Mostrar divisões" aria-expanded={drawer === 'left'} onClick={() => setDrawer(drawer === 'left' ? undefined : 'left')}><PanelLeft size={19} /></button>
        {tools.map(item => <button key={item.id} title={shortcuts ? `${item.label} (${item.key})` : item.label} aria-label={item.label} aria-keyshortcuts={shortcuts ? item.key : undefined}
          className={`tool-button ${tool === item.id ? 'is-selected' : ''}`} aria-pressed={tool === item.id}
          onClick={() => activate(item.id)}><item.icon size={18} /><span>{item.label}</span></button>)}
      </div>
      <div className="history" role="group" aria-label="Histórico">
        <button className="icon-button" disabled={!past.length} title="Desfazer (⌘ Z)" aria-label="Desfazer" onClick={() => { setIssue(''); undo(); }}><Undo2 size={19} /></button>
        <button className="icon-button" disabled={!future.length} title="Refazer (⇧ ⌘ Z)" aria-label="Refazer" onClick={() => { setIssue(''); redo(); }}><Redo2 size={19} /></button>
        <button ref={panels.rightToggle} className="drawer-toggle icon-button" aria-controls="inspector-panel" aria-label="Mostrar propriedades" aria-expanded={drawer === 'right'} onClick={() => setDrawer(drawer === 'right' ? undefined : 'right')}><PanelRight size={19} /></button>
      </div>
    </div>
    <main className="work-area" aria-busy={workspace.status === 'loading'} inert={workspace.status === 'loading'}>
      <aside ref={panels.leftPanel} id="rooms-panel" className={`rooms-panel panel ${drawer === 'left' ? 'drawer-open' : ''}`} aria-label="Divisões do projeto">
        <div className="panel-heading"><Layers2 size={17} /><h2 tabIndex={-1}>Divisões</h2></div>
        <div className="room-list">
          {project.rooms.map(item => <button key={item.id} className={`room-item ${item.id === room?.id ? 'active' : ''}`}
            aria-pressed={item.id === room?.id} onClick={() => { activate('select'); choose({ roomId: item.id, kind: 'room' }); setDrawer(undefined); }}>
            <span className="room-glyph"><Box size={17} /></span>
            <span className="room-text"><strong>{item.name}</strong><small>{formatNumber(area(item.floorPolygon), 3, 2)} m²</small></span>
          </button>)}
          <button className="new-room" onClick={rectangleDialog}><Plus size={18} /> Nova divisão</button>
          {room && <div className="room-objects">
            <div className="object-list-heading"><h3>Objetos</h3>
              {!!room.objects.length && <button className="icon-button" title="Selecionar vários objetos" aria-label="Selecionar vários objetos"
                aria-pressed={multiSelect} onClick={() => setMultiSelect(!multiSelect)}><ListChecks size={17} /></button>}
            </div>
            {room.objects.map(object => {
              const asset = project.assets.find(item => item.id === object.assetId);
              const active = selection?.kind === 'object' && selectionIds(selection).includes(object.id);
              return <button key={object.id} className={`room-item ${active ? 'active' : ''}`} aria-pressed={active}
                onClick={event => {
                  activate('select'); choose({ roomId: room.id, kind: 'object', itemId: object.id }, event.shiftKey || event.metaKey);
                  if (!multiSelect) setDrawer(undefined);
                }}>
                <span className="room-glyph"><Box size={15} /></span><span className="room-text"><strong>{asset?.name ?? 'Objeto'}</strong></span>
                {object.locked && <Lock size={14} aria-label="Bloqueado" />}
                {!object.visible && <EyeOff size={14} aria-label="Oculto" />}
              </button>;
            })}
            <button className="new-room" onClick={() => setDialog('catalog')}><Plus size={17} /> Adicionar objeto</button>
          </div>}
          <button className="new-room" onClick={() => setDialog('model-import')}><Upload size={17} /> Importar GLB/GLTF</button>
        </div>
        <div className="panel-bottom"><button className="secondary wide" onClick={() => setDialog('help')}><CircleHelp size={17} /> Ajuda e atalhos</button></div>
      </aside>
      <section className="drawing-area" aria-label="Área de desenho" inert={panels.compact && !!drawer}>
        <div className="view-bar">
          <div className="view-switch" role="group" aria-label="Modo de visualização">
            {views.map((item, index) => <button key={item.id} aria-keyshortcuts={shortcuts ? String(index + 1) : undefined} aria-pressed={view === item.id} onClick={() => setView(item.id)}>
              <item.icon size={16} /><span>{item.label}</span>
            </button>)}
          </div>
        </div>
        <div className={`viewports view-${view}`}>
          <div ref={planViewport} className="plan-viewport" hidden={view === 'model'}>
            <Plan project={project} selection={selection} tool={tool} draft={draft} measurement={measurement} fitRequest={fitRequest}
              onSelect={choose} onDraw={draw} onMove={moveVertex} objectPreview={objectPreview} issues={issues}
              onObjectPreview={setObjectPreview} onObjectCommit={commitObject} onPreview={view === 'split' ? setVertexPreview : undefined}
              onZoom={setZoomScale} onNudge={nudgeSelection} onPan={() => activate(tool === 'pan' ? 'select' : 'pan')}
              onSplit={(room, index, point) => {
                if (changeRoom(room, room => splitWall(room, index, point), { roomId: room.id, kind: 'vertex', index: index + 1 })) activate('select');
              }}
              onRectangle={(start, end) => {
                if (!end) { setOrigin(start); setDialog('rectangle'); return; }
                const origin = { x: Math.min(start.x, end.x), z: Math.min(start.z, end.z) };
                const points = rectangle(Math.abs(start.x - end.x), Math.abs(start.z - end.z));
                addRoom(`Divisão ${project.rooms.length + 1}`, points.map(point => add(point, origin)));
              }}
              onMeasure={point => setMeasurement(measurement && !measurement[1] ? [measurement[0], point] : [point])} />
          </div>
          {view !== 'plan' && <ViewerBoundary fallback={<div className="viewer-message" role="status">
            <strong>O módulo 3D não carregou.</strong>
            <p>Volte à planta e recarregue a aplicação para tentar novamente.</p>
            <button className="secondary" onClick={() => setView('plan')}>Voltar à planta</button>
          </div>}>
            <Suspense fallback={<div className="viewer-message" role="status">A preparar a vista 3D…</div>}>
              <Viewer captureSlot={captureSlot} project={modelProject} committed={project} selection={selection}
                select={(next, additive) => { activate('select'); choose(next, additive); }}
                walls={walls} onWallsChange={setWalls} onPreview={setObjectPreview} onCommit={commitObject} />
            </Suspense>
          </ViewerBoundary>}
        </div>
        <div className={`tool-hint ${issue || workspace.issue ? 'has-issue' : ''}`} role="status">
          <span>{issue || workspace.issue || workspace.notice || (view === 'model' ? 'Arraste para orbitar. Use a roda ou faça pinça para ampliar.' : currentTool.hint)}</span>
          {(issue || workspace.issue || workspace.notice) ? ((issue || workspace.notice) && <button
            onClick={() => { if (issue) setIssue(''); else workspace.dismissNotice(); }} aria-label="Fechar mensagem">×</button>) :
            (shortcuts && view !== 'model' && <kbd>{currentTool.key}</kbd>)}
        </div>
      </section>
      {drawer && <button className="drawer-backdrop" tabIndex={-1} onClick={() => setDrawer(undefined)} aria-label="Fechar painel" />}
      <aside ref={panels.rightPanel} id="inspector-panel" className={`inspector panel ${drawer === 'right' ? 'drawer-open' : ''}`} aria-label="Propriedades da seleção">
        <Inspector project={project} room={room} selection={selection} tool={tool} draft={draft} measurement={measurement}
          commands={commands} issues={issues} onSelect={choose} onRoom={(change, next) => !!room && changeRoom(room, change, next)}
          onAddOpening={() => { setIssue(''); setDialog('opening'); }} onResize={resize} onMove={moveVertex}
          onLength={(index, length) => !!room && changeRoom(room, room => changeLength(room, index, length))}
          onRemove={() => { if (room) edit(project => ({ ...project, rooms: project.rooms.filter(item => item.id !== room.id) }), null); }}
          onDraw={draw} onFinish={finish} onRemovePoint={() => { setDraft(draft.slice(0, -1)); setIssue(''); }}
          onClearMeasure={() => setMeasurement(null)} onMeasureCoordinates={(a, b) => { setIssue(''); setMeasurement([a, b]); }} onRectangle={rectangleDialog} onSettings={() => setDialog('settings')} />
      </aside>
    </main>
    <footer className="statusbar">
      <div className="save-status" role="status"><i className={workspace.status} /> {statuses[workspace.status]}</div>
      <div className="status-settings">
        {alerts > 0 && <span className="placement-status" role="status" title="Objetos com colisão, folga insuficiente ou fora da divisão">
          <TriangleAlert size={15} /> {alerts} em alerta
        </span>}
        <button onClick={() => setDialog('settings')} title="Unidades e encaixe"><Grid2X2 size={14} /> {project.settings.snap ? `Encaixe ${measure(project.settings.snap, 'cm')}` : 'Encaixe desligado'}</button>
        {view !== 'model' && <span className="zoom-status">{formatNumber(zoomScale, 1)} px/m</span>}
        <button onClick={() => setDialog('settings')} aria-label="Mudar unidade">{unit}</button>
      </div>
    </footer>
    {dialog && <Dialog busy={working} wide={dialog === 'model-import'} title={{ create: 'Novo projeto', open: 'Abrir projeto', rename: 'Nome do projeto', rectangle: 'Nova divisão retangular', settings: 'Grelha e unidades', help: 'Ajuda e atalhos', opening: 'Nova abertura', catalog: 'Biblioteca de objetos', 'model-import': 'Importar modelo 3D', export: 'Exportar projeto', 'project-import': 'Importar projeto' }[dialog]} onClose={onClose}>
      {dialog === 'opening' && wall && <><OpeningDialog wall={wall} unit={unit} onCreate={addOpening} />
        {issue && <p className="dialog-error" role="alert">{issue}</p>}</>}
      {dialog === 'model-import' && <ViewerBoundary fallback={<p role="alert">Não foi possível carregar a importação 3D. Reabra a aplicação e tente novamente.</p>}>
        <Suspense fallback={<p role="status">A preparar a importação…</p>}>
          <ImportModelDialog unit={unit} limitMB={project.settings.importLimitMB ?? defaultImportLimitMB} hasRoom={!!room} onSave={finishModelImport} />
        </Suspense>
      </ViewerBoundary>}
      {dialog === 'catalog' && <CatalogDialog project={project} edit={edit} onAdd={addObject} onImport={() => setDialog('model-import')} />}
      {dialog === 'rectangle' && <><RoomDialog unit={unit} onCreate={createRectangle} />{issue && <p className="dialog-error" role="alert">{issue}</p>}</>}
      {(dialog === 'create' || dialog === 'rename') && <form className="dialog-form" onSubmit={event => {
        event.preventDefault();
        const name = String(new FormData(event.currentTarget).get('name')).trim();
        if (!name) return;
        if (dialog === 'create') onOpen(createProject(name));
        else { edit(project => ({ ...project, name })); onClose(); }
      }}>
        <label>Nome<input name="name" defaultValue={dialog === 'rename' ? project.name : ''} placeholder="Projeto sem título" required /></label>
        <button className="primary" type="submit">{dialog === 'create' ? 'Criar projeto' : 'Guardar nome'}</button>
      </form>}
      {dialog === 'open' && <ProjectList items={[project, ...workspace.saved.filter(item => item.id !== project.id)]}
        active={project.id} onOpen={item => { if (item.id === project.id) onClose(); else void onOpen(item, true); }}
        onDelete={deleteProject} onRestore={restoreProject} />}
      {dialog === 'project-import' && (fileMessage ? <p className="dialog-error" role="alert">{fileMessage}</p> :
        <p className="panel-copy" role="status">A validar e a guardar a cópia do projeto…</p>)}
      {dialog === 'export' && <div className="project-list">
        <button className="primary" disabled={working} onClick={() => void exportFile('zip')}>Exportar ZIP do projeto</button>
        <button className="secondary" disabled={working || hasExternalFiles(project)}
          onClick={() => void exportFile('json')}>Exportar JSON</button>
        <button className="secondary" disabled={working || view === 'model'} onClick={() => void exportFile('plan')}>Exportar planta em PNG</button>
        <button className="secondary" disabled={working || view === 'plan'} onClick={() => void exportFile('model')}>Exportar vista 3D em PNG</button>
        {hasExternalFiles(project) && <p className="panel-copy">O ZIP inclui os modelos originais e as respetivas texturas.</p>}
        {view !== 'split' && <p className="panel-copy">Abra a vista que pretende exportar, ou a vista dividida para ter as duas opções.</p>}
        {working && <p className="panel-copy" role="status">A preparar o ficheiro…</p>}
        {fileMessage && <p className="dialog-error" role="alert">{fileMessage}</p>}
      </div>}
      {dialog === 'settings' && <div className="dialog-form">
        <label>Unidade de medida<select value={unit} onChange={event => {
          const unit = event.target.value as Project['settings']['unit'];
          edit(project => ({ ...project, settings: { ...project.settings, unit } }));
        }}><option value="mm">Milímetros (mm)</option><option value="cm">Centímetros (cm)</option><option value="m">Metros (m)</option></select></label>
        <label>Encaixe de desenho<select value={project.settings.snap} onChange={event => {
          const snap = Number(event.target.value) as Project['settings']['snap'];
          edit(project => ({ ...project, settings: { ...project.settings, snap } }));
        }}><option value={0}>Desligado</option><option value={.01}>1 cm</option><option value={.05}>5 cm</option><option value={.1}>10 cm</option></select></label>
        <NumberField label="Folga mínima para avisos" unit={unit} value={clearance} onCommit={clearance => {
          if (!(clearance >= 0) || !Number.isFinite(clearance)) return false;
          edit(project => ({ ...project, settings: { ...project.settings, clearance } }));
          return true;
        }} />
        <label>Limite de importação<select value={project.settings.importLimitMB ?? defaultImportLimitMB} onChange={event => {
          const importLimitMB = Number(event.target.value);
          edit(project => ({ ...project, settings: { ...project.settings, importLimitMB } }));
        }}>{[10, 30, 50, 100].map(size => <option key={size} value={size}>{size} MB</option>)}</select></label>
        <label>Qualidade da vista 3D<select value={project.settings.quality ?? 'auto'} onChange={event => {
          const quality = event.target.value as Project['settings']['quality'];
          edit(project => ({ ...project, settings: { ...project.settings, quality } }));
        }}><option value="auto">Automática</option><option value="low">Económica</option><option value="high">Detalhada</option></select></label>
        <label>Limite de objetos em 3D<select value={project.settings.objectLimit3D ?? 0} onChange={event => {
          const objectLimit3D = Number(event.target.value) || undefined;
          edit(project => ({ ...project, settings: { ...project.settings, objectLimit3D } }));
        }}><option value={0}>Automático</option>{[25, 50, 100, 150, 250, 500].map(count =>
          <option value={count} key={count}>{count} objetos</option>)}</select></label>
        <label className="check-label"><input type="checkbox" checked={project.settings.grid} onChange={event => {
          const grid = event.target.checked;
          edit(project => ({ ...project, settings: { ...project.settings, grid } }));
        }} /> Mostrar grelha</label>
        <label className="check-label"><input type="checkbox" checked={shortcuts} onChange={event => {
          const singleKeyShortcuts = event.target.checked;
          edit(project => ({ ...project, settings: { ...project.settings, singleKeyShortcuts } }));
        }} /> Atalhos de uma tecla</label>
        <StoragePanel clean={() => workspace.clean(commands.clipboardKeys())} />
      </div>}
      {dialog === 'help' && <div className="help-content">
        <h3>Editar com precisão</h3>
        <p>Selecione uma divisão ou objeto e abra Propriedades. Os campos aceitam vírgula e ponto decimal. Em Medir, pode marcar dois pontos na planta ou usar coordenadas.</p>
        <h3>Navegar na planta</h3>
        <p>Use a roda para zoom ou Espaço + arrastar para mover. No iPad, use dois dedos para mudar o enquadramento. Com o foco na planta, as setas movem a vista ou o objeto selecionado. Use Shift para mover o objeto dez passos, + e − para zoom e 0 para enquadrar.</p>
        <h3>Atalhos</h3>
        <p>Os atalhos de uma tecla podem ser desligados em Definições. Os atalhos com modificadores aceitam ⌘ no Mac e Ctrl nos restantes teclados.</p>
        <dl>{tools.map(item => <div key={item.id}><dt>{item.label}</dt><dd><kbd>{item.key}</kbd></dd></div>)}
          <div><dt>Planta, 3D e vista dividida</dt><dd><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></dd></div>
          <div><dt>Desfazer / Refazer</dt><dd><kbd>⌘ Z</kbd> / <kbd>⇧ ⌘ Z</kbd></dd></div>
          <div><dt>Copiar / Colar objeto</dt><dd><kbd>⌘ C</kbd> / <kbd>⌘ V</kbd></dd></div>
          <div><dt>Duplicar objeto</dt><dd><kbd>⌘ D</kbd></dd></div>
          <div><dt>Guardar</dt><dd><kbd>⌘ S</kbd></dd></div>
          <div><dt>Ajuda</dt><dd><kbd>?</kbd></dd></div>
        </dl>
      </div>}
    </Dialog>}
  </div>;
}
