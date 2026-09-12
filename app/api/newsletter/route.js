import { NextResponse } from 'next/server';

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  try {
    const { email, consentimiento } = await request.json();
    const correo = String(email || '').trim().toLowerCase();

    if (!emailValido(correo)) {
      return NextResponse.json(
        { error: 'Introduce un correo electrónico válido.' },
        { status: 400 }
      );
    }

    if (consentimiento !== true) {
      return NextResponse.json(
        { error: 'Debes autorizar el envío de novedades por correo.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listId = Number(process.env.BREVO_LIST_ID);
    const templateId = Number(process.env.BREVO_DOI_TEMPLATE_ID);

    if (!apiKey || !Number.isInteger(listId) || !Number.isInteger(templateId)) {
      console.error('Newsletter sin configurar: faltan variables de Brevo.');
      return NextResponse.json(
        { error: 'La suscripción por correo todavía no está disponible.' },
        { status: 503 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    const respuesta = await fetch(
      'https://api.brevo.com/v3/contacts/doubleOptinConfirmation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          email: correo,
          includeListIds: [listId],
          templateId,
          redirectionUrl: `${siteUrl}/newsletter/confirmado`
        }),
        cache: 'no-store'
      }
    );

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error('Brevo rechazó el alta DOI:', respuesta.status, detalle);

      return NextResponse.json(
        { error: 'No se pudo iniciar la suscripción. Inténtalo de nuevo.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error en newsletter:', error);

    return NextResponse.json(
      { error: 'No se pudo iniciar la suscripción.' },
      { status: 500 }
    );
  }
}
