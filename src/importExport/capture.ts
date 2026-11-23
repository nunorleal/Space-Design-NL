const svgNamespace = 'http://www.w3.org/2000/svg';
const styleProperties = [
  'fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width', 'stroke-dasharray',
  'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'paint-order',
  'font-family', 'font-size', 'font-style', 'font-weight', 'letter-spacing',
  'text-anchor', 'dominant-baseline', 'vector-effect',
] as const;

export function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível gerar a imagem PNG.')), 'image/png');
  });
}

export async function planPng(svg: SVGSVGElement) {
  const box = svg.viewBox.baseVal;
  if (!box.width || !box.height) throw new Error('Abra a planta antes de exportar a imagem.');
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', svgNamespace);
  copy.setAttribute('width', String(box.width));
  copy.setAttribute('height', String(box.height));
  const sources = [...svg.querySelectorAll<SVGElement>('*')];
  copy.querySelectorAll<SVGElement>('*').forEach((target, index) => {
    const source = sources[index];
    const computed = getComputedStyle(source);
    for (const property of styleProperties) {
      const value = computed.getPropertyValue(property)
        .replace(/^url\(["']?(?:[^#]*)(#[^)"']*)["']?\)$/, 'url($1)');
      if (value) target.style.setProperty(property, value);
    }
  });
  const background = document.createElementNS(svgNamespace, 'rect');
  background.setAttribute('x', String(box.x));
  background.setAttribute('y', String(box.y));
  background.setAttribute('width', String(box.width));
  background.setAttribute('height', String(box.height));
  background.setAttribute('fill', '#f4f7fc');
  copy.prepend(background);
  const buffer = new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(buffer);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('O navegador não conseguiu preparar a imagem da planta.'));
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    const scale = Math.min(2, 4096 / Math.max(box.width, box.height));
    canvas.width = Math.max(1, Math.round(box.width * scale));
    canvas.height = Math.max(1, Math.round(box.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('O navegador não conseguiu iniciar a exportação PNG.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await canvasPng(canvas);
  } finally { URL.revokeObjectURL(url); }
}

export function downloadFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Safari can consume the Blob URL after the click event returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
