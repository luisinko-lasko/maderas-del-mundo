import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { enviarConfirmacionPedido } from '../../../../lib/brevo';

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
    const { sessionId, guestToken } = await request.json();
    if (!sessionId || !guestToken) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'El pago todavía no está confirmado' }, { status: 400 });
    }
    if (session.metadata?.guest !== '1') {
      return NextResponse.json({ error: 'La sesión no corresponde a una compra de invitado' }, { status: 400 });
    }

    const pedidoId = session.metadata?.pedido_id;
    if (!pedidoId) {
      return NextResponse.json({ error: 'La sesión no contiene pedido' }, { status: 400 });
    }

    const tokenHash = hashToken(guestToken);
    const { data: pedidoPropio, error: propioError } = await supabaseAdmin
      .from('pedidos')
      .select('id, stripe_checkout_session_id')
      .eq('id', pedidoId)
      .eq('es_invitado', true)
      .eq('guest_token_hash', tokenHash)
      .single();

    if (propioError || !pedidoPropio) {
      return NextResponse.json({ error: 'No se pudo recuperar el pedido' }, { status: 404 });
    }

    if (pedidoPropio.stripe_checkout_session_id && pedidoPropio.stripe_checkout_session_id !== session.id) {
      return NextResponse.json({ error: 'La sesión de pago no corresponde al pedido actual' }, { status: 400 });
    }

    const { error: confirmacionError } = await supabaseAdmin.rpc(
      'confirmar_pago_stripe',
      { p_pedido_id: pedidoId }
    );
    if (confirmacionError) {
      return NextResponse.json(
        { error: 'El pago está confirmado, pero no se pudo actualizar el pedido' },
        { status: 500 }
      );
    }

    try {
      await enviarConfirmacionPedido(supabaseAdmin, pedidoId);
    } catch (emailError) {
      console.error('Error enviando confirmación invitado:', emailError);
    }

    const { data: pedido, error } = await supabaseAdmin
      .from('pedidos')
      .select(`
        id, estado, total, created_at,
        pedido_lineas (id, nombre, cantidad, precio_unitario)
      `)
      .eq('id', pedidoId)
      .eq('guest_token_hash', tokenHash)
      .single();

    if (error || !pedido) {
      return NextResponse.json({ error: 'No se pudo recuperar el pedido' }, { status: 404 });
    }

    return NextResponse.json({ pedido });
  } catch (error) {
    console.error('Error recuperando resultado Stripe invitado:', error);
    return NextResponse.json({ error: 'No se pudo comprobar el pago' }, { status: 500 });
  }
}
