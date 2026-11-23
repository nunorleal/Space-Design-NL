import { useEffect, useMemo, useRef, useState } from 'react';
import { FileArchive, FolderOpen, Upload } from 'lucide-react';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { id, type Asset, type ModelOrientation, type Unit } from '../../domain/model';
import { measure } from '../../domain/units';
import { collectModel } from '../../importExport/modelFiles';
import { prepareDocument } from '../../importExport/gltfDocument';
import { modelBinaries } from '../../storage/projects';
import { NumberField } from '../editor2d/NumberField';
import { correctedModel, decodeModel, type Correction } from './modelResource';
import { ModelPreview, captureThumbnail } from './ModelPreview';

const units = { m: { name: 'Metros', factor: 1 }, cm: { name: 'Centímetros', factor: .01 },
  mm: { name: 'Milímetros', factor: .001 }, in: { name: 'Polegadas', factor: .0254 },
  ft: { name: 'Pés', factor: .3048 } } as const;

const orientationOptions = {
  'y-up': '+Y para cima (glTF)', 'z-up': '+Z para cima', 'z-down': '−Z para cima',
  'x-up': '+X para cima', 'y-down': '−Y para cima', 'x-down': '−X para cima',
} as const;

type Candidate = Awaited<ReturnType<typeof decodeModel>> & {
  entry: string; format: 'glb' | 'gltf'; files: Map<string, Blob>;
};

