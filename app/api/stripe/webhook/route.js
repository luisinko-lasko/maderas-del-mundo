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

    return NextResponse.json({ recibido: true });

  } catch (error) {
    console.error('Error procesando webhook:', error);

    return NextResponse.json(
      { error: 'No se pudo procesar el pago' },
      { status: 500 }
    );
  }
}
