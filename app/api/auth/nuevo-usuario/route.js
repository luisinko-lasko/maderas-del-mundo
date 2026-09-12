import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function POST(request) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Faltan datos del usuario' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    const usuario = data?.user;

    if (error || !usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if ((usuario.email || '').toLowerCase() !== String(email).toLowerCase()) {
      return NextResponse.json(
        { error: 'El correo no corresponde al usuario' },
        { status: 403 }
      );
    }

    if (!usuario.email_confirmed_at) {
      return NextResponse.json(
        { error: 'El usuario todavía no ha confirmado el correo' },
        { status: 409 }
      );
    }

    const confirmadoEn = new Date(usuario.email_confirmed_at).getTime();
    const antiguedadConfirmacion = Date.now() - confirmadoEn;

    if (
      !Number.isFinite(confirmadoEn) ||
      antiguedadConfirmacion < -60_000 ||
      antiguedadConfirmacion > 15 * 60_000
    ) {
      return NextResponse.json(
        { error: 'La confirmación no es reciente' },
        { status: 403 }
      );
    }

    if (usuario.app_metadata?.contacto_notificado_nuevo_usuario) {
      return NextResponse.json({ enviado: true, yaNotificado: true });
    }

    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Brevo no está configurado' },
        { status: 503 }
      );
    }

    const fechaAlta = new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Madrid'
    }).format(new Date(usuario.created_at));

    const fechaConfirmacion = new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Madrid'
    }).format(new Date(usuario.email_confirmed_at));

    const htmlContent = `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f2f0e9;color:#161714;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:40px 24px;">
      <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6f7069;">Maderas del Mundo</p>
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:32px;margin:12px 0 24px;">Nuevo usuario confirmado</h1>
      <p>Un nuevo usuario ha confirmado su dirección de correo y ya tiene la cuenta activa.</p>
      <p><strong>Correo:</strong> ${escaparHtml(usuario.email)}</p>
      <p><strong>Alta:</strong> ${escaparHtml(fechaAlta)}</p>
      <p><strong>Confirmación:</strong> ${escaparHtml(fechaConfirmacion)}</p>
      <p style="margin-top:32px;font-size:12px;color:#6f7069;">ID de usuario: ${escaparHtml(usuario.id)}</p>
    </div>
  </body>
</html>`;

    const textContent = `Nuevo usuario confirmado en Maderas del Mundo\n\nCorreo: ${usuario.email}\nAlta: ${fechaAlta}\nConfirmación: ${fechaConfirmacion}\nID: ${usuario.id}`;

    const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'Maderas del Mundo',
          email: process.env.BREVO_SENDER_EMAIL || 'contacto@maderasdelmundo.es'
        },
        to: [
          {
            email: 'contacto@maderasdelmundo.es',
            name: 'Maderas del Mundo'
          }
        ],
        replyTo: {
          email: usuario.email
        },
        subject: `Nuevo usuario confirmado · ${usuario.email}`,
        htmlContent,
        textContent,
        tags: ['nuevo-usuario-confirmado']
      }),
      cache: 'no-store'
    });

    const cuerpo = await respuesta.text();

    if (!respuesta.ok) {
      throw new Error(`Brevo rechazó la notificación (${respuesta.status}): ${cuerpo}`);
    }

    await supabaseAdmin.auth.admin.updateUserById(usuario.id, {
      app_metadata: {
        ...(usuario.app_metadata || {}),
        contacto_notificado_nuevo_usuario: true,
        contacto_notificado_nuevo_usuario_at: new Date().toISOString()
      }
    });

    return NextResponse.json({ enviado: true });
  } catch (error) {
    console.error('Error notificando nuevo usuario:', error);

    return NextResponse.json(
      { error: 'No se pudo enviar la notificación de nuevo usuario' },
      { status: 500 }
    );
  }
}
