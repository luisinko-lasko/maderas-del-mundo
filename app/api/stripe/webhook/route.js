import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request) {
  const firma = request.headers.get('stripe-signature');

  if (!firma) {
    return NextResponse.json(
      { error: 'Falta la firma de Stripe' },
      { status: 400 }
    );
  }

  let evento;

  try {
    const cuerpo = await request.text();

    evento = stripe.webhooks.constructEvent(
      cuerpo,
      firma,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Firma webhook incorrecta:', error.message);

    return NextResponse.json(
      { error: 'Firma incorrecta' },
      { status: 400 }
    );
  }

  try {
    if (
      evento.type === 'checkout.session.completed' ||
      evento.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = evento.data.object;

      if (session.payment_status === 'paid') {
        const pedidoId = session.metadata?.pedido_id;

        if (!pedidoId) {
          throw new Error('Stripe no devolvió pedido_id');
        }

        const { data: pedido, error: pedidoError } = await supabaseAdmin
          .from('pedidos')
          .select('id, estado, stripe_checkout_session_id')
          .eq('id', pedidoId)
          .single();

        if (pedidoError || !pedido) {
          throw pedidoError || new Error('Pedido no encontrado');
        }

        if (
          pedido.stripe_checkout_session_id &&
          pedido.stripe_checkout_session_id !== session.id
        ) {
          throw new Error('La sesión Stripe no corresponde al pedido');
        }

        // En el improbable caso de que el pago termine antes de que la API
        // haya guardado el ID de sesión, lo registramos desde el webhook firmado.
        if (!pedido.stripe_checkout_session_id) {
          const { error: registrarError } = await supabaseAdmin
            .from('pedidos')
            .update({ stripe_checkout_session_id: session.id })
            .eq('id', pedidoId)
            .eq('estado', 'pendiente_pago');

          if (registrarError) throw registrarError;
        }

        const { error } = await supabaseAdmin.rpc(
          'confirmar_pago_stripe',
          {
            p_pedido_id: pedidoId
          }
        );

        if (error) {
          throw error;
        }

        console.log('✓ Pedido pagado:', pedidoId);
      }
    }

    if (evento.type === 'checkout.session.expired') {
      const session = evento.data.object;
      const pedidoId = session.metadata?.pedido_id;

      if (pedidoId) {
        // Solo caducamos si ESTA sigue siendo la sesión activa del pedido.
        // Así un evento antiguo nunca puede liberar piezas de una sesión nueva.
        const { data: actualizado, error: expirarError } = await supabaseAdmin
          .from('pedidos')
          .update({
            reserva_hasta: new Date(Date.now() - 1000).toISOString()
          })
          .eq('id', pedidoId)
          .eq('estado', 'pendiente_pago')
          .eq('stripe_checkout_session_id', session.id)
          .select('id')
          .maybeSingle();

        if (expirarError) throw expirarError;

        if (actualizado) {
          const { error: caducarError } = await supabaseAdmin.rpc(
            'caducar_reservas_vencidas'
          );

          if (caducarError) throw caducarError;

          console.log('✓ Reserva Stripe caducada:', pedidoId);
        }
      }
    }

    return NextResponse.json({ recibido: true });

  } catch (error) {
    console.error('Error procesando webhook:', error);

    return NextResponse.json(
      { error: 'No se pudo procesar el pago' },
      { status: 500 }
    );
  }
}
