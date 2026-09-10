'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function Coleccion() {
  const [user, setUser] = useState(null);
  const [maderas, setMaderas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

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

      {maderas.length === 0 ? (
        <div className="collection-empty">
          <h2>Tu colección está vacía</h2>
          <p>Las maderas que compres o registres aparecerán aquí.</p>
          <Link href="/catalogo">Explorar catálogo →</Link>
        </div>
      ) : (
        <div className="collection-list">
          {maderas.map((item) => {
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
