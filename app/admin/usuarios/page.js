'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { supabase } from '../../../lib/supabase';


export default function AdminUsuarios() {

  const router = useRouter();

  const [usuarios, setUsuarios] = useState([]);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState(null);


  useEffect(() => {

    let activo = true;


    async function cargar() {

      setCargando(true);
      setError(null);


      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();


      if (!activo) return;


      if (userError || !user) {

        router.replace('/login');

        return;

      }


      const { data: esAdmin, error: adminError } =
        await supabase.rpc('es_admin');


      if (!activo) return;


      if (adminError || esAdmin !== true) {

        router.replace('/');

        return;

      }


      const { data, error: usuariosError } =
        await supabase.rpc('admin_listar_usuarios');


      if (!activo) return;


      if (usuariosError) {

        setError(usuariosError.message);

      } else {

        setUsuarios(data || []);

      }


      setCargando(false);

    }


    cargar();


    return () => {

      activo = false;

    };

  }, [router]);


  function formatearFecha(fecha) {

    if (!fecha) return '';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(fecha));

  }


  function formatearPrecio(valor) {

    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(valor || 0));

  }


  if (cargando) {

    return (

      <main className="page-shell">

        <h1>Cargando usuarios…</h1>

      </main>

    );

  }


  return (

    <main className="admin-page">

      <aside className="admin-side">

        <div className="brand-mark admin-logo">
          MDM
        </div>

        <strong>Administración</strong>

        <nav>

          <Link href="/admin">
            Inventario
          </Link>

          <Link href="/catalogo">Catálogo</Link>

          <Link href="/admin/series">
            Series
          </Link>

          <Link href="/admin/pedidos">Pedidos</Link>

          <Link
            href="/admin/usuarios"
            className="active"
          >
            Usuarios
          </Link>

        </nav>

        <Link href="/">
          ← Web pública
        </Link>

      </aside>


      <section className="admin-main">

        <div className="admin-top">

          <div>

            <div className="page-eyebrow">
              Administración / Usuarios
            </div>

            <h1>Usuarios</h1>

          </div>

        </div>


        {error && (

          <p className="admin-error">
            {error}
          </p>

        )}


        <div className="admin-stats">

          <div>

            <span>Usuarios registrados</span>

            <strong>{usuarios.length}</strong>

          </div>


          <div>

            <span>Con pedidos</span>

            <strong>
              {usuarios.filter(u => Number(u.pedidos) > 0).length}
            </strong>

          </div>


          <div>

            <span>Con colección</span>

            <strong>
              {usuarios.filter(
                u => Number(u.maderas_coleccion) > 0
              ).length}
            </strong>

          </div>

        </div>


        <div className="inventory-summary">

          <div className="inventory-summary-row inventory-summary-head">

            <span>Usuario</span>

            <span>Nombre</span>

            <Link href="/admin/pedidos">Pedidos</Link>

            <span>Colección</span>

            <span>Total comprado</span>

            <span>Alta</span>

            <span></span>

          </div>


          {usuarios.map((usuario) => {

            const nombreCompleto =
              [usuario.nombre, usuario.apellidos]
                .filter(Boolean)
                .join(' ') || '—';


            return (

              <div
                className="inventory-summary-row"
                key={usuario.user_id}
              >

                <span>

                  <strong>{usuario.email}</strong>

                  {usuario.poblacion && (

                    <em>
                      {usuario.poblacion}
                      {usuario.provincia
                        ? ` · ${usuario.provincia}`
                        : ''}
                    </em>

                  )}

                </span>


                <span>
                  {nombreCompleto}
                </span>


                <span>
                  {usuario.pedidos}
                </span>


                <span>
                  {usuario.maderas_coleccion}
                </span>


                <span>
                  {formatearPrecio(usuario.total_comprado)}
                </span>


                <span>
                  {formatearFecha(usuario.creado_en)}
                </span>


                <span>
                  <Link href={`/admin/usuarios/${usuario.user_id}`}>
                    Ver →
                  </Link>
                </span>

              </div>

            );

          })}

        </div>

      </section>

    </main>

  );

}
