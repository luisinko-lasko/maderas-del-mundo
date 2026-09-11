'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import styles from './produccion.module.css';

const ESTADOS_ACTIVOS = ['pagado', 'preparando'];

export default function AdminProduccion() {
  const router = useRouter();

  const [pedidos, setPedidos] = useState([]);
  const [piezas, setPiezas] = useState([]);
  const [maderas, setMaderas] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [limiteStock, setLimiteStock] = useState(2);
  const [cargando, setCargando] = useState(true);
  const [cambiando, setCambiando] = useState(null);
  const [error, setError] = useState(null);

  async function cargarDatos() {
    setError(null);

    const [pedidosRes, piezasRes, maderasRes] = await Promise.all([
      supabase.rpc('admin_listar_pedidos'),
      supabase
        .from('piezas')
        .select('id, codigo, estado, madera_id, created_at')
        .order('created_at'),
      supabase
        .from('maderas')
        .select('id, xilo_id, nombre, nombre_cientifico, precio, publicada')
        .eq('publicada', true)
        .order('xilo_id')
    ]);

    const primerError =
      pedidosRes.error || piezasRes.error || maderasRes.error;

    if (primerError) {
      setError(primerError.message);
      setCargando(false);
      return;
    }

    const pedidosActivos = (pedidosRes.data || []).filter(pedido =>
      ESTADOS_ACTIVOS.includes(pedido.estado)
    );

    const detalles = await Promise.all(
      pedidosActivos.map(async pedido => {
        const { data, error: detalleError } = await supabase.rpc(
          'admin_detalle_pedido',
          { p_pedido_id: pedido.id }
        );

        if (detalleError) {
          return {
            ...pedido,
            detalleError: detalleError.message,
            lineas: pedido.lineas || []
          };
        }

        return {
          ...pedido,
          ...data.pedido,
          email: pedido.email,
          usuario: data.usuario || {},
          perfil: data.perfil || {},
          lineas: data.lineas || []
        };
      })
    );

    setPedidos(detalles);
    setPiezas(piezasRes.data || []);
    setMaderas(maderasRes.data || []);
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

      await cargarDatos();
    }

    iniciar();

    return () => {
      activo = false;
    };
  }, [router]);

  const pedidosFiltrados = useMemo(() => {
    if (filtro === 'todos') return pedidos;
    return pedidos.filter(pedido => pedido.estado === filtro);
  }, [pedidos, filtro]);

  const stockPorMadera = useMemo(() => {
    const mapa = new Map();

    for (const madera of maderas) {
      mapa.set(madera.id, {
        ...madera,
        disponibles: 0,
        vendidas: 0,
        reservadas: 0,
        retiradas: 0,
        total: 0
      });
    }

    for (const pieza of piezas) {
      const fila = mapa.get(pieza.madera_id);
      if (!fila) continue;

      fila.total += 1;

      if (pieza.estado === 'disponible') fila.disponibles += 1;
      if (pieza.estado === 'vendida') fila.vendidas += 1;
      if (pieza.estado === 'reservada') fila.reservadas += 1;
      if (pieza.estado === 'retirada') fila.retiradas += 1;
    }

    return Array.from(mapa.values());
  }, [maderas, piezas]);

  const reposicion = useMemo(() => {
    return stockPorMadera
      .filter(madera => madera.precio !== null)
      .filter(madera => madera.disponibles <= Number(limiteStock))
      .sort((a, b) => {
        if (a.disponibles !== b.disponibles) {
          return a.disponibles - b.disponibles;
        }
        return a.xilo_id - b.xilo_id;
      });
  }, [stockPorMadera, limiteStock]);

  const totalPorPreparar = pedidos.filter(
    pedido => pedido.estado === 'pagado'
  ).length;

  const totalPreparando = pedidos.filter(
    pedido => pedido.estado === 'preparando'
  ).length;

  const piezasEnPedidos = pedidos.reduce((total, pedido) => {
    return total + (pedido.lineas || []).reduce((subtotal, linea) => {
      return subtotal + (linea.piezas || []).length;
    }, 0);
  }, 0);

  const totalDisponibles = piezas.filter(
    pieza => pieza.estado === 'disponible'
  ).length;

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

  function nombreCliente(pedido) {
    const nombre = [
      pedido.nombre_entrega,
      pedido.apellidos_entrega
    ].filter(Boolean).join(' ');

    return nombre ||
      pedido.perfil?.nombre ||
      pedido.email_entrega ||
      pedido.usuario?.email ||
      pedido.email ||
      'Cliente';
  }

  async function cambiarEstado(pedidoId, nuevoEstado) {
    setCambiando(pedidoId);
    setError(null);

    const { error: cambioError } = await supabase.rpc(
      'admin_cambiar_estado_pedido',
      {
        p_pedido_id: pedidoId,
        p_estado: nuevoEstado
      }
    );

    if (cambioError) {
      setError(cambioError.message);
      setCambiando(null);
      return;
    }

    await cargarDatos();
    setCambiando(null);
  }

  if (cargando) {
    return (
      <main className="page-shell">
        <h1>Cargando producción…</h1>
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
          <Link href="/admin/series">Series</Link>
          <Link href="/admin/produccion" className="active">
            Producción
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
              Administración / Producción
            </div>
            <h1>Producción</h1>
            <p className={styles.intro}>
              Pedidos que requieren preparación y maderas que conviene reponer.
            </p>
          </div>

          <button className="button" onClick={cargarDatos}>
            Actualizar
          </button>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-stats">
          <div>
            <span>Por preparar</span>
            <strong>{totalPorPreparar}</strong>
          </div>
          <div>
            <span>En preparación</span>
            <strong>{totalPreparando}</strong>
          </div>
          <div>
            <span>Piezas en pedidos</span>
            <strong>{piezasEnPedidos}</strong>
          </div>
          <div>
            <span>Piezas disponibles</span>
            <strong>{totalDisponibles}</strong>
          </div>
        </div>

        <div className={styles.sectionHeader}>
          <div>
            <div className="page-eyebrow">Cola de trabajo</div>
            <h2>Pedidos para preparar</h2>
          </div>

          <div className="admin-inventory-tabs">
            {[
              ['todos', 'Todos'],
              ['pagado', 'Por preparar'],
              ['preparando', 'En preparación']
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
        </div>

        <div className={styles.orders}>
          {pedidosFiltrados.length === 0 && (
            <div className={styles.empty}>
              No hay pedidos pendientes de preparación.
            </div>
          )}

          {pedidosFiltrados.map(pedido => {
            const piezasPedido = (pedido.lineas || []).flatMap(
              linea => linea.piezas || []
            );

            return (
              <article className={styles.orderCard} key={pedido.id}>
                <div className={styles.orderTop}>
                  <div>
                    <div className={styles.orderTitle}>
                      <Link href={`/admin/pedidos/${pedido.id}`}>
                        Pedido {pedido.id.slice(0, 8)}
                      </Link>
                      <span
                        className={`${styles.badge} ${
                          pedido.estado === 'pagado'
                            ? styles.badgePending
                            : styles.badgeWorking
                        }`}
                      >
                        {pedido.estado === 'pagado'
                          ? 'Por preparar'
                          : 'En preparación'}
                      </span>
                    </div>
                    <p>
                      {nombreCliente(pedido)} · {fecha(pedido.created_at)}
                    </p>
                  </div>

                  <div className={styles.actions}>
                    <Link
                      href={`/admin/pedidos/${pedido.id}`}
                      className="button"
                    >
                      Ver pedido
                    </Link>

                    {pedido.estado === 'pagado' && (
                      <button
                        className="button dark"
                        disabled={cambiando === pedido.id}
                        onClick={() =>
                          cambiarEstado(pedido.id, 'preparando')
                        }
                      >
                        Empezar preparación
                      </button>
                    )}

                    {pedido.estado === 'preparando' && (
                      <button
                        className="button dark"
                        disabled={cambiando === pedido.id}
                        onClick={() => {
                          const aceptar = window.confirm(
                            '¿Marcar este pedido como enviado?'
                          );
                          if (aceptar) {
                            cambiarEstado(pedido.id, 'enviado');
                          }
                        }}
                      >
                        Marcar enviado
                      </button>
                    )}
                  </div>
                </div>

                {pedido.detalleError && (
                  <p className="admin-error">
                    No se pudo cargar el detalle: {pedido.detalleError}
                  </p>
                )}

                <div className={styles.lines}>
                  {(pedido.lineas || []).map(linea => (
                    <div className={styles.line} key={linea.id}>
                      <div>
                        <strong>{linea.nombre}</strong>
                        <span>
                          {linea.cantidad} unidad{linea.cantidad === 1 ? '' : 'es'}
                          {linea.tipo ? ` · ${linea.tipo}` : ''}
                        </span>
                      </div>

                      <div className={styles.pieces}>
                        {(linea.piezas || []).length === 0 ? (
                          <span className={styles.noPiece}>
                            Sin pieza física asociada
                          </span>
                        ) : (
                          (linea.piezas || []).map(pieza => (
                            <span className={styles.piece} key={pieza.id}>
                              <strong>{pieza.codigo}</strong>
                              <small>
                                #{String(pieza.xilo_id || '').padStart(3, '0')} · {pieza.madera}
                              </small>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.orderFooter}>
                  <span>
                    {piezasPedido.length} pieza{piezasPedido.length === 1 ? '' : 's'} física{piezasPedido.length === 1 ? '' : 's'}
                  </span>
                  <span>
                    {pedido.entrega === 'presencial'
                      ? 'Entrega presencial'
                      : 'Envío'}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.restockBlock}>
          <div className={styles.sectionHeader}>
            <div>
              <div className="page-eyebrow">Reposición</div>
              <h2>Stock bajo de piezas</h2>
              <p className={styles.intro}>
                Solo aparecen maderas publicadas con precio de venta.
              </p>
            </div>

            <label className={styles.limitControl}>
              Avisar con
              <select
                value={limiteStock}
                onChange={e => setLimiteStock(Number(e.target.value))}
              >
                {[0, 1, 2, 3, 4, 5].map(valor => (
                  <option value={valor} key={valor}>
                    {valor} o menos
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.restockGrid}>
            {reposicion.length === 0 && (
              <div className={styles.empty}>
                Ninguna madera vendible está por debajo de ese nivel.
              </div>
            )}

            {reposicion.map(madera => (
              <div className={styles.restockCard} key={madera.id}>
                <div>
                  <span className={styles.xilo}>
                    #{String(madera.xilo_id).padStart(3, '0')}
                  </span>
                  <strong>{madera.nombre}</strong>
                  {madera.nombre_cientifico && (
                    <em>{madera.nombre_cientifico}</em>
                  )}
                </div>

                <div className={styles.stockNumber}>
                  <strong>{madera.disponibles}</strong>
                  <span>disponibles</span>
                </div>

                <div className={styles.stockMeta}>
                  <span>{madera.vendidas} vendidas</span>
                  <span>{madera.total} fabricadas en total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
