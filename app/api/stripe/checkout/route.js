import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { CONDICIONES_COMPRA_VERSION } from '../../../../lib/legal';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

function crearSupabaseUsuario(accessToken) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

export async function POST(request) {
  try {
    const { pedidoId, accessToken } = await request.json();

    if (!pedidoId || !accessToken) {
      return NextResponse.json(
        { error: 'Faltan datos del pedido' },
        { status: 400 }
      );
    }

    const supabase = crearSupabaseUsuario(accessToken);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Sesión de usuario no válida' },
        { status: 401 }
      );
    }

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select(`
        id,
        user_id,
        estado,
        total,
        email_entrega,
        reserva_hasta,
        condiciones_aceptadas_at,
        condiciones_version,
        stripe_checkout_session_id,
        stripe_checkout_expires_at,
        pedido_lineas (
          nombre,
          cantidad,
          precio_unitario
        )
      `)
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    if (pedido.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para pagar este pedido' },
        { status: 403 }
      );
    }

    if (pedido.estado !== 'pendiente_pago') {
      return NextResponse.json(
        { error: 'El pedido no está pendiente de pago' },
        { status: 400 }
      );
    }

    if (
      !pedido.reserva_hasta ||
      new Date(pedido.reserva_hasta) <= new Date()
    ) {
      return NextResponse.json(
        { error: 'La reserva ha caducado' },
        { status: 400 }
      );
    }

    if (
      !pedido.condiciones_aceptadas_at ||
      pedido.condiciones_version !== CONDICIONES_COMPRA_VERSION
    ) {
      return NextResponse.json(
        { error: 'Debes aceptar las condiciones de compra antes de pagar' },
        { status: 400 }
      );
    }

    const emailCliente = pedido.email_entrega || user.email || undefined;

    async function prepararPago() {
      const { data, error } = await supabase.rpc(
        'preparar_checkout_stripe',
        { p_pedido_id: pedido.id }
      );

      if (error) throw error;

      const preparacion = Array.isArray(data) ? data[0] : data;

      if (!preparacion?.expires_at) {
        throw new Error('No se pudo preparar la ventana de pago');
      }

      return preparacion;
    }

    async function limpiarSesionStripe(sessionId) {
      const { error: limpiarError } = await supabaseAdmin
        .from('pedidos')
        .update({
          stripe_checkout_session_id: null,
          stripe_checkout_expires_at: null
        })
        .eq('id', pedido.id)
        .eq('estado', 'pendiente_pago')
        .eq('stripe_checkout_session_id', sessionId);

      if (limpiarError) throw limpiarError;
    }

    let preparacion = await prepararPago();
    const origin = new URL(request.url).origin;

    if (preparacion.session_id) {
      const existente = await stripe.checkout.sessions.retrieve(
        preparacion.session_id
      );

      if (existente.payment_status === 'paid') {
        const { error: confirmarError } = await supabaseAdmin.rpc(
          'confirmar_pago_stripe',
          { p_pedido_id: pedido.id }
        );

        if (confirmarError) throw confirmarError;

        return NextResponse.json({
          url: `${origin}/pago/correcto?session_id=${existente.id}`
        });
      }

      if (existente.status === 'open' && existente.url) {
        const emailSesion = existente.customer_email?.trim().toLowerCase() || null;
        const emailEsperado = emailCliente?.trim().toLowerCase() || null;

        if (emailEsperado && emailSesion === emailEsperado) {
          return NextResponse.json({ url: existente.url });
        }

        // Las sesiones creadas antes de pasar customer_email se reutilizaban
        // y seguían pidiendo el correo en Stripe. Las caducamos y creamos otra.
        await stripe.checkout.sessions.expire(existente.id);
        await limpiarSesionStripe(existente.id);
        preparacion = await prepararPago();
      } else if (existente.status === 'expired') {
        await limpiarSesionStripe(existente.id);
        preparacion = await prepararPago();
      } else {
        return NextResponse.json(
          { error: 'El pago ya está siendo procesado' },
          { status: 409 }
        );
      }
    }

    const expiresAt = Math.floor(
      new Date(preparacion.expires_at).getTime() / 1000
    );

    const line_items = pedido.pedido_lineas.map(linea => ({
      quantity: linea.cantidad,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(Number(linea.precio_unitario) * 100),
        product_data: {
          name: linea.nombre
        }
      }
    }));

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items,
        customer_email: emailCliente,
        expires_at: expiresAt,

        success_url:
          `${origin}/pago/correcto?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${origin}/checkout/${pedido.id}/pago`,

        metadata: {
          pedido_id: pedido.id,
          user_id: user.id,
          condiciones_version: CONDICIONES_COMPRA_VERSION
        }
      },
      {
        idempotencyKey: `pedido-${pedido.id}-${expiresAt}-email-v1`
      }
    );

    const { error: guardarSesionError } = await supabaseAdmin
      .from('pedidos')
      .update({
        stripe_checkout_session_id: session.id,
        stripe_checkout_expires_at: new Date(
          session.expires_at * 1000
        ).toISOString(),
        reserva_hasta: new Date(
          (session.expires_at + 5 * 60) * 1000
        ).toISOString()
      })
      .eq('id', pedido.id)
      .eq('estado', 'pendiente_pago');

    if (guardarSesionError) throw guardarSesionError;

    return NextResponse.json({
      url: session.url
    });

  } catch (error) {
    console.error('Error creando Checkout:', error);

    return NextResponse.json(
      { error: error.message || 'Error creando el pago' },
      { status: 500 }
    );
  }
}
