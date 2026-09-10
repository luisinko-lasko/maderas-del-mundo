import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { sessionId, accessToken } = await request.json();

    if (!sessionId || !accessToken) {
      return NextResponse.json(
        { error: 'Faltan datos' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'El pago todavía no está confirmado' },
        { status: 400 }
      );
    }

    const pedidoId = session.metadata?.pedido_id;

    if (!pedidoId) {
      return NextResponse.json(
        { error: 'La sesión no contiene pedido' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    );

    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select(`
        id,
        estado,
        total,
        created_at,
        pedido_lineas (
          id,
          nombre,
          cantidad,
          precio_unitario
        )
      `)
      .eq('id', pedidoId)
      .single();

    if (error || !pedido) {
      return NextResponse.json(
        { error: 'No se pudo recuperar el pedido' },
        { status: 404 }
      );
    }

    return NextResponse.json({ pedido });

  } catch (error) {
    console.error('Error recuperando resultado Stripe:', error);

    return NextResponse.json(
      { error: 'No se pudo comprobar el pago' },
      { status: 500 }
    );
  }
}
