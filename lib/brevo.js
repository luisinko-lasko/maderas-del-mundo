function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function dinero(valor) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(Number(valor || 0));
}

export async function enviarConfirmacionPedido(supabaseAdmin, pedidoId) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    return { enviado: false, motivo: 'brevo_no_configurado' };
  }

  const { data: reservado, error: reservaError } = await supabaseAdmin.rpc(
    'reservar_email_confirmacion',
    { p_pedido_id: pedidoId }
  );

  if (reservaError) throw reservaError;
  if (reservado !== true) {
    return { enviado: false, motivo: 'ya_enviado_o_reservado' };
  }

  try {
    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from('pedidos')
      .select(`
        id,
        user_id,
        total,
        entrega,
        nombre_entrega,
        apellidos_entrega,
        email_entrega,
        direccion_entrega,
        codigo_postal_entrega,
        poblacion_entrega,
        provincia_entrega,
        pais_entrega,
        pedido_lineas (
          id,
          nombre,
          cantidad,
          precio_unitario
        )
      `)
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedido) {
      throw pedidoError || new Error('Pedido no encontrado para enviar email');
    }

    let destinatario = pedido.email_entrega;

    if (!destinatario && pedido.user_id) {
      const { data: usuarioData, error: usuarioError } =
        await supabaseAdmin.auth.admin.getUserById(pedido.user_id);

      if (usuarioError) throw usuarioError;
      destinatario = usuarioData?.user?.email || null;
    }

    if (!destinatario) {
      throw new Error('El pedido no tiene correo de contacto');
    }

    const nombre = [pedido.nombre_entrega, pedido.apellidos_entrega]
      .filter(Boolean)
      .join(' ')
      .trim();

    const lineas = pedido.pedido_lineas || [];
    const filasHtml = lineas.map(linea => {
      const subtotal = Number(linea.cantidad || 0) * Number(linea.precio_unitario || 0);
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #ddd;">${escaparHtml(linea.nombre)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #ddd;text-align:center;">${Number(linea.cantidad || 0)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #ddd;text-align:right;">${escaparHtml(dinero(subtotal))}</td>
        </tr>`;
    }).join('');

    const lineasTexto = lineas.map(linea => {
      const subtotal = Number(linea.cantidad || 0) * Number(linea.precio_unitario || 0);
      return `${linea.cantidad} × ${linea.nombre}: ${dinero(subtotal)}`;
    }).join('\n');

    const entregaHtml = pedido.entrega === 'recogida'
      ? 'Recogida en mano'
      : [
          pedido.direccion_entrega,
          [pedido.codigo_postal_entrega, pedido.poblacion_entrega].filter(Boolean).join(' '),
          pedido.provincia_entrega,
          pedido.pais_entrega
        ].filter(Boolean).map(escaparHtml).join('<br>');

    const entregaTexto = pedido.entrega === 'recogida'
      ? 'Recogida en mano'
      : [
          pedido.direccion_entrega,
          [pedido.codigo_postal_entrega, pedido.poblacion_entrega].filter(Boolean).join(' '),
          pedido.provincia_entrega,
          pedido.pais_entrega
        ].filter(Boolean).join(', ');

    const numeroPedido = pedido.id.slice(0, 8).toUpperCase();
    const saludo = nombre ? `Hola ${escaparHtml(nombre)},` : 'Hola,';
    const correoAsociacion = 'contacto@maderasdelmundo.es';

    const htmlContent = `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f2f0e9;color:#161714;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:40px 24px;">
      <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6f7069;">Maderas del Mundo</p>
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:36px;margin:12px 0 24px;">Pedido confirmado</h1>
      <p>${saludo}</p>
      <p>Hemos recibido correctamente el pago de tu pedido <strong>${numeroPedido}</strong>.</p>

      <table style="width:100%;border-collapse:collapse;margin:28px 0;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 0;border-bottom:1px solid #888;">Artículo</th>
            <th style="text-align:center;padding:8px 0;border-bottom:1px solid #888;">Ud.</th>
            <th style="text-align:right;padding:8px 0;border-bottom:1px solid #888;">Importe</th>
          </tr>
        </thead>
        <tbody>${filasHtml}</tbody>
      </table>

      <p style="font-size:20px;"><strong>Total: ${escaparHtml(dinero(pedido.total))}</strong></p>

      <h2 style="font-family:Georgia,serif;font-weight:400;font-size:22px;margin-top:32px;">Entrega</h2>
      <p>${entregaHtml}</p>

      <p style="margin-top:32px;">Puedes consultar el estado de tus compras desde tu cuenta en Maderas del Mundo.</p>
      <p>Si necesitas ayuda, responde a este correo o escribe a <a href="mailto:${correoAsociacion}">${correoAsociacion}</a>.</p>
      <p style="margin-top:40px;font-size:12px;color:#6f7069;">Este es un correo transaccional relacionado con tu compra; no implica suscripción a comunicaciones comerciales.</p>
    </div>
  </body>
</html>`;

    const textContent = `${nombre ? `Hola ${nombre},` : 'Hola,'}\n\nHemos recibido correctamente el pago de tu pedido ${numeroPedido}.\n\n${lineasTexto}\n\nTotal: ${dinero(pedido.total)}\n\nEntrega: ${entregaTexto}\n\nPuedes consultar el estado de tus compras desde tu cuenta en Maderas del Mundo.\n\nContacto: ${correoAsociacion}`;

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
          email: process.env.BREVO_SENDER_EMAIL || correoAsociacion
        },
        to: [
          {
            email: destinatario,
            ...(nombre ? { name: nombre } : {})
          }
        ],
        bcc:
          destinatario.trim().toLowerCase() === correoAsociacion.toLowerCase()
            ? undefined
            : [
                {
                  email: correoAsociacion,
                  name: 'Maderas del Mundo'
                }
              ],
        replyTo: {
          email: correoAsociacion,
          name: 'Maderas del Mundo'
        },
        subject: `Pedido ${numeroPedido} confirmado · Maderas del Mundo`,
        htmlContent,
        textContent,
        headers: {
          idempotencyKey: pedido.id
        },
        tags: ['pedido-confirmado']
      }),
      cache: 'no-store'
    });

    const cuerpo = await respuesta.text();

    if (!respuesta.ok) {
      throw new Error(`Brevo rechazó el email (${respuesta.status}): ${cuerpo}`);
    }

    let resultado = {};
    try {
      resultado = cuerpo ? JSON.parse(cuerpo) : {};
    } catch {
      resultado = {};
    }

    const { error: marcarError } = await supabaseAdmin
      .from('pedidos')
      .update({
        email_confirmacion_reservada_at: null,
        email_confirmacion_enviada_at: new Date().toISOString(),
        brevo_confirmacion_message_id: resultado.messageId || null
      })
      .eq('id', pedidoId);

    if (marcarError) throw marcarError;

    return {
      enviado: true,
      messageId: resultado.messageId || null
    };
  } catch (error) {
    await supabaseAdmin
      .from('pedidos')
      .update({ email_confirmacion_reservada_at: null })
      .eq('id', pedidoId)
      .is('email_confirmacion_enviada_at', null);

    throw error;
  }
}
