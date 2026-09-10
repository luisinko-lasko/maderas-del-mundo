'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useParams, useRouter } from 'next/navigation';

import { supabase } from '../../../../lib/supabase';


export default function AdminUsuarioDetalle() {

  const router = useRouter();

  const params = useParams();

  const userId = params.id;

  const [datos, setDatos] = useState(null);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState(null);

  const [maderaSeleccionada, setMaderaSeleccionada] = useState('');

  const [precioVenta, setPrecioVenta] = useState('');

  const [ventaItems, setVentaItems] = useState([]);

  const [guardandoVenta, setGuardandoVenta] = useState(false);


  useEffect(() => {

    let activo = true;


    async function cargar() {

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


      const { data, error: detalleError } =
        await supabase.rpc('admin_detalle_usuario', {
          p_user_id: userId
        });


      if (!activo) return;


      if (detalleError) {

        setError(detalleError.message);

      } else {

        setDatos(data);

      }


      setCargando(false);

    }


    cargar();


    return () => {

      activo = false;

    };

  }, [router, userId]);


  function formatearFecha(fecha) {

    if (!fecha) return '—';

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


  function añadirAVenta() {

    if (!maderaSeleccionada || precioVenta === '') return;

    const madera = (datos.stock_disponible || []).find(
      (m) => m.id === maderaSeleccionada
    );

    if (!madera) return;

    setVentaItems((anteriores) => [
      ...anteriores,
      {
        madera_id: madera.id,
        nombre: madera.nombre,
        xilo_id: madera.xilo_id,
        precio: Number(precioVenta)
      }
    ]);

    setMaderaSeleccionada('');
    setPrecioVenta('');
  }


  function quitarDeVenta(indice) {

    setVentaItems((anteriores) =>
      anteriores.filter((_, i) => i !== indice)
    );

  }


  async function registrarVentaPresencial() {

    if (ventaItems.length === 0) return;

    setGuardandoVenta(true);
    setError(null);

    const { error } = await supabase.rpc(
      'admin_registrar_venta_presencial_multiple',
      {
        p_user_id: userId,
        p_items: ventaItems.map((item) => ({
          madera_id: item.madera_id,
          precio: item.precio
        }))
      }
    );

    if (error) {
      setError(error.message);
      setGuardandoVenta(false);
      return;
    }

    window.location.reload();
  }

  if (cargando) {

    return (

      <main className="page-shell">

        <h1>Cargando usuario…</h1>

      </main>

    );

  }


  if (error || !datos) {

    return (

      <main className="page-shell">

        <h1>No se pudo cargar el usuario</h1>

        <p>{error}</p>

        <Link href="/admin/usuarios">
          ← Volver a usuarios
        </Link>

      </main>

    );

  }


  const usuario = datos.usuario || {};

  const perfil = datos.perfil || {};

  const pedidos = datos.pedidos || [];

  const coleccion = datos.coleccion || [];


  const nombreCompleto =
    [perfil.nombre, perfil.apellidos]
      .filter(Boolean)
      .join(' ') || 'Sin nombre';


  const totalComprado = pedidos
    .filter(p =>
      ['pagado', 'preparando', 'enviado', 'entregado'].includes(p.estado)
    )
    .reduce(
      (suma, pedido) => suma + Number(pedido.total || 0),
      0
    );


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

          <Link href="/admin/pedidos">
            Pedidos
          </Link>

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
              Administración / Usuarios / Detalle
            </div>

            <h1>{nombreCompleto}</h1>

            <p>{usuario.email}</p>

          </div>

          <Link
            href="/admin/usuarios"
            className="button"
          >
            ← Usuarios
          </Link>

        </div>


        <div className="admin-stats">

          <div>

            <span>Pedidos</span>

            <strong>{pedidos.length}</strong>

          </div>

          <div>

            <span>Maderas en colección</span>

            <strong>{coleccion.length}</strong>

          </div>

          <div>

            <span>Total comprado</span>

            <strong>
              {formatearPrecio(totalComprado)}
            </strong>

          </div>

        </div>


        <h2 className="facts-title">
          Datos del usuario
        </h2>


        <div className="admin-user-facts">

          <div>
            <span>Nombre</span>
            <strong>{nombreCompleto}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>{usuario.email}</strong>
          </div>

          <div>
            <span>Teléfono</span>
            <strong>{perfil.telefono || '—'}</strong>
          </div>

          <div>
            <span>Alta</span>
            <strong>{formatearFecha(usuario.creado_en)}</strong>
          </div>

        </div>


        <h2 className="facts-title">
          Dirección
        </h2>


        <div className="admin-user-facts">

          <div>
            <span>Dirección</span>
            <strong>{perfil.direccion || '—'}</strong>
          </div>

          <div>
            <span>Código postal</span>
            <strong>{perfil.codigo_postal || '—'}</strong>
          </div>

          <div>
            <span>Población</span>
            <strong>{perfil.poblacion || '—'}</strong>
          </div>

          <div>
            <span>Provincia</span>
            <strong>{perfil.provincia || '—'}</strong>
          </div>

          <div>
            <span>País</span>
            <strong>{perfil.pais || '—'}</strong>
          </div>

        </div>


        <h2 className="facts-title">
          Pedidos
        </h2>


        {pedidos.length === 0 ? (

          <div className="collection-empty">

            <p>Este usuario todavía no tiene pedidos.</p>

          </div>

        ) : (

          <div className="collection-list">

            {pedidos.map((pedido) => (

              <div
                className="collection-row"
                key={pedido.id}
              >

                <div>

                  <strong>
                    Pedido {pedido.id.slice(0, 8)}
                  </strong>

                  <em>
                    {formatearFecha(pedido.created_at)}
                  </em>

                </div>


                <span>{pedido.estado}</span>


                <strong>
                  {formatearPrecio(pedido.total)}
                </strong>


                <div>

                  {(pedido.lineas || []).map(linea => (

                    <div key={linea.id}>

                      {linea.cantidad} × {linea.nombre}

                    </div>

                  ))}

                </div>

              </div>

            ))}

          </div>

        )}


        <h2 className="facts-title">
          Venta presencial
        </h2>

        <div className="account-card">

          <p>
            Añade las piezas vendidas en un mercado o feria.
          </p>

          <div className="new-piece-actions">

            <select
              value={maderaSeleccionada}
              onChange={(e) => {
                const id = e.target.value;

                setMaderaSeleccionada(id);

                const madera = (datos.stock_disponible || []).find(
                  (m) => m.id === id
                );

                setPrecioVenta(
                  madera?.precio !== null &&
                  madera?.precio !== undefined
                    ? String(madera.precio)
                    : ''
                );
              }}
            >

              <option value="">
                Selecciona una madera…
              </option>

              {(datos.stock_disponible || []).map((m) => (

                <option key={m.id} value={m.id}>
                  #{String(m.xilo_id).padStart(3,'0')} · {m.nombre} ({m.stock})
                </option>

              ))}

            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Precio cobrado €"
              value={precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value)}
            />

            <button
              type="button"
              className="button"
              disabled={!maderaSeleccionada || precioVenta === ''}
              onClick={añadirAVenta}
            >
              Añadir
            </button>

          </div>


          {ventaItems.length > 0 && (

            <div className="collection-list">

              {ventaItems.map((item, indice) => (

                <div
                  className="collection-row"
                  key={`${item.madera_id}-${indice}`}
                >

                  <span>
                    #{String(item.xilo_id).padStart(3, '0')}
                  </span>

                  <strong>
                    {item.nombre}
                  </strong>

                  <strong>
                    {formatearPrecio(item.precio)}
                  </strong>

                  <button
                    type="button"
                    className="button"
                    onClick={() => quitarDeVenta(indice)}
                  >
                    Quitar
                  </button>

                </div>

              ))}

              <div className="collection-row">

                <strong>Total</strong>

                <strong>
                  {formatearPrecio(
                    ventaItems.reduce(
                      (suma, item) => suma + Number(item.precio || 0),
                      0
                    )
                  )}
                </strong>

              </div>

            </div>

          )}


          <button
            className="button dark"
            disabled={ventaItems.length === 0 || guardandoVenta}
            onClick={registrarVentaPresencial}
          >
            {guardandoVenta
              ? 'Registrando…'
              : 'Registrar venta completa'}
          </button>

        </div>

        <h2 className="facts-title">
          Mi colección
        </h2>


        {coleccion.length === 0 ? (

          <div className="collection-empty">

            <p>
              Este usuario todavía no tiene maderas en su colección.
            </p>

          </div>

        ) : (

          <div className="collection-list">

            {coleccion.map(item => {

              const madera = item.madera;

              return (

                <Link
                  href={`/catalogo/${madera.slug}`}
                  className="collection-row"
                  key={item.id}
                >

                  <span>
                    #{String(madera.xilo_id).padStart(3, '0')}
                  </span>

                  <div>

                    <strong>{madera.nombre}</strong>

                    <em>{madera.nombre_cientifico}</em>

                  </div>

                  <span>
                    {formatearFecha(item.fecha_adquisicion)}
                  </span>

                  <span>
                    {item.origen || '—'}
                  </span>

                </Link>

              );

            })}

          </div>

        )}

      </section>

    </main>

  );

}
