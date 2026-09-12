import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { enviarConfirmacionPedido } from '../../../../lib/brevo';

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
    const { sessionId, accessToken } = await request.json();

    if (!sessionId || !accessToken) {
      return NextResponse.json(
        { error: 'Faltan datos' },
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

    if (session.metadata?.user_id && session.metadata.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Esta sesión de pago no pertenece al usuario' },
        { status: 403 }
      );
    }

    // Comprobamos la propiedad del pedido ANTES de ejecutar ninguna
    // operación administrativa. RLS limita esta lectura al propio usuario.
    const { data: pedidoPropio, error: pedidoPropioError } = await supabase
      .from('pedidos')
      .select('id, stripe_checkout_session_id')
      .eq('id', pedidoId)
      .single();

    if (pedidoPropioError || !pedidoPropio) {
      return NextResponse.json(
        { error: 'No se pudo recuperar el pedido' },
        { status: 404 }
      );
    }

    if (
      pedidoPropio.stripe_checkout_session_id &&
      pedidoPropio.stripe_checkout_session_id !== session.id
    ) {
      return NextResponse.json(
        { error: 'La sesión de pago no corresponde al pedido actual' },
        { status: 400 }
      );
    }

    // Segunda vía de confirmación además del webhook. La función de base
    // de datos es idempotente, incluso si el pedido ya ha avanzado en
    // preparación, envío o entrega.
    const { error: confirmacionError } = await supabaseAdmin.rpc(
      'confirmar_pago_stripe',
      {
        p_pedido_id: pedidoId
      }
    );

    if (confirmacionError) {
      console.error(
        'Error confirmando pedido tras volver de Stripe:',
        confirmacionError
      );

      return NextResponse.json(
        {
          error:
            'El pago está confirmado en Stripe, pero no se pudo actualizar el pedido'
        },
        { status: 500 }
      );
    }

    // Enviamos también la confirmación desde esta vía de respaldo. La función
    // de Brevo es idempotente, así que si el webhook ya la envió no se duplica.
    try {
      const email = await enviarConfirmacionPedido(
        supabaseAdmin,
        pedidoId
      );

      if (email.enviado) {
        console.log('✓ Confirmación por email enviada desde resultado:', pedidoId);
      } else {
        console.log('ℹ Confirmación por email no enviada desde resultado:', pedidoId, email.motivo);
      }
    } catch (emailError) {
      // El pago ya está confirmado: un fallo de correo no debe convertir la
      // página de éxito en un error de pago. Queda registrado para diagnóstico.
      console.error(
        'Error enviando confirmación por email tras volver de Stripe:',
        emailError
      );
    }

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
