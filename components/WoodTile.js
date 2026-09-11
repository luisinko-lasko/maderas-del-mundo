import Link from 'next/link';

export default function WoodTile({ madera }) {
  const tieneFoto = Boolean(madera.imagenUrl);
  const necesitaRecorte =
    tieneFoto &&
    (/Xyloth|Collection_de_bois|Cirad/i.test(madera.imagenUrl) || madera.xiloId === 4);

  return (
    <Link href={`/catalogo/${madera.slug}`} className="wood-card">
      <div className={`wood-sample ${tieneFoto ? 'has-photo' : ''}`}>
        {tieneFoto && (
          <img
            src={madera.imagenUrl}
            alt={`Madera de ${madera.nombre}`}
            className="wood-photo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              transform: necesitaRecorte ? 'scale(1.34)' : 'none',
              transformOrigin: 'center center',
            }}
          />
        )}

        <span>{String(madera.xiloId).padStart(3, '0')}</span>
      </div>

      <div className="wood-card-copy">
        <div>
          <h3>{madera.nombre}</h3>

          <p className="latin">{madera.nombreCientifico}</p>

          <div className="wood-card-data">
            <span>
              Densidad · {madera.densidad ? `${madera.densidad} kg/m³` : '—'}
            </span>

            <span>
              Janka · {madera.janka ? `${madera.janka} lbf` : '—'}
            </span>
          </div>

          <p
            className={`stock-label ${
              madera.stock > 0 ? 'in-stock' : 'out-stock'
            }`}
          >
            {madera.stock > 0
              ? `${madera.stock} ${
                  madera.stock === 1 ? 'pieza disponible' : 'piezas disponibles'
                }`
              : 'Sin stock'}
          </p>
        </div>

        <span className="arrow">↗</span>
      </div>
    </Link>
  );
}
