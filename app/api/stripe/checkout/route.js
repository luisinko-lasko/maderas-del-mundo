import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { pedidoId, accessToken } = await request.json();

    if (!pedidoId || !accessToken) {
      return NextResponse.json(
        { error: 'Faltan datos del pedido' },
        { status: 400 }
      );
    }

    // Supabase actuando como el usuario autenticado
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

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select(`
        id,
        estado,
        total,
        reserva_hasta,
        email_entrega,
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

    if (!['reservado', 'pendiente_pago'].includes(pedido.estado)) {
      return NextResponse.json(
        { error: 'El pedido ya no se puede pagar' },
        { status: 400 }
      );
    }

    if (
      pedido.reserva_hasta &&
      new Date(pedido.reserva_hasta) <= new Date()
    ) {
      return NextResponse.json(
        { error: 'La reserva ha caducado' },
        { status: 400 }
      );
    }

    const line_items = pedido.pedido_lineas.map(linea => ({
      quantity: linea.cantidad,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(
          Number(linea.precio_unitario) * 100
        ),
        product_data: {
          name: linea.nombre
        }
      }
    }));

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: pedido.email_entrega || undefined,

      success_url:
        `${origin}/pago/correcto?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${origin}/checkout/${pedido.id}/pago`,

      metadata: {
        pedido_id: pedido.id
      }
    });

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
