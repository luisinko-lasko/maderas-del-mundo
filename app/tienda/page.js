'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function TiendaPage() {
  const [series, setSeries] = useState([]);
  const [maderas, setMaderas] = useState([]);
  const [piezas, setPiezas] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [relaciones, setRelaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      const [seriesRes, maderasRes, piezasRes, cajasRes, inventarioRes, relacionesRes] =
        await Promise.all([
          supabase
            .from('productos')
            .select(`
              id,
              nombre,
              descripcion,
              precio,
              modo_caja,
              composicion:producto_maderas (
                madera_id,
                cantidad,
                madera:maderas (
                  id,
                  xilo_id,
                  nombre,
                  nombre_cientifico,
                  imagen_url
                )
              )
            `)
            .eq('tipo', 'serie')
            .eq('activo', true)
            .order('nombre'),

          supabase
            .from('maderas')
            .select('id, xilo_id, nombre, nombre_cientifico, imagen_url, precio, slug')
            .eq('publicada', true)
            .order('xilo_id'),

          supabase
            .from('piezas')
            .select('madera_id')
            .eq('estado', 'disponible'),

          supabase
            .from('productos')
            .select('id, nombre, capacidad, precio')
            .eq('tipo', 'caja')
            .eq('activo', true)
            .order('nombre'),

          supabase
            .from('inventario_productos')
            .select('producto_id, stock, reservado'),

          supabase
            .from('serie_cajas')
            .select('serie_id, caja_id')
        ]);

      const fallo =
        seriesRes.error ||
        maderasRes.error ||
        piezasRes.error ||
        cajasRes.error ||
        inventarioRes.error ||
        relacionesRes.error;

      if (fallo) {
        setError(fallo.message);
        setCargando(false);
        return;
      }

      setSeries(seriesRes.data || []);
      setMaderas(maderasRes.data || []);
      setPiezas(piezasRes.data || []);
      setCajas(cajasRes.data || []);
      setInventario(inventarioRes.data || []);
      setRelaciones(relacionesRes.data || []);
      setCargando(false);
    }

    cargar();
  }, []);

  const seriesPublicas = useMemo(() => {
    return series.filter(serie => {
      const composicion = serie.composicion || [];
      return composicion.length > 0 && composicion.every(item => item.madera);
    });
  }, [series]);

  const stockMaderas = useMemo(() => {
    const mapa = {};

    for (const pieza of piezas) {
      mapa[pieza.madera_id] = (mapa[pieza.madera_id] || 0) + 1;
    }

    return mapa;
  }, [piezas]);

  const stockProductos = useMemo(() => {
    return Object.fromEntries(
      inventario.map(i => [
        i.producto_id,
        Math.max(0, Number(i.stock || 0) - Number(i.reservado || 0))
      ])
    );
  }, [inventario]);

  function cajasDeSerie(serieId) {
    const ids = relaciones
      .filter(r => r.serie_id === serieId)
      .map(r => r.caja_id);

    return cajas.filter(caja => ids.includes(caja.id));
  }

  function disponibilidadMaderas(serie) {
    if (!serie.composicion?.length) return 0;

    return Math.min(
      ...serie.composicion.map(item => {
        const disponibles = stockMaderas[item.madera_id] || 0;
        return Math.floor(disponibles / (item.cantidad || 1));
      })
    );
  }

  function disponibilidadSerie(serie) {
    const porMaderas = disponibilidadMaderas(serie);

    if (serie.modo_caja !== 'obligatoria') {
      return porMaderas;
    }

    const cajasDisponibles = cajasDeSerie(serie.id).reduce(
      (total, caja) => total + (stockProductos[caja.id] || 0),
      0
    );

    return Math.min(porMaderas, cajasDisponibles);
  }

  if (cargando) {
    return (
      <main className="page-shell">
        <div className="page-eyebrow">Maderas del mundo / Tienda</div>
        <h1>Cargando tienda…</h1>
      </main>
    );
  }

  return (
    <main className="shop-page">

      <section className="shop-intro">
        <div className="page-eyebrow">
          Maderas del mundo / Tienda
        </div>

        <h1>Tienda</h1>

        <p>
          Selecciones de maderas para comenzar, ampliar
          o regalar una colección.
        </p>
      </section>

      {error && (
        <div className="shop-error">
          Error: {error}
        </div>
      )}

      {!error && seriesPublicas.length === 0 && (
        <div className="shop-empty">
          Todavía no hay Series disponibles.
        </div>
      )}

      {!error && (
        <>
          <section className="shop-individual-section">

            <div className="shop-section-heading">
              <div>
                <div className="page-eyebrow">
                  Piezas individuales
                </div>
                <h2>Piezas</h2>
              </div>

              <p>
                Cada madera puede adquirirse individualmente
                mientras haya piezas disponibles.
              </p>
            </div>

            <div className="shop-individual-grid">

              {maderas
                .filter(m => (stockMaderas[m.id] || 0) > 0)
                .map(madera => {

                  const stock = stockMaderas[madera.id] || 0;

                  return (
                    <a
                      href={`/tienda/madera/${madera.slug}`}
                      className="shop-individual-card"
                      key={madera.id}
                    >
                      <div className="shop-individual-image">
                        {madera.imagen_url ? (
                          <img
                            src={madera.imagen_url}
                            alt={madera.nombre}
                          />
                        ) : (
                          <div className="shop-individual-placeholder" />
                        )}
                      </div>

                      <div className="shop-individual-info">
                        <span className="page-eyebrow">
                          #{String(madera.xilo_id).padStart(3, '0')}
                        </span>

                        <h3>{madera.nombre}</h3>

                        <em>{madera.nombre_cientifico}</em>

                        <div className="shop-individual-bottom">
                          <strong>
                            {madera.precio != null
                              ? `${Number(madera.precio).toFixed(2)} €`
                              : 'Precio pendiente'}
                          </strong>

                          <span>
                            {stock} {stock === 1 ? 'disponible' : 'disponibles'}
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                })}

            </div>

          </section>

          <section className="shop-series-section">

            <div className="shop-section-heading">
              <div>
                <div className="page-eyebrow">
                  Selecciones
                </div>
                <h2>Series</h2>
              </div>
            </div>

            <div className="shop-series-grid">

          {seriesPublicas.map(serie => {
            const disponibles = disponibilidadSerie(serie);
            const cajasSerie = cajasDeSerie(serie.id);
            const agotada = disponibles === 0;

            return (
              <article className="shop-series-card" key={serie.id}>

                <div className="shop-series-number">
                  {String(serie.composicion?.length || 0).padStart(2, '0')}
                </div>

                <div className="shop-series-content">

                  <div className="page-eyebrow">
                    Serie · {serie.composicion?.length || 0} maderas
                  </div>

                  <h2>{serie.nombre}</h2>

                  {serie.descripcion && (
                    <p className="shop-series-description">
                      {serie.descripcion}
                    </p>
                  )}

                  <div className="shop-series-woods">
                    {[...(serie.composicion || [])]
                      .sort((a, b) =>
                        a.madera.xilo_id - b.madera.xilo_id
                      )
                      .map(item => (
                        <span key={item.madera_id}>
                          {item.madera.nombre}
                        </span>
                      ))}
                  </div>

                  <div className="shop-series-presentation">

                    {serie.modo_caja === 'sin_caja' && (
                      <span>Sin caja</span>
                    )}

                    {serie.modo_caja === 'opcional' && (
                      <span>Caja opcional</span>
                    )}

                    {serie.modo_caja === 'obligatoria' && (
                      <span>Caja obligatoria</span>
                    )}

                    {cajasSerie.map(caja => (
                      <span key={caja.id}>
                        {caja.nombre} · {stockProductos[caja.id] || 0} disp.
                      </span>
                    ))}

                  </div>

                </div>

                <div className="shop-series-buy">

                  <span className="shop-price-label">
                    {serie.modo_caja === 'obligatoria' ? 'Desde' : 'Precio'}
                  </span>

                  <strong className="shop-price">
                    {serie.precio != null
                      ? `${Number(serie.precio).toFixed(2)} €`
                      : '—'}
                  </strong>

                  <span className={agotada ? 'shop-stock soldout' : 'shop-stock'}>
                    {agotada
                      ? 'Agotada'
                      : `${disponibles} disponibles`}
                  </span>

                  <a
                    className={`button dark ${agotada ? 'disabled' : ''}`}
                    href={agotada ? undefined : `/tienda/serie/${serie.id}`}
                  >
                    Comprar serie
                  </a>

                </div>

              </article>
            );
          })}

            </div>
          </section>
        </>
      )}

    </main>
  );
}
