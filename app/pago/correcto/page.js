'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import {
  vaciarCarrito,
  borrarPedidoActivo
} from '../../../lib/carrito';

export default function PagoCorrectoPage() {
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function comprobarPago() {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          throw new Error(
            'No se ha recibido la referencia del pago.'
          );
        }

        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error(
            'Debes iniciar sesión para consultar el pedido.'
          );
        }

        const respuesta = await fetch('/api/stripe/resultado', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId,
            accessToken: session.access_token
          })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            resultado.error || 'No se pudo comprobar el pago.'
          );
        }

        setPedido(resultado.pedido);

        vaciarCarrito();
        borrarPedidoActivo();

      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }

    comprobarPago();
  }, []);

  if (cargando) {
    return (
      <main className="checkout-page">
        <p>Comprobando el pago…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="checkout-page">
        <div className="checkout-heading">
          <div className="page-eyebrow">
            Maderas del mundo / Pedido
          </div>
          <h1>No se pudo confirmar el pago</h1>
        </div>

        <section className="checkout-form">
          <div className="checkout-block">
            <p>{error}</p>

            <Link href="/tienda" className="button">
              Volver a la tienda
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">

      <div className="checkout-heading">
        <div className="page-eyebrow">
          Maderas del mundo / Pedido
        </div>

        <h1>Pago realizado</h1>
      </div>

      <section className="checkout-form">
        <div className="checkout-block">

          <span className="page-eyebrow">
            Pedido confirmado
          </span>

          <h2 className="payment-title">
            Gracias por tu compra
          </h2>

          <p>
            Pedido {pedido.id.slice(0, 8).toUpperCase()}
          </p>

          <div style={{ marginTop: '2rem' }}>
            {pedido.pedido_lineas?.map(linea => (
              <div
                key={linea.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '2rem',
                  marginBottom: '.75rem'
                }}
              >
                <span>
                  {linea.nombre} × {linea.cantidad}
                </span>

                <strong>
                  {(
                    Number(linea.precio_unitario) *
                    linea.cantidad
                  ).toFixed(2)} €
                </strong>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid currentColor',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <strong>Total</strong>
            <strong>
              {Number(pedido.total).toFixed(2)} €
            </strong>
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            <Link href="/coleccion" className="button dark">
              Ver mi colección
            </Link>

            <Link href="/tienda" className="button">
              Volver a la tienda
            </Link>
          </div>

        </div>
      </section>

    </main>
  );
}
