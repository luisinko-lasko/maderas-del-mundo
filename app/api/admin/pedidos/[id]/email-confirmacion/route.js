import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enviarConfirmacionPedido } from '../../../../../../lib/brevo';

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

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization') || '';
    const accessToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!id || !accessToken) {
      return NextResponse.json(
        { error: 'Falta la sesión o el pedido.' },
        { status: 401 }
      );
    }

    const supabase = crearSupabaseUsuario(accessToken);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Sesión no válida.' },
        { status: 401 }
      );
    }

    const { data: esAdmin, error: adminError } = await supabase.rpc('es_admin');

    if (adminError || esAdmin !== true) {
      return NextResponse.json(
        { error: 'Acceso denegado.' },
        { status: 403 }
      );
    }

    const resultado = await enviarConfirmacionPedido(supabaseAdmin, id);

    if (resultado.enviado) {
      return NextResponse.json({ ok: true, messageId: resultado.messageId || null });
    }

    if (resultado.motivo === 'brevo_no_configurado') {
      return NextResponse.json(
        { error: 'Brevo todavía no está configurado en Vercel.' },
        { status: 503 }
      );
    }

    if (resultado.motivo === 'ya_enviado_o_reservado') {
      return NextResponse.json(
        { error: 'La confirmación ya fue enviada o se está enviando.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'No se pudo enviar la confirmación.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error enviando confirmación manual:', error);

    return NextResponse.json(
      { error: error.message || 'No se pudo enviar la confirmación.' },
      { status: 500 }
    );
  }
}
