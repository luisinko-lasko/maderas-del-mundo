import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { CONDICIONES_COMPRA_VERSION } from '../../../../lib/legal';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function hashToken(token) {
  return createHash('sha256').update(String(token || '')).digest('hex');
}

export async function POST(request) {
  try {
    const { pedidoId, guestToken } = await request.json();
    if (!pedidoId || !guestToken) {
      return NextResponse.json({ error: 'Faltan datos del pedido' }, { status: 400 });
    }

    const tokenHash = hashToken(guestToken);

    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from('pedidos')
      .select(`
        id, estado, total, email_entrega, reserva_hasta,
        condiciones_aceptadas_at, condiciones_version,
        stripe_checkout_session_id, stripe_checkout_expires_at,
        pedido_lineas (nombre, cantidad, precio_unitario)
      `)
      .eq('id', pedidoId)
      .eq('es_invitado', true)
      .eq('guest_token_hash', tokenHash)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json({ error: 'Pedido de invitado no encontrado' }, { status: 404 });
    }

    if (pedido.estado !== 'pendiente_pago') {
      return NextResponse.json({ error: 'El pedido no está pendiente de pago' }, { status: 400 });
    }

    if (!pedido.reserva_hasta || new Date(pedido.reserva_hasta) <= new Date()) {
      return NextResponse.json({ error: 'La reserva ha caducado' }, { status: 400 });
    }

    if (!pedido.condiciones_aceptadas_at || pedido.condiciones_version !== CONDICIONES_COMPRA_VERSION) {
      return NextResponse.json(
        { error: 'Debes aceptar las condiciones de compra antes de pagar' },
        { status: 400 }
      );
    }

    const emailCliente = pedido.email_entrega || undefined;

    async function prepararPago() {
      const { data, error } = await supabaseAdmin.rpc(
        'preparar_checkout_stripe_invitado',
        {
          p_pedido_id: pedido.id,
          p_guest_token_hash: tokenHash
        }
      );
      if (error) throw error;
      const preparacion = Array.isArray(data) ? data[0] : data;
      if (!preparacion?.expires_at) throw new Error('No se pudo preparar la ventana de pago');
      return preparacion;
    }

    async function limpiarSesionStripe(sessionId) {
      const { error } = await supabaseAdmin
        .from('pedidos')
        .update({
          stripe_checkout_session_id: null,
          stripe_checkout_expires_at: null
        })
        .eq('id', pedido.id)
        .eq('guest_token_hash', tokenHash)
        .eq('estado', 'pendiente_pago')
        .eq('stripe_checkout_session_id', sessionId);
      if (error) throw error;
    }

    let preparacion = await prepararPago();
    const origin = new URL(request.url).origin;

    if (preparacion.session_id) {
      const existente = await stripe.checkout.sessions.retrieve(preparacion.session_id);

      if (existente.payment_status === 'paid') {
        const { error: confirmarError } = await supabaseAdmin.rpc(
          'confirmar_pago_stripe',
          { p_pedido_id: pedido.id }
        );
        if (confirmarError) throw confirmarError;

        return NextResponse.json({
          url: `${origin}/pago/correcto?session_id=${existente.id}&guest=1`
        });
      }

      if (existente.status === 'open' && existente.url) {
        const emailSesion = existente.customer_email?.trim().toLowerCase() || null;
        const emailEsperado = emailCliente?.trim().toLowerCase() || null;
        if (emailEsperado && emailSesion === emailEsperado) {
          return NextResponse.json({ url: existente.url });
        }

        await stripe.checkout.sessions.expire(existente.id);
        await limpiarSesionStripe(existente.id);
        preparacion = await prepararPago();
      } else if (existente.status === 'expired') {
        await limpiarSesionStripe(existente.id);
        preparacion = await prepararPago();
      } else {
        return NextResponse.json({ error: 'El pago ya está siendo procesado' }, { status: 409 });
      }
    }

    const expiresAt = Math.floor(new Date(preparacion.expires_at).getTime() / 1000);
    const line_items = (pedido.pedido_lineas || []).map(linea => ({
      quantity: linea.cantidad,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(Number(linea.precio_unitario) * 100),
        product_data: { name: linea.nombre }
      }
    }));

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items,
        customer_email: emailCliente,
        expires_at: expiresAt,
        success_url: `${origin}/pago/correcto?session_id={CHECKOUT_SESSION_ID}&guest=1`,
        cancel_url: `${origin}/checkout/${pedido.id}/pago`,
        metadata: {
          pedido_id: pedido.id,
          guest: '1',
          condiciones_version: CONDICIONES_COMPRA_VERSION
        }
      },
      { idempotencyKey: `pedido-${pedido.id}-${expiresAt}-guest-email-v1` }
    );

    const { error: guardarError } = await supabaseAdmin
      .from('pedidos')
      .update({
        stripe_checkout_session_id: session.id,
        stripe_checkout_expires_at: new Date(session.expires_at * 1000).toISOString(),
        reserva_hasta: new Date((session.expires_at + 5 * 60) * 1000).toISOString()
      })
      .eq('id', pedido.id)
      .eq('guest_token_hash', tokenHash)
      .eq('estado', 'pendiente_pago');

    if (guardarError) throw guardarError;
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creando Checkout invitado:', error);
    return NextResponse.json(
      { error: error?.message || 'Error creando el pago' },
      { status: 500 }
    );
  }
}
