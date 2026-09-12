'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

const siguienteEstado = {
  pagado: 'preparando',
  preparando: 'enviado',
  enviado: 'entregado'
};

const etiquetaEstado = {
  pagado: 'Pagado',
  preparando: 'Preparando',
  enviado: 'Enviado',
  entregado: 'Entregado'
};

export default function AdminPedidoDetalle() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [cambiando, setCambiando] = useState(false);

  useEffect(() => {
    if (!id) return;

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

      const { data, error } = await supabase.rpc(
        'admin_detalle_pedido',
        { p_pedido_id: id }
      );

      if (!activo) return;

      if (error) {
        setError(error.message);
      } else {
        setDatos(data);
      }

      setCargando(false);
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [id, router]);

  function precio(valor) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(valor || 0));
  }

  function fecha(valor) {
    if (!valor) return '—';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(valor));
  }

  async function cambiarEstado(nuevoEstado) {
    if (!nuevoEstado || nuevoEstado === datos?.pedido?.estado) return;

    setCambiando(true);
    setError(null);

    const { error } = await supabase.rpc(
      'admin_cambiar_estado_pedido',
      {
        p_pedido_id: id,
        p_estado: nuevoEstado
      }
    );

    if (error) {
      setError(error.message);
      setCambiando(false);
      return;
    }

    setDatos(actual => ({
      ...actual,
      pedido: {
        ...actual.pedido,
        estado: nuevoEstado
      }
    }));

    setCambiando(false);
  }

  if (cargando) {
    return (
      <main className="page-shell">
        <h1>Cargando pedido…</h1>
      </main>
    );
  }

  if (error && !datos) {
    return (
      <main className="page-shell">
        <Link href="/admin/pedidos">← Pedidos</Link>
        <h1>No se pudo cargar el pedido</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!datos) {
    return (
      <main className="page-shell">
        <Link href="/admin/pedidos">← Pedidos</Link>
        <h1>No se pudo cargar el pedido</h1>
      </main>
    );
  }

  const pedido = datos.pedido || {};
  const usuario = datos.usuario || {};
  const perfil = datos.perfil || {};
  const lineas = datos.lineas || [];
  const siguiente = siguienteEstado[pedido.estado];

  return (
    <main className="admin-page">
      <aside className="admin-side">
        <div className="brand-mark admin-logo">MDM</div>
        <strong>Administración</strong>

        <nav>
          <Link href="/admin">Inventario</Link>
          <Link href="/admin/catalogo">Catálogo</Link>
          <Link href="/admin/series">Series</Link>
          <Link href="/admin/pedidos" className="active">Pedidos</Link>
          <Link href="/admin/usuarios">Usuarios</Link>
        </nav>

        <Link href="/">← Web pública</Link>
      </aside>

      <section className="admin-main">
        <div className="admin-top">
          <div>
            <div className="page-eyebrow">Administración / Pedido</div>
            <h1>Pedido {pedido.id?.slice(0, 8)}</h1>
            <p>{fecha(pedido.created_at)}</p>
          </div>

          <Link href="/admin/pedidos" className="button">
            ← Volver
          </Link>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-stats">
          <div>
            <span>Estado</span>

            {siguiente ? (
              <select
                value={pedido.estado}
                disabled={cambiando}
                onChange={e => cambiarEstado(e.target.value)}
              >
                <option value={pedido.estado}>
                  {etiquetaEstado[pedido.estado] || pedido.estado}
                </option>
                <option value={siguiente}>
                  → {etiquetaEstado[siguiente] || siguiente}
                </option>
              </select>
            ) : (
              <strong>{etiquetaEstado[pedido.estado] || pedido.estado}</strong>
            )}
          </div>

          <div>
            <span>Total</span>
            <strong>{precio(pedido.total)}</strong>
          </div>

          <div>
            <span>Entrega</span>
            <strong>{pedido.entrega || '—'}</strong>
          </div>
        </div>

        <div className="account-grid">
          <section className="account-card">
            <span className="account-label">Cliente</span>

            <strong>
              {pedido.nombre_entrega ||
               perfil.nombre ||
               usuario.email ||
               '—'}
            </strong>

            {(pedido.apellidos_entrega || perfil.apellidos) && (
              <span>{pedido.apellidos_entrega || perfil.apellidos}</span>
            )}

            <span>
              {pedido.email_entrega || usuario.email || '—'}
            </span>

            {(pedido.telefono_entrega || perfil.telefono) && (
              <span>{pedido.telefono_entrega || perfil.telefono}</span>
            )}
          </section>

          <section className="account-card">
            <span className="account-label">Dirección</span>

            <strong>{pedido.direccion_entrega || '—'}</strong>

            <span>
              {pedido.codigo_postal_entrega || ''}{' '}
              {pedido.poblacion_entrega || ''}
            </span>

            {pedido.provincia_entrega && (
              <span>{pedido.provincia_entrega}</span>
            )}

            {pedido.pais_entrega && (
              <span>{pedido.pais_entrega}</span>
            )}
          </section>
        </div>

        <div className="page-eyebrow">Contenido del pedido</div>

        <div className="collection-list">
          {lineas.map(linea => (
            <div className="collection-row" key={linea.id}>
              <div>
                <strong>{linea.nombre}</strong>
                <em>{linea.tipo}</em>
              </div>

              <span>
                {linea.cantidad} × {precio(linea.precio_unitario)}
              </span>

              <strong>
                {precio(
                  Number(linea.cantidad) * Number(linea.precio_unitario)
                )}
              </strong>

              <div>
                {(linea.piezas || []).length === 0 ? (
                  <span>Sin piezas asociadas</span>
                ) : (
                  (linea.piezas || []).map(pieza => (
                    <div key={pieza.id}>
                      <strong>{pieza.codigo}</strong>
                      {' · '}
                      {pieza.madera}
                      {' · '}
                      {pieza.estado}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
