import Link from 'next/link';
import WoodTile from '../components/WoodTile';
import { maderas } from '../lib/maderas';

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-kicker">Colección · materia · memoria</div>
        <h1>El mundo,<br/>pieza a pieza.</h1>
        <p className="hero-intro">Una colección de maderas auténticas para mirar, tocar, comparar y conservar. Cada especie es una historia material.</p>
        <div className="hero-actions">
          <Link href="/catalogo" className="button dark">Explorar la colección</Link>
          <Link href="/about" className="text-link">Conocer el proyecto →</Link>
        </div>
        <div className="hero-object" aria-hidden="true">
          <div className="sample-stack s1"></div><div className="sample-stack s2"></div><div className="sample-stack s3"></div><div className="sample-stack s4"></div>
        </div>
      </section>

      <section className="manifesto">
        <div className="section-number">01</div>
        <h2>No es un muestrario.<br/>Es una colección.</h2>
        <p>Cada pieza está pensada como un objeto individual: identificada, catalogada y conectada con una ficha digital que acompaña a la madera física.</p>
      </section>

      <section className="featured-section">
        <div className="section-heading"><span>Selección inicial</span><Link href="/catalogo">Ver todas →</Link></div>
        <div className="wood-grid">
          {maderas.filter(m => m.featured).map((m, i) => <WoodTile madera={m} index={i} key={m.slug}/>) }
        </div>
      </section>

      <section className="digital-section">
        <div className="digital-title">Tu colección también vive online.</div>
        <div className="digital-grid">
          <div><span className="big-stat">24</span><span className="small-label">especies reunidas</span></div>
          <div><span className="big-stat">38%</span><span className="small-label">de una serie de ejemplo</span></div>
          <div className="digital-copy">Cada usuario podrá consultar sus piezas, descubrir las que le faltan y acceder directamente a la ficha de cada madera.</div>
        </div>
        <Link href="/coleccion" className="button light">Ver ejemplo de Mi colección</Link>
      </section>
    </main>
  );
}