export function ImportModelDialog({ unit, limitMB, hasRoom, onSave }: {
  unit: Unit; limitMB: number; hasRoom: boolean; onSave: (asset: Asset, place: boolean) => void;
}) {
  const browse = useRef<HTMLInputElement>(null);
  const directory = useRef<HTMLInputElement>(null);
  const previewHost = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const current = useRef<Candidate | undefined>(undefined);
  const [candidate, setCandidate] = useState<Candidate>();
  const [loading, setLoading] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [sourceUnit, setSourceUnit] = useState<keyof typeof units>('m');
  const [orientation, setOrientation] = useState<ModelOrientation>('y-up');
  const [factor, setFactor] = useState(1);
  const [yaw, setYaw] = useState(0);
  const [place, setPlace] = useState(hasRoom);
  const metresPerUnit = units[sourceUnit].factor * factor;
  const correction: Correction = { metresPerUnit, orientation, yaw: yaw * Math.PI / 180 };
  const posed = useMemo(() => {
    if (!candidate) return;
    try { return { model: correctedModel(clone(candidate.scene), { metresPerUnit, orientation, yaw: yaw * Math.PI / 180 }) }; }
    catch (error) { return { error: (error as Error).message }; }
  }, [candidate, metresPerUnit, orientation, yaw]);

  useEffect(() => () => {
    request.current?.abort();
    current.current?.release();
  }, []);

  async function load(files: FileList | null) {
    if (!files?.length) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    current.current?.release();
    current.current = undefined;
    setCandidate(undefined);
    setError('');
    setLoading('A verificar ficheiros e recursos…');
    try {
      const input = await collectModel(Array.from(files), limitMB, controller.signal);
      const prepared = await prepareDocument(input, controller.signal);
      controller.signal.throwIfAborted();
      setLoading('A preparar geometria e texturas…');
      const scene = await decodeModel(prepared, controller.signal);
      if (controller.signal.aborted) { scene.release(); return; }
      const result = { ...scene, entry: input.entry, format: input.format, files: prepared.files };
      current.current = result;
      setCandidate(result);
      setName(input.entry.split('/').at(-1)!.replace(/\.[^.]+$/, ''));
      setSourceUnit('m');
      setOrientation('y-up');
      setFactor(1);
      setYaw(0);
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Não foi possível abrir o modelo.');
    } finally { if (!controller.signal.aborted) setLoading(''); }
  }

  async function save() {
    if (!candidate || !posed?.model || !name.trim() || saving || !request.current) return;
    const signal = request.current.signal;
    setSaving(true);
    setError('');
    const assetId = id();
    const files = [...candidate.files].map(([path, blob], index) => ({ path, key: `${assetId}/${index}`, blob }));
    const thumbnail = captureThumbnail(previewHost.current);
    const asset: Asset = {
      id: assetId, name: name.trim(), kind: 'glb', nativeDimensions: posed.model.layout, thumbnail,
      blobKey: files.find(file => file.path === candidate.entry)!.key,
      model: { ...correction, format: candidate.format, entry: candidate.entry,
        files: files.map(({ path, key }) => ({ path, key })) },
      metadata: { originalFile: candidate.entry, size: files.reduce((total, file) => total + file.blob.size, 0) },
    };
    try {
      await modelBinaries.write(files.map(({ blob, key }) => ({ id: key, blob })));
      if (!signal.aborted) onSave(asset, hasRoom && place);
    } catch {
      if (!signal.aborted) setError('Não foi possível guardar os ficheiros. Verifique o espaço livre neste dispositivo e tente novamente.');
    } finally { if (!signal.aborted) setSaving(false); }
  }

  function onFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    void load(files);
    event.target.value = '';
  }
  const inputOptions = { type: 'file', hidden: true, disabled: saving, onChange: onFiles };
  return <div className="model-import">
    <div className="import-choose">
      {!candidate && <p className="panel-copy">Escolha um GLB único ou um GLTF com os seus ficheiros. Também pode abrir um ZIP com a estrutura original. Limite de {limitMB} MB.</p>}
      <div className="import-buttons">
        <button className="secondary" disabled={saving} onClick={() => browse.current?.click()}><Upload size={17} /> Escolher ficheiros</button>
        <button className="secondary" disabled={saving} onClick={() => directory.current?.click()}><FolderOpen size={17} /> Escolher pasta</button>
      </div>
      <input {...inputOptions} ref={browse} multiple aria-label="Ficheiros GLB, GLTF ou ZIP"
        accept=".glb,.gltf,.zip,.bin,.png,.jpeg,.jpg,.webp" />
      <input {...inputOptions} ref={directory} aria-label="Pasta do modelo GLTF" {...{ webkitdirectory: '' }} />
    </div>
    {loading && <div className="import-placeholder" role="status"><FileArchive size={27} />{loading}</div>}
    {(error || posed?.error) && <p className="dialog-error import-error" role="alert">{error || posed?.error}</p>}
    {candidate && posed && <form className="import-layout" onSubmit={event => { event.preventDefault(); if (!event.currentTarget.querySelector('[aria-invalid="true"]')) void save(); }}>
      <div className="import-visual">
        {posed.model && <ModelPreview scene={posed.model.scene} layout={posed.model.layout} host={previewHost} />}
        {posed.model && <div className="import-dimensions" aria-label="Dimensões medidas do modelo">
          <span>Largura <strong>{measure(posed.model.layout.width, unit)}</strong></span>
          <span>Profundidade <strong>{measure(posed.model.layout.depth, unit)}</strong></span>
          <span>Altura <strong>{measure(posed.model.layout.height, unit)}</strong></span>
        </div>}
      </div>
      <fieldset className="dialog-form properties-lock" disabled={saving}>
        <label>Nome do modelo<input required value={name} onChange={event => setName(event.target.value)} /></label>
        <label>Unidade original<select value={sourceUnit} onChange={event => setSourceUnit(event.target.value as keyof typeof units)}>
          {Object.entries(units).map(([key, item]) => <option value={key} key={key}>{item.name}</option>)}
        </select></label>
        <label>Orientação do modelo<select value={orientation} onChange={event => setOrientation(event.target.value as ModelOrientation)}>
          {Object.entries(orientationOptions).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
        </select></label>
        <NumberField label="Rotação em planta" unit="°" value={yaw} onCommit={value => {
          if (!Number.isFinite(value)) return false;
          setYaw(value % 360); return true;
        }} />
        <NumberField label="Fator de escala" unit="×" value={factor} onCommit={value => {
          if (!(value >= .000001 && value <= 10000)) return false;
          setFactor(value); return true;
        }} />
        {hasRoom && <label className="check-label"><input type="checkbox" checked={place} onChange={event => setPlace(event.target.checked)} /> Colocar na divisão</label>}
        <button className="primary" type="submit" disabled={!posed.model || !name.trim() || saving}>
          {saving ? 'A guardar modelo…' : 'Guardar modelo'}
        </button>
      </fieldset>
    </form>}
  </div>;
}
