'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

export default function AdminSeries() {
  const [maderas, setMaderas] = useState([]);
  const [piezas, setPiezas] = useState([]);
  const [series, setSeries] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [inventario, setInventario] = useState([]);

  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [seleccionadas, setSeleccionadas] = useState([]);

  const [modoCaja, setModoCaja] = useState('sin_caja');
  const [cajasSeleccionadas, setCajasSeleccionadas] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function cargarDatos() {
    setError(null);

    const [
      maderasRes,
      piezasRes,
      seriesRes,
      cajasRes,
      inventarioRes,
      serieCajasRes
    ] = await Promise.all([
      supabase
        .from('maderas')
        .select('id, xilo_id, nombre, nombre_cientifico')
        .eq('publicada', true)
        .order('xilo_id'),

      supabase
        .from('piezas')
        .select('madera_id')
        .eq('estado', 'disponible'),

      supabase
        .from('productos')
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          activo,
          modo_caja,
          composicion:producto_maderas (
            madera_id,
            cantidad,
            madera:maderas (
              id,
              xilo_id,
              nombre
            )
          )
        `)
        .eq('tipo', 'serie')
        .order('created_at', { ascending: false }),

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

    const algunError =
      maderasRes.error ||
      piezasRes.error ||
      seriesRes.error ||
      cajasRes.error ||
      inventarioRes.error ||
      serieCajasRes.error;

    if (algunError) {
      setError(algunError.message);
      setCargando(false);
      return;
    }

    const relaciones = serieCajasRes.data || [];

    const seriesConCajas = (seriesRes.data || []).map(serie => ({
      ...serie,
      cajas_ids: relaciones
        .filter(r => r.serie_id === serie.id)
        .map(r => r.caja_id)
    }));

    setMaderas(maderasRes.data || []);
    setPiezas(piezasRes.data || []);
    setSeries(seriesConCajas);
    setCajas(cajasRes.data || []);
    setInventario(inventarioRes.data || []);
    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

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
        Math.max(
          0,
          Number(i.stock || 0) - Number(i.reservado || 0)
        )
      ])
    );
  }, [inventario]);

  function limpiarFormulario() {
    setEditandoId(null);
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setSeleccionadas([]);
    setModoCaja('sin_caja');
    setCajasSeleccionadas([]);
  }

  function nuevaSerie() {
    limpiarFormulario();
    setMostrarFormulario(true);
  }

  function editarSerie(serie) {
    setEditandoId(serie.id);
    setNombre(serie.nombre || '');
    setDescripcion(serie.descripcion || '');
    setPrecio(serie.precio ?? '');

    setSeleccionadas(
      (serie.composicion || []).map(item => item.madera_id)
    );

    setModoCaja(serie.modo_caja || 'sin_caja');
    setCajasSeleccionadas(serie.cajas_ids || []);

    setMostrarFormulario(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function cambiarMadera(id) {
    setSeleccionadas(actual =>
      actual.includes(id)
        ? actual.filter(x => x !== id)
        : [...actual, id]
    );
  }

  function cambiarCaja(id) {
    setCajasSeleccionadas(actual =>
      actual.includes(id)
        ? actual.filter(x => x !== id)
        : [...actual, id]
    );
  }

  async function guardarSerie(e) {
    e.preventDefault();

    if (!nombre.trim()) {
      setError('Pon un nombre a la serie.');
      return;
    }

    if (seleccionadas.length === 0) {
      setError('Selecciona al menos una madera.');
      return;
    }

    if (
      modoCaja !== 'sin_caja' &&
      cajasSeleccionadas.length === 0
    ) {
      setError('Selecciona al menos una caja.');
      return;
    }

    setGuardando(true);
    setError(null);

    let serieId = editandoId;

    if (editandoId) {
      const { error } = await supabase
        .from('productos')
        .update({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          precio: precio !== '' ? Number(precio) : null,
          modo_caja: modoCaja,
          updated_at: new Date().toISOString()
        })
        .eq('id', editandoId);

      if (error) {
        setError(error.message);
        setGuardando(false);
        return;
      }

      const { error: borrarMaderasError } = await supabase
        .from('producto_maderas')
        .delete()
        .eq('producto_id', editandoId);

      if (borrarMaderasError) {
        setError(borrarMaderasError.message);
        setGuardando(false);
        return;
      }

      const { error: borrarCajasError } = await supabase
        .from('serie_cajas')
        .delete()
        .eq('serie_id', editandoId);

      if (borrarCajasError) {
        setError(borrarCajasError.message);
        setGuardando(false);
        return;
      }

    } else {
      const { data, error } = await supabase
        .from('productos')
        .insert({
          nombre: nombre.trim(),
          tipo: 'serie',
          descripcion: descripcion.trim() || null,
          precio: precio !== '' ? Number(precio) : null,
          modo_caja: modoCaja,
          activo: true
        })
        .select('id')
        .single();

      if (error) {
        setError(error.message);
        setGuardando(false);
        return;
      }

      serieId = data.id;
    }

    const composicion = seleccionadas.map(maderaId => ({
      producto_id: serieId,
      madera_id: maderaId,
      cantidad: 1
    }));

    const { error: composicionError } = await supabase
      .from('producto_maderas')
      .insert(composicion);

    if (composicionError) {
      setError(composicionError.message);
      setGuardando(false);
      return;
    }

    if (
      modoCaja !== 'sin_caja' &&
      cajasSeleccionadas.length > 0
    ) {
      const relaciones = cajasSeleccionadas.map(cajaId => ({
        serie_id: serieId,
        caja_id: cajaId
      }));

      const { error: cajasError } = await supabase
        .from('serie_cajas')
        .insert(relaciones);

      if (cajasError) {
        setError(cajasError.message);
        setGuardando(false);
        return;
      }
    }

    limpiarFormulario();
    setMostrarFormulario(false);
    setGuardando(false);

    await cargarDatos();
  }

  function stockSerieSinCaja(serie) {
    if (!serie.composicion?.length) return 0;

    return Math.min(
      ...serie.composicion.map(item => {
        const disponibles = stockMaderas[item.madera_id] || 0;
        return Math.floor(
          disponibles / (item.cantidad || 1)
        );
      })
    );
  }

  function stockCaja(cajaId) {
    return stockProductos[cajaId] || 0;
  }

  function stockSerie(serie) {
    const maderaDisponible = stockSerieSinCaja(serie);

    if (serie.modo_caja !== 'obligatoria') {
      return maderaDisponible;
    }

    const cajasPermitidas = serie.cajas_ids || [];

    if (cajasPermitidas.length === 0) {
      return 0;
    }

    const cajasDisponibles = cajasPermitidas.reduce(
      (total, cajaId) => total + stockCaja(cajaId),
      0
    );

    return Math.min(
      maderaDisponible,
      cajasDisponibles
    );
  }

  if (cargando) {
    return (
      <main className="page-shell">
        <h1>Cargando series…</h1>
      </main>
    );
  }

  return (
    <main className="admin-page">

      <aside className="admin-side">
        <div className="brand-mark admin-logo">MDM</div>
        <strong>Administración</strong>

        <nav>
          <Link href="/admin">Inventario</Link>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/admin/series" className="active">
            Series
          </Link>
          <Link href="/admin/pedidos">Pedidos</Link>
          <Link href="/admin/usuarios">Usuarios</Link>
        </nav>

        <Link href="/">← Web pública</Link>
      </aside>

      <section className="admin-main">

        <div className="admin-top">
          <div>
            <div className="page-eyebrow">
              Administración / Productos
            </div>
            <h1>Series</h1>
          </div>

          <button
            className="button dark"
            onClick={nuevaSerie}
          >
            + Nueva serie
          </button>
        </div>

        {mostrarFormulario && (
          <form className="series-form" onSubmit={guardarSerie}>

            <div className="series-form-top">

              <label>
                Nombre
                <input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Serie Mediterráneo"
                />
              </label>

              <label>
                Precio base €
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precio}
                  onChange={e => setPrecio(e.target.value)}
                />
              </label>

            </div>

            <label>
              Descripción
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
              />
            </label>

            <div className="series-selector-head">
              <strong>Maderas de la serie</strong>
              <p>
                {seleccionadas.length} piezas seleccionadas
              </p>
            </div>

            <div className="series-wood-grid">

              {maderas.map(m => {
                const marcada = seleccionadas.includes(m.id);
                const stock = stockMaderas[m.id] || 0;

                return (
                  <label
                    key={m.id}
                    className={`series-wood-option ${
                      marcada ? 'selected' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={marcada}
                      onChange={() => cambiarMadera(m.id)}
                    />

                    <span className="series-wood-number">
                      {String(m.xilo_id).padStart(3, '0')}
                    </span>

                    <span>
                      <strong>{m.nombre}</strong>
                      <em>{m.nombre_cientifico}</em>
                    </span>

                    <span className="series-wood-stock">
                      {stock} disponibles
                    </span>
                  </label>
                );
              })}

            </div>

            <div className="series-box-section">

              <div className="series-selector-head">
                <strong>Presentación</strong>
              </div>

              <div className="series-box-mode">

                <label>
                  <input
                    type="radio"
                    name="modoCaja"
                    value="sin_caja"
                    checked={modoCaja === 'sin_caja'}
                    onChange={() => {
                      setModoCaja('sin_caja');
                      setCajasSeleccionadas([]);
                    }}
                  />
                  Sin caja
                </label>

                <label>
                  <input
                    type="radio"
                    name="modoCaja"
                    value="opcional"
                    checked={modoCaja === 'opcional'}
                    onChange={() => setModoCaja('opcional')}
                  />
                  Caja opcional
                </label>

                <label>
                  <input
                    type="radio"
                    name="modoCaja"
                    value="obligatoria"
                    checked={modoCaja === 'obligatoria'}
                    onChange={() => setModoCaja('obligatoria')}
                  />
                  Caja obligatoria
                </label>

              </div>

              {modoCaja !== 'sin_caja' && (
                <div className="series-box-list">

                  {cajas.map(caja => {
                    const seleccionada =
                      cajasSeleccionadas.includes(caja.id);

                    const stock = stockCaja(caja.id);

                    return (
                      <label
                        key={caja.id}
                        className={`series-box-option ${
                          seleccionada ? 'selected' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={seleccionada}
                          onChange={() => cambiarCaja(caja.id)}
                        />

                        <span>
                          <strong>{caja.nombre}</strong>

                          {caja.capacidad && (
                            <em>
                              Capacidad: {caja.capacidad} piezas
                            </em>
                          )}
                        </span>

                        <span>
                          {stock} disponibles
                        </span>

                        <span>
                          {caja.precio != null
                            ? `${Number(caja.precio).toFixed(2)} €`
                            : '—'}
                        </span>
                      </label>
                    );
                  })}

                </div>
              )}

            </div>

            <div className="new-piece-actions">

              <button
                type="submit"
                className="button dark"
                disabled={guardando}
              >
                {guardando
                  ? 'Guardando…'
                  : editandoId
                    ? 'Guardar cambios'
                    : 'Crear serie'}
              </button>

              <button
                type="button"
                className="button"
                onClick={() => {
                  limpiarFormulario();
                  setMostrarFormulario(false);
                }}
              >
                Cancelar
              </button>

            </div>

          </form>
        )}

        {error && (
          <p className="admin-error">{error}</p>
        )}

        <div className="series-list">

          {series.length === 0 && (
            <div className="series-empty">
              Todavía no has creado ninguna serie.
            </div>
          )}

          {series.map(serie => {

            const disponibles = stockSerie(serie);
            const base = stockSerieSinCaja(serie);

            return (
              <article className="series-card" key={serie.id}>

                <div>

                  <div className="page-eyebrow">
                    {serie.composicion?.length || 0} piezas
                  </div>

                  <h2>{serie.nombre}</h2>

                  {serie.descripcion && (
                    <p>{serie.descripcion}</p>
                  )}

                  <div className="series-species">
                    {(serie.composicion || [])
                      .sort(
                        (a, b) =>
                          a.madera.xilo_id -
                          b.madera.xilo_id
                      )
                      .map(item => (
                        <span key={item.madera_id}>
                          {item.madera.nombre}
                        </span>
                      ))}
                  </div>

                  <div className="series-box-summary">

                    {serie.modo_caja === 'sin_caja' && (
                      <span>Sin caja</span>
                    )}

                    {serie.modo_caja === 'opcional' && (
                      <span>
                        Caja opcional
                      </span>
                    )}

                    {serie.modo_caja === 'obligatoria' && (
                      <span>
                        Caja obligatoria
                      </span>
                    )}

                    {(serie.cajas_ids || []).map(id => {
                      const caja = cajas.find(c => c.id === id);

                      if (!caja) return null;

                      return (
                        <span key={id}>
                          {caja.nombre}: {stockCaja(id)}
                        </span>
                      );
                    })}

                  </div>

                </div>

                <div className="series-card-stats">

                  <div>
                    <span>Precio base</span>
                    <strong>
                      {serie.precio != null
                        ? `${Number(serie.precio).toFixed(2)} €`
                        : '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Sin considerar caja</span>
                    <strong>{base}</strong>
                  </div>

                  <div>
                    <span>Disponibles</span>
                    <strong>{disponibles}</strong>
                  </div>

                  <button
                    type="button"
                    className="button"
                    onClick={() => editarSerie(serie)}
                  >
                    Editar
                  </button>

                </div>

              </article>
            );
          })}

        </div>

      </section>
    </main>
  );
}
