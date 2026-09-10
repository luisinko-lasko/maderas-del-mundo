'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { supabase } from '../../../lib/supabase';


export default function AdminPedidos() {

  const router = useRouter();

  const [pedidos, setPedidos] = useState([]);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState(null);

  const [filtro, setFiltro] = useState('todos');

  const [cambiando, setCambiando] = useState(null);


  async function cargarPedidos() {

    setError(null);

    const { data, error } =
      await supabase.rpc('admin_listar_pedidos');

    if (error) {

      setError(error.message);
      setCargando(false);

      return;

    }

    setPedidos(data || []);
    setCargando(false);

  }


  useEffect(() => {

    let activo = true;


    async function iniciar() {

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


      await cargarPedidos();

    }


    iniciar();


    return () => {

      activo = false;

    };

  }, [router]);


  const pedidosFiltrados = useMemo(() => {

    if (filtro === 'todos') return pedidos;

    return pedidos.filter(p => p.estado === filtro);

  }, [pedidos, filtro]);


  async function cambiarEstado(pedido, nuevoEstado) {

    setCambiando(pedido.id);
    setError(null);


    const { error } = await supabase.rpc(
      'admin_cambiar_estado_pedido',
      {
        p_pedido_id: pedido.id,
        p_estado: nuevoEstado
      }
    );


    if (error) {

      setError(error.message);
      setCambiando(null);

      return;

    }


    await cargarPedidos();

    setCambiando(null);

  }


  function formatearFecha(fecha) {

    if (!fecha) return '';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(fecha));

  }


  function formatearPrecio(valor) {

    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(valor || 0));

  }


  const totalPagados = pedidos.filter(p =>
    ['pagado', 'preparando', 'enviado', 'entregado'].includes(p.estado)
  ).length;


  const totalPreparando = pedidos.filter(
    p => p.estado === 'preparando'
  ).length;


  const totalPendientesEnvio = pedidos.filter(
    p => p.estado === 'pagado' || p.estado === 'preparando'
  ).length;


  if (cargando) {

    return (

      <main className="page-shell">

        <h1>Cargando pedidos…</h1>

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

          <Link
            href="/admin/pedidos"
            className="active"
          >
            Pedidos
          </Link>

          <Link href="/admin/usuarios">
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
              Administración / Pedidos
            </div>

            <h1>Pedidos</h1>

          </div>

        </div>


        {error && (

          <p className="admin-error">
            {error}
          </p>

        )}


        <div className="admin-stats">

          <div>

            <span>Pedidos cobrados</span>

            <strong>{totalPagados}</strong>

          </div>


          <div>

            <span>Preparando</span>

            <strong>{totalPreparando}</strong>

          </div>


          <div>

            <span>Pendientes de envío</span>

            <strong>{totalPendientesEnvio}</strong>

          </div>

        </div>


        <div className="admin-inventory-tabs">

          {[
            ['todos', 'Todos'],
            ['pagado', 'Pagados'],
            ['preparando', 'Preparando'],
            ['enviado', 'Enviados'],
            ['entregado', 'Entregados'],
            ['cancelado', 'Cancelados'],
            ['caducado', 'Caducados']
          ].map(([valor, texto]) => (

            <button
              key={valor}
              className={filtro === valor ? 'active' : ''}
              onClick={() => setFiltro(valor)}
            >
              {texto}
            </button>

          ))}

        </div>


        <div className="collection-list">

          {pedidosFiltrados.length === 0 && (

            <div className="collection-empty">

              <p>No hay pedidos en este estado.</p>

            </div>

          )}


          {pedidosFiltrados.map(pedido => {

            const modificable = [
              'pagado',
              'preparando',
              'enviado',
              'entregado'
            ].includes(pedido.estado);


            return (

              <div
                className="collection-row"
                key={pedido.id}
              >

                <div>

                  <strong>
                    <Link href={`/admin/pedidos/${pedido.id}`}>
                      Pedido {pedido.id.slice(0, 8)}
                    </Link>
                  </strong>

                  <em>
                    {formatearFecha(pedido.created_at)}
                  </em>

                  <em>
                    {pedido.email || pedido.email_entrega || 'Sin email'}
                  </em>

                </div>


                <span>

                  <strong>
                    {pedido.estado}
                  </strong>

                </span>


                <span>

                  <strong>
                    {formatearPrecio(pedido.total)}
                  </strong>

                </span>


                <div>

                  {(pedido.lineas || []).map(linea => (

                    <div key={linea.id}>

                      {linea.cantidad} × {linea.nombre}

                    </div>

                  ))}

                </div>


                <div>

                  {pedido.nombre_entrega && (

                    <div>
                      {pedido.nombre_entrega}{' '}
                      {pedido.apellidos_entrega || ''}
                    </div>

                  )}

                  {pedido.direccion_entrega && (

                    <div>
                      {pedido.direccion_entrega}
                    </div>

                  )}

                  {(pedido.codigo_postal_entrega ||
                    pedido.poblacion_entrega) && (

                    <div>
                      {pedido.codigo_postal_entrega || ''}{' '}
                      {pedido.poblacion_entrega || ''}
                    </div>

                  )}

                  {pedido.provincia_entrega && (

                    <div>
                      {pedido.provincia_entrega}
                    </div>

                  )}

                </div>


                <div>

                  {modificable ? (

                    <select
                      value={pedido.estado}
                      disabled={cambiando === pedido.id}
                      onChange={(e) =>
                        cambiarEstado(pedido, e.target.value)
                      }
                    >

                      <option value="pagado">
                        Pagado
                      </option>

                      <option value="preparando">
                        Preparando
                      </option>

                      <option value="enviado">
                        Enviado
                      </option>

                      <option value="entregado">
                        Entregado
                      </option>

                    </select>

                  ) : (

                    <span>—</span>

                  )}

                </div>

              </div>

            );

          })}

        </div>

      </section>

    </main>

  );

}
