import { notFound } from 'next/navigation';
import Link from 'next/link';
import { bySlug, maderas } from '../../../lib/maderas';

export function generateStaticParams(){ return maderas.map(m=>({slug:m.slug})); }

export default async function Ficha({ params }) {
  const { slug } = await params;
  const m = bySlug(slug);
  if (!m) notFound();
  return <main className="detail-page">
    <div className="detail-sample"><div className={`large-wood wood-${maderas.indexOf(m)%6}`}></div><span className="specimen-code">{m.codigo}</span></div>
    <div className="detail-copy">
      <Link href="/catalogo" className="back">← Colección</Link>
      <div className="page-eyebrow">Ficha de especie / {m.codigo}</div>
      <h1>{m.nombre}</h1>
      <p className="detail-latin">{m.botanico}</p>
      <p className="detail-description">{m.descripcion}</p>
      <dl className="facts">
        <div><dt>Origen</dt><dd>{m.origen}</dd></div>
        <div><dt>Color</dt><dd>{m.tono}</dd></div>
        <div><dt>Densidad aprox.</dt><dd>{m.densidad}</dd></div>
        <div><dt>Dureza</dt><dd>{m.dureza}</dd></div>
      </dl>
      <div className="note"><span>Nota de colección</span><p>{m.curiosidad}</p></div>
      <div className="stock-row"><div><strong>{m.stock}</strong><span>piezas disponibles</span></div><div><strong>{m.precio} €</strong><span>precio provisional</span></div></div>
      <button className="button dark disabled">Comprar · próximamente</button>
    </div>
  </main>;
}
