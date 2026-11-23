import { useState } from 'react';
import { Archive, Armchair, BedDouble, Bike, Box, CarFront, Grid3X3, LayoutGrid, Plus, Refrigerator, Settings2, Star, Table2, Upload, Warehouse } from 'lucide-react';
import { assetTemplate, catalog, type Template } from '../domain/catalog';
import { id, type Asset, type Project } from '../domain/model';
import { fromMetres, measure, parseNumber, toMetres } from '../domain/units';
import type { Edit } from './store';

const icons = { box: Box, shelf: Grid3X3, cabinet: Archive, table: Table2, bench: Warehouse,
  sofa: Armchair, bed: BedDouble, ledge: LayoutGrid, appliance: Refrigerator, car: CarFront, motorcycle: Bike };
const searchText = (value: string) => value.trim().toLocaleLowerCase('pt-PT').normalize('NFD').replace(/\p{Diacritic}/gu, '');

export function CatalogDialog({ project, edit, onAdd, onImport }: {
  project: Project; edit: (edit: Edit) => void; onAdd: (template: Template) => void; onImport: () => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [manage, setManage] = useState<Asset>();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const unit = project.settings.unit;
  const favorites = project.settings.favorites ?? [];
  const all: Template[] = [...catalog, ...project.assets.filter(asset => !catalog.some(item => item.asset.id === asset.id))
    .map(assetTemplate)];
  const matching = all.filter(template => (!category || category === template.category) &&
    (!onlyFavorites || favorites.includes(template.asset.id)) && searchText(`${template.name} ${template.category}`).includes(searchText(query)));
  const inUse = manage && project.rooms.some(room => room.objects.some(object => object.assetId === manage.id));
  const builtIn = manage && catalog.some(template => template.asset.id === manage.id);
  const dimensionLabels = { width: 'Largura', depth: 'Profundidade', height: 'Altura' } as const;

  function store(template: Asset) {
    edit(project => ({
      ...project, assets: project.assets.some(asset => asset.id === template.id) ?
        project.assets.map(asset => asset.id === template.id ? template : asset) : [...project.assets, template],
    }));
    setCreating(false);
    setManage(undefined);
    setError('');
  }

  if (creating || manage) return <>
    <button className="back-button" onClick={() => { setCreating(false); setManage(undefined); setError(''); }}>Voltar à biblioteca</button>
    <form className="dialog-form" onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const name = String(data.get('name')).trim();
      const value = (key: string) => toMetres(parseNumber(String(data.get(key))), unit);
      const nativeDimensions = creating ? { width: value('width'), depth: value('depth'), height: value('height') } : manage!.nativeDimensions;
      if (!name || Object.values(nativeDimensions).some(value => !Number.isFinite(value) || value < .001)) {
        setError('Introduza um nome e medidas válidas de pelo menos 1 mm.');
        return;
      }
      store(creating ? { id: id(), kind: 'parametric', name, nativeDimensions, metadata: { shape: 'box' } } : { ...manage!, name });
    }}>
      {creating || !builtIn ? <>
        <label>Nome do modelo<input name="name" defaultValue={manage?.name ?? ''} required /></label>
        {creating && Object.entries(dimensionLabels).map(([key, label]) => <label key={key}>{label} ({unit})
          <input name={key} inputMode="decimal" defaultValue={fromMetres(.5, unit)} required />
        </label>)}
        {error && <p className="dialog-error" role="alert">{error}</p>}
        <button className="primary" type="submit">{creating ? 'Guardar novo modelo' : 'Guardar nome do modelo'}</button>
      </> : <strong>{manage!.name}</strong>}
    </form>
    {manage && <>
      <button className="secondary wide" onClick={() => store({ ...manage, id: id(), name: `${manage.name} — cópia` })}>Duplicar modelo</button>
      {!builtIn && <button className="secondary wide danger" disabled={inUse} onClick={() => {
        edit(project => ({ ...project, assets: project.assets.filter(asset => asset.id !== manage.id),
          settings: { ...project.settings, favorites: (project.settings.favorites ?? []).filter(assetId => assetId !== manage.id) } }));
        setManage(undefined);
      }}>Eliminar modelo</button>}
      {inUse && !builtIn && <p className="panel-copy">Este modelo está a ser usado por objetos do projeto.</p>}
    </>}
  </>;

  return <>
    <label className="text-field">Pesquisar objetos<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <div className="catalog-filters">
      <label className="text-field">Categoria<select value={category} onChange={event => setCategory(event.target.value)}>
        <option value="">Todas</option>{[...new Set(all.map(item => item.category))].map(item => <option key={item}>{item}</option>)}
      </select></label>
      <label className="object-check"><input type="checkbox" checked={onlyFavorites} onChange={event => setOnlyFavorites(event.target.checked)} /> Favoritos</label>
    </div>
    <div className="catalog-buttons">
      <button className="secondary" onClick={() => setCreating(true)}><Plus size={16} /> Novo modelo de caixa</button>
      <button className="secondary" onClick={onImport}><Upload size={16} /> Importar GLB/GLTF</button>
    </div>
    <div className="catalog-list catalog-manage">
      {matching.map(template => {
        const Icon = icons[template.shape];
        const { width, depth, height } = template.asset.nativeDimensions;
        const favorite = favorites.includes(template.asset.id);
        return <div className="catalog-row" key={template.asset.id}>
          <button className="catalog-item" onClick={() => onAdd(template)}>
            <span className="catalog-thumb" style={{ backgroundColor: template.color + '36' }}>
              {template.asset.thumbnail && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(template.asset.thumbnail) ?
                <img src={template.asset.thumbnail} alt="" /> : <Icon size={20} />}
            </span>
            <span><strong>{template.name}</strong><small>{template.category} · {[width, depth, height].map(value => measure(value, unit)).join(' × ')}</small></span>
          </button>
          <button className="icon-button" aria-pressed={favorite} aria-label={`Favorito: ${template.name}`} title="Favorito" onClick={() => edit(project => ({
            ...project, settings: { ...project.settings, favorites: favorite ? favorites.filter(id => id !== template.asset.id) : [...favorites, template.asset.id] },
          }))}><Star size={15} fill={favorite ? 'currentColor' : 'none'} /></button>
          <button className="icon-button" aria-label={`Gerir modelo: ${template.name}`} title="Gerir modelo" onClick={() => setManage(template.asset)}><Settings2 size={16} /></button>
        </div>;
      })}
      {!matching.length && <p className="panel-copy">Nenhum objeto corresponde à pesquisa.</p>}
    </div>
  </>;
}
