'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  leerCarrito,
  leerPedidoActivo,
  guardarPedidoActivo,
  borrarPedidoActivo,
  firmaCarrito,
  cambiarCantidad,
  eliminarDelCarrito
} from '../../lib/carrito';
import { supabase } from '../../lib/supabase';

export default function CarritoPage() {
  const router = useRouter();
  const [carrito, setCarrito] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [errorPedido, setErrorPedido] = useState('');

  function recargar() {
    setCarrito(leerCarrito());
  }

  useEffect(() => {
    recargar();
    window.addEventListener('mdm-carrito', recargar);
    return () => window.removeEventListener('mdm-carrito', recargar);
  }, []);

  async function continuarPedido() {
    setProcesando(true);
    setErrorPedido('');

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/continuar-compra');
      return;
    }

    const carritoActual = leerCarrito();
    const firmaActual = firmaCarrito(carritoActual);
    const pedidoActivo = leerPedidoActivo();
    let pedidoActivoValido = null;

    if (pedidoActivo?.id && pedidoActivo.modo !== 'invitado') {
      const { data: pedidoBD } = await supabase
        .from('pedidos')
        .select('id, estado, reserva_hasta')
        .eq('id', pedidoActivo.id)
        .maybeSingle();

      const sigueActivo = pedidoBD &&
        ['reservado', 'pendiente_pago'].includes(pedidoBD.estado) &&
        (!pedidoBD.reserva_hasta || new Date(pedidoBD.reserva_hasta) > new Date());

      if (sigueActivo) pedidoActivoValido = pedidoActivo;
      else borrarPedidoActivo();
    }

    if (pedidoActivoValido && pedidoActivoValido.firmaCarrito === firmaActual) {
      router.push(`/checkout/${pedidoActivoValido.id}`);
      return;
    }

    if (pedidoActivoValido?.id) {
      const { error: errorCancelar } = await supabase.rpc('cancelar_pedido', {
        p_pedido_id: pedidoActivoValido.id
      });

      if (errorCancelar) {
        setErrorPedido('No se pudo actualizar la reserva anterior: ' + errorCancelar.message);
        setProcesando(false);
        return;
      }
      borrarPedidoActivo();
    }

    const datosPedido = carritoActual.map(item => ({
      tipo: item.tipo,
      id: item.id,
      cantidad: item.cantidad,
      caja_id: item.caja_id || null
    }));

    const { data, error } = await supabase.rpc('crear_pedido_desde_carrito', {
      p_carrito: datosPedido
    });

    if (error) {
      setErrorPedido(error.message);
      setProcesando(false);
      return;
    }

    guardarPedidoActivo(data, firmaActual);
    router.push(`/checkout/${data}`);
  }

  const total = useMemo(() => carrito.reduce(
    (suma, item) => suma + Number(item.precio || 0) * item.cantidad,
    0
  ), [carrito]);

  return (
    <main className="cart-page">
      <div className="cart-heading">
        <div>
          <div className="page-eyebrow">Maderas del mundo / Tienda</div>
          <h1>Carrito</h1>
        </div>
        <Link href="/tienda">← Seguir comprando</Link>
      </div>

      {carrito.length === 0 ? (
        <section className="cart-empty">
          <h2>Tu carrito está vacío.</h2>
          <Link href="/tienda" className="button dark">Ir a la tienda</Link>
        </section>
      ) : (
        <>
          <section className="cart-items">
            {carrito.map(item => (
              <article className="cart-item" key={item.clave}>
                <div className="cart-item-number">{String(item.cantidad).padStart(2, '0')}</div>

                <div className="cart-item-info">
                  <span className="page-eyebrow">
                    {item.tipo === 'madera' ? 'Pieza individual' : 'Serie'}
                  </span>
                  <h2>{item.nombre}</h2>
                  {item.tipo === 'madera' && item.nombre_cientifico && <em>{item.nombre_cientifico}</em>}
                  {item.tipo === 'serie' && (
                    <div className="cart-series-detail">
                      <span>{item.numero_maderas} maderas</span>
                      <span>{item.caja ? item.caja.nombre : 'Sin caja'}</span>
                    </div>
                  )}
                </div>

                <div className="cart-item-quantity">
                  <button onClick={() => { cambiarCantidad(item.clave, item.cantidad - 1); recargar(); }}>−</button>
                  <strong>{item.cantidad}</strong>
                  <button onClick={() => { cambiarCantidad(item.clave, item.cantidad + 1); recargar(); }}>+</button>
                </div>

                <div className="cart-item-price">
                  <span>{Number(item.precio).toFixed(2)} €{item.cantidad > 1 && ' c/u'}</span>
                  <strong>{(Number(item.precio) * item.cantidad).toFixed(2)} €</strong>
                </div>

                <button className="cart-remove" onClick={() => { eliminarDelCarrito(item.clave); recargar(); }}>
                  Eliminar
                </button>
              </article>
            ))}
          </section>

          <section className="cart-summary">
            <div className="cart-summary-total">
              <span>Total</span>
              <strong>{total.toFixed(2)} €</strong>
            </div>

            <div className="cart-summary-actions">
              <p>Los gastos de envío se calcularán más adelante.</p>
              <button className="button dark" onClick={continuarPedido} disabled={procesando}>
                {procesando ? 'Comprobando disponibilidad…' : 'Continuar pedido'}
              </button>
              {errorPedido && <p className="cart-order-error">{errorPedido}</p>}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
