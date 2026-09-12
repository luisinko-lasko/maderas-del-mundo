'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import styles from './coleccion.module.css';

export default function Coleccion() {
  const [user, setUser] = useState(null);
  const [maderas, setMaderas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [criterioOrden, setCriterioOrden] = useState('fecha');
  const [direccionOrden, setDireccionOrden] = useState('desc');

  useEffect(() => {
    async function cargarColeccion() {
      const { data: authData } = await supabase.auth.getUser();
      const usuario = authData.user || null;

      setUser(usuario);

      if (!usuario) {
        setCargando(false);
        return;
      }

      const { data, error } = await supabase
        .from('coleccion_usuario')
        .select(`
          id,
          fecha_adquisicion,
          origen,
          madera:maderas (
            id,
            xilo_id,
            nombre,
            nombre_cientifico,
            densidad_seco_15,
            janka_lbf,
            slug,
            imagen_url
          )
        `)
        .eq('user_id', usuario.id)
        .order('fecha_adquisicion', { ascending: false });

      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setMaderas(data || []);
      }

      setCargando(false);
    }

    cargarColeccion();
  }, []);

  const maderasOrdenadas = useMemo(() => {
    const copia = [...maderas];
    const factor = direccionOrden === 'asc' ? 1 : -1;

    copia.sort((a, b) => {
      const maderaA = a.madera || {};
      const maderaB = b.madera || {};
      let resultado = 0;

      if (criterioOrden === 'fecha') {
        const fechaA = a.fecha_adquisicion
          ? new Date(a.fecha_adquisicion).getTime()
          : 0;
        const fechaB = b.fecha_adquisicion
          ? new Date(b.fecha_adquisicion).getTime()
          : 0;
        resultado = fechaA - fechaB;
      } else if (criterioOrden === 'xilo') {
        const xiloA = Number(maderaA.xilo_id);
        const xiloB = Number(maderaB.xilo_id);
        resultado =
          (Number.isFinite(xiloA) ? xiloA : Number.MAX_SAFE_INTEGER) -
          (Number.isFinite(xiloB) ? xiloB : Number.MAX_SAFE_INTEGER);
      } else if (criterioOrden === 'densidad') {
        const densidadA = Number(maderaA.densidad_seco_15);
        const densidadB = Number(maderaB.densidad_seco_15);
        resultado =
          (Number.isFinite(densidadA) ? densidadA : Number.MAX_SAFE_INTEGER) -
          (Number.isFinite(densidadB) ? densidadB : Number.MAX_SAFE_INTEGER);
      } else if (criterioOrden === 'dureza') {
        const durezaA = Number(maderaA.janka_lbf);
        const durezaB = Number(maderaB.janka_lbf);
        resultado =
          (Number.isFinite(durezaA) ? durezaA : Number.MAX_SAFE_INTEGER) -
          (Number.isFinite(durezaB) ? durezaB : Number.MAX_SAFE_INTEGER);
      } else if (criterioOrden === 'cientifico') {
        resultado = String(maderaA.nombre_cientifico || '').localeCompare(
          String(maderaB.nombre_cientifico || ''),
          'es',
          { sensitivity: 'base' }
        );
      } else {
        resultado = String(maderaA.nombre || '').localeCompare(
          String(maderaB.nombre || ''),
          'es',
          { sensitivity: 'base' }
        );
      }

      return resultado * factor;
    });

    return copia;
  }, [maderas, criterioOrden, direccionOrden]);

  function cambiarCriterio(event) {
    const nuevoCriterio = event.target.value;
    setCriterioOrden(nuevoCriterio);
    setDireccionOrden(nuevoCriterio === 'fecha' ? 'desc' : 'asc');
  }

  const esOrdenNumerico = ['xilo', 'densidad', 'dureza'].includes(criterioOrden);

  const opcionesDireccion =
    criterioOrden === 'fecha'
      ? [
          ['desc', 'Más recientes primero'],
          ['asc', 'Más antiguas primero']
        ]
      : esOrdenNumerico
        ? [
            ['asc', 'Menor a mayor'],
            ['desc', 'Mayor a menor']
          ]
        : [
            ['asc', 'A → Z'],
            ['desc', 'Z → A']
          ];

  if (cargando) {
    return (
      <main className="page-shell">
        <div className="page-eyebrow">Área personal</div>
        <h1>Cargando colección…</h1>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page-shell">
        <div className="page-eyebrow">Área personal</div>
        <h1>Mi colección</h1>
        <p>Inicia sesión para ver las maderas que forman parte de tu colección.</p>
        <Link href="/login" className="login-button">
          Iniciar sesión
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell">
        <div className="page-eyebrow">Área personal</div>
        <h1>Mi colección</h1>
        <p>No se pudo cargar la colección.</p>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="page-shell dashboard">
      <div className="dashboard-head">
        <div>
          <div className="page-eyebrow">Área personal</div>
          <h1>Mi colección</h1>
        </div>

        <div className="user-chip">
          {user.email?.slice(0, 2).toUpperCase()}
        </div>
      </div>

      <div className="summary-cards">
        <div>
          <strong>{maderas.length}</strong>
          <span>{maderas.length === 1 ? 'madera' : 'maderas'}</span>
        </div>
      </div>

      {maderas.length > 1 && (
        <div className={styles.sortBar}>
          <div className={styles.sortField}>
            <label htmlFor="criterio-orden">Ordenar por</label>
            <select
              id="criterio-orden"
              value={criterioOrden}
              onChange={cambiarCriterio}
            >
              <option value="fecha">Fecha de incorporación</option>
              <option value="xilo">Nº Xilo</option>
              <option value="nombre">Nombre</option>
              <option value="cientifico">Nombre científico</option>
              <option value="densidad">Densidad</option>
              <option value="dureza">Dureza (Janka)</option>
            </select>
          </div>

          <div className={styles.sortField}>
            <label htmlFor="direccion-orden">Orden</label>
            <select
              id="direccion-orden"
              value={direccionOrden}
              onChange={(event) => setDireccionOrden(event.target.value)}
            >
              {opcionesDireccion.map(([valor, etiqueta]) => (
                <option value={valor} key={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {maderas.length === 0 ? (
        <div className="collection-empty">
          <h2>Tu colección está vacía</h2>
          <p>Las maderas que compres o registres aparecerán aquí.</p>
          <Link href="/catalogo">Explorar catálogo →</Link>
        </div>
      ) : (
        <div className="collection-list">
          {maderasOrdenadas.map((item) => {
            const m = item.madera;

            if (!m) return null;

            return (
              <Link
                href={`/catalogo/${m.slug}`}
                className="collection-row"
                key={item.id}
              >
                <span className="mini-sample">
                  {m.imagen_url && (
                    <img
                      src={m.imagen_url}
                      alt={`Madera de ${m.nombre}`}
                      className="wood-photo"
                    />
                  )}
                </span>

                <div>
                  <strong>{m.nombre}</strong>
                  <em>{m.nombre_cientifico}</em>
                </div>

                <span>#{String(m.xilo_id).padStart(3, '0')}</span>

                <span className="owned">
                  En colección ✓
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="add-code">
        <div>
          <span>Añadir una pieza física</span>
          <h2>¿Has comprado una pieza en persona?</h2>
          <p>
            Próximamente podrás escanear el código QR de una pieza y añadirla
            automáticamente a tu colección.
          </p>
        </div>

        <div className="fake-input">
          MDM-____ <button disabled>Validar</button>
        </div>
      </div>
    </main>
  );
}
