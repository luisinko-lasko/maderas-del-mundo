import Link from 'next/link';

export default function WoodTile({ madera, index = 0 }) {
  return (
    <Link href={`/catalogo/${madera.slug}`} className={`wood-card wood-${index % 6}`}>
      <div className="wood-sample" aria-hidden="true"><span>{madera.codigo}</span></div>
      <div className="wood-card-copy">
        <div>
          <h3>{madera.nombre}</h3>
          <p className="latin">{madera.botanico}</p>
        </div>
        <span className="arrow">↗</span>
      </div>
    </Link>
  );
}
