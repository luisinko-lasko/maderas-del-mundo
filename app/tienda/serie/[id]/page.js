'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabase';
import { añadirAlCarrito } from '../../../../lib/carrito';

export default function SerieDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [serie, setSerie] = useState(null);
  const [piezas, setPiezas] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [cajaElegida, setCajaElegida] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function cargar() {
      const [serieRes, piezasRes, relacionesRes, inventarioRes] = await Promise.all([
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
          .eq('id', id)
          .eq('tipo', 'serie')
          .eq('activo', true)
          .single(),

        supabase
          .from('piezas')
          .select('madera_id')
          .eq('estado', 'disponible'),

        supabase
          .from('serie_cajas')
          .select(`
            caja_id,
            caja:productos!serie_cajas_caja_id_fkey (
              id,
              nombre,
              capacidad,
              precio
            )
          `)
          .eq('serie_id', id),

        supabase
          .from('inventario_productos')
          .select('producto_id, stock, reservado')
      ]);

      const fallo =
        serieRes.error ||
        piezasRes.error ||
        relacionesRes.error ||
        inventarioRes.error;

      if (fallo) {
        setError(fallo.message);
        setCargando(false);
        return;
      }

      const serieCargada = serieRes.data;
      const composicion = serieCargada?.composicion || [];

      if (!composicion.length || composicion.some(item => !item.madera)) {
        setError('Esta serie no está disponible actualmente.');
        setSerie(null);
        setCargando(false);
        return;
      }

      setSerie(serieCargada);
      setPiezas(piezasRes.data || []);
      setCajas(
        (relacionesRes.data || [])
          .map(r => r.caja)
          .filter(Boolean)
      );
      setInventario(inventarioRes.data || []);
      setCargando(false);
    }

    cargar();
  }, [id]);

  const stockMaderas = useMemo(() => {
    const mapa = {};

    piezas.forEach(p => {
      mapa[p.madera_id] = (mapa[p.madera_id] || 0) + 1;
    });

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

  function stockSerieSinCaja() {
    if (!serie?.composicion?.length) return 0;

    return Math.min(
      ...serie.composicion.map(item => {
        const stock = stockMaderas[item.madera_id] || 0;
        return Math.floor(stock / (item.cantidad || 1));
      })
    );
  }

  const cajaSeleccionada = cajas.find(c => c.id === cajaElegida) || null;

  const precioBase = serie?.precio != null ? Number(serie.precio) : 0;
  const precioCaja = cajaSeleccionada?.precio != null ? Number(cajaSeleccionada.precio) : 0;
  const precioTotal = precioBase + precioCaja;

  if (cargando) {
    return (
      <main className="page-shell">
        <h1>Cargando serie…</h1>
      </main>
    );
  }

  if (error || !serie) {
    return (
      <main className="page-shell">
        <Link href="/tienda">← Tienda</Link>
        <h1>Serie no disponible</h1>
        {error && <p>{error}</p>}
      </main>
    );
  }

  const disponibles = stockSerieSinCaja();

  return (
    <main className="serie-detail-page">
      <div className="serie-detail-back">
        <Link href="/tienda">← Tienda</Link>
      </div>

      <header className="serie-detail-header">
        <div>
          <div className="page-eyebrow">
            Serie · {serie.composicion?.length || 0} maderas
          </div>
          <h1>{serie.nombre}</h1>
          {serie.descripcion && <p>{serie.descripcion}</p>}
        </div>

        <div className="serie-detail-price">
          <span>Precio</span>
          <strong>{precioTotal.toFixed(2)} €</strong>
          <small>{disponibles} disponibles</small>
        </div>
      </header>

      <section className="serie-detail-section">
        <div className="page-eyebrow">Composición</div>

        <div className="serie-detail-woods">
          {[...(serie.composicion || [])]
            .sort((a, b) => a.madera.xilo_id - b.madera.xilo_id)
            .map(item => (
              <article key={item.madera_id} className="serie-detail-wood">
                <span>
                  {String(item.madera.xilo_id).padStart(3, '0')}
                </span>

                <div>
                  <strong>{item.madera.nombre}</strong>
                  <em>{item.madera.nombre_cientifico}</em>
                </div>

                <small>
                  {stockMaderas[item.madera_id] || 0} disp.
                </small>
              </article>
            ))}
        </div>
      </section>

      {serie.modo_caja !== 'sin_caja' && (
        <section className="serie-detail-section">
          <div className="page-eyebrow">Caja</div>

          <h2>
            {serie.modo_caja === 'obligatoria'
              ? 'Elige una caja'
              : 'Añade una caja si quieres'}
          </h2>

          {serie.modo_caja === 'opcional' && (
            <label className="serie-box-choice">
              <input
                type="radio"
                name="caja"
                checked={!cajaElegida}
                onChange={() => setCajaElegida(null)}
              />

              <span>
                <strong>Sin caja</strong>
                <em>0,00 €</em>
              </span>
            </label>
          )}

          <div className="serie-detail-boxes">
            {cajas.map(caja => {
              const stock = stockProductos[caja.id] || 0;
              const agotada = stock === 0;

              return (
                <label
                  key={caja.id}
                  className={`serie-box-choice ${agotada ? 'disabled' : ''}`}
                >
                  <input
                    type="radio"
                    name="caja"
                    disabled={agotada}
                    checked={cajaElegida === caja.id}
                    onChange={() => setCajaElegida(caja.id)}
                  />

                  <span>
                    <strong>{caja.nombre}</strong>
                    {caja.capacidad && <em>{caja.capacidad} piezas</em>}
                  </span>

                  <span>{stock} disponibles</span>

                  <strong>
                    {caja.precio != null
                      ? `+${Number(caja.precio).toFixed(2)} €`
                      : '0,00 €'}
                  </strong>
                </label>
              );
            })}
          </div>
        </section>
      )}

      <section className="serie-detail-total">
        <div>
          <span>Total</span>
          <strong>{precioTotal.toFixed(2)} €</strong>
        </div>

        <button
          className="button dark"
          disabled={
            disponibles === 0 ||
            (serie.modo_caja === 'obligatoria' && !cajaElegida)
          }
          onClick={() => {
            añadirAlCarrito({
              clave: `serie-${serie.id}-caja-${cajaSeleccionada?.id || 'sin'}`,
              tipo: 'serie',
              id: serie.id,
              nombre: serie.nombre,
              precio_base: precioBase,
              precio: precioTotal,
              caja_id: cajaSeleccionada?.id || null,
              caja: cajaSeleccionada
                ? {
                    id: cajaSeleccionada.id,
                    nombre: cajaSeleccionada.nombre,
                    precio: precioCaja
                  }
                : null,
              numero_maderas: serie.composicion?.length || 0
            });

            router.push('/carrito');
          }}
        >
          Añadir al carrito
        </button>
      </section>
    </main>
  );
}
