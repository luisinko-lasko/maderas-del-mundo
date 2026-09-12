'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabase';
import { borrarPedidoActivo } from '../../../../lib/carrito';

export default function PagoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [pedido, setPedido] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargar() {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: pedidoData, error: pedidoError } =
        await supabase
          .from('pedidos')
          .select('*')
          .eq('id', id)
          .single();

      if (pedidoError) {
        setError('No se pudo cargar el pedido.');
        setCargando(false);
        return;
      }

      const reservaVencida =
        !pedidoData.reserva_hasta ||
        new Date(pedidoData.reserva_hasta) <= new Date();

      // Un pedido todavía "reservado" no ha pasado por el formulario de
      // entrega/contacto. Lo devolvemos a ese paso en lugar de dejar que
      // llegue directamente a Stripe.
      if (pedidoData.estado === 'reservado' && !reservaVencida) {
        router.replace(`/checkout/${id}`);
        return;
      }

      if (pedidoData.estado !== 'pendiente_pago' || reservaVencida) {
        borrarPedidoActivo();

        setError(
          'Esta reserva ya no está activa. Vuelve al carrito para crear una nueva.'
        );

        setCargando(false);
        return;
      }

      const { data: lineasData, error: lineasError } =
        await supabase
          .from('pedido_lineas')
          .select('*')
          .eq('pedido_id', id)
          .order('created_at');

      if (lineasError) {
        setError('No se pudo cargar el contenido del pedido.');
        setCargando(false);
        return;
      }

      setPedido(pedidoData);
      setLineas(lineasData || []);
      setCargando(false);
    }

    cargar();
  }, [id, router]);

  async function iniciarPago() {
    if (pagando) return;

    setError('');
    setPagando(true);

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push('/login');
        return;
      }

      const respuesta = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pedidoId: id,
          accessToken: session.access_token
        })
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || 'No se pudo iniciar el pago'
        );
      }

      if (!resultado.url) {
        throw new Error('Stripe no devolvió una página de pago');
      }

      window.location.href = resultado.url;

    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo iniciar el pago');
      setPagando(false);
    }
  }

  if (cargando) {
    return (
      <main className="checkout-page">
        <p>Cargando…</p>
      </main>
    );
  }

  if (error || !pedido) {
    return (
      <main className="checkout-page">
        <h1>No se pudo abrir el pago</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="checkout-page">

      <div className="checkout-heading">
        <div className="page-eyebrow">
          Maderas del mundo / Pago
        </div>
        <h1>Pago</h1>
      </div>

      <div className="checkout-layout">

        <section className="checkout-form">

          <div className="checkout-block">
            <span className="page-eyebrow">
              Pedido preparado
            </span>

            <h2 className="payment-title">
              Todo listo para pagar.
            </h2>

            <p className="payment-text">
              Tus piezas están reservadas temporalmente.
              Al continuar accederás al pago seguro mediante Stripe.
            </p>
          </div>

          <div className="checkout-block">
            <span className="page-eyebrow">
              Entrega
            </span>

            <p>
              {pedido.entrega === 'recogida'
                ? 'Recogida en mano'
                : `${pedido.direccion_entrega}, ${pedido.codigo_postal_entrega} ${pedido.poblacion_entrega}, ${pedido.provincia_entrega}`}
            </p>

            <Link href={`/checkout/${id}`}>
              ← Modificar datos
            </Link>
          </div>

          {error && (
            <p className="cart-order-error">
              {error}
            </p>
          )}

          <button
            type="button"
            className="button dark checkout-continue"
            onClick={iniciarPago}
            disabled={pagando}
          >
            {pagando
              ? 'Abriendo pago seguro…'
              : `Pagar ${Number(pedido.total).toFixed(2)} €`}
          </button>

        </section>

        <aside className="checkout-summary">

          <span className="page-eyebrow">
            Resumen
          </span>

          <div className="checkout-lines">
            {lineas.map(linea => (
              <div
                className="checkout-line"
                key={linea.id}
              >
                <div>
                  <strong>{linea.nombre}</strong>
                  <small>
                    {linea.cantidad} × {Number(
                      linea.precio_unitario
                    ).toFixed(2)} €
                  </small>
                </div>

                <div>
                  {(
                    linea.cantidad *
                    Number(linea.precio_unitario)
                  ).toFixed(2)} €
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-total">
            <span>Total</span>
            <strong>
              {Number(pedido.total).toFixed(2)} €
            </strong>
          </div>

        </aside>

      </div>

    </main>
  );
}
