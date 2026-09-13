import { NextResponse } from 'next/server';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { CONDICIONES_COMPRA_VERSION } from '../../../../lib/legal';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const supabasePublic = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function hashToken(token) {
  return createHash('sha256').update(String(token || '')).digest('hex');
}

async function obtenerPedido(pedidoId, guestToken) {
  if (!pedidoId || !guestToken) return null;
  const tokenHash = hashToken(guestToken);

  const { data, error } = await supabaseAdmin
    .from('pedidos')
    .select(`
      id, estado, total, reserva_hasta, entrega,
      nombre_entrega, apellidos_entrega, email_entrega, telefono_entrega,
      direccion_entrega, codigo_postal_entrega, poblacion_entrega,
      provincia_entrega, pais_entrega,
      condiciones_aceptadas_at, condiciones_version,
      stripe_checkout_session_id, stripe_checkout_expires_at,
      pedido_lineas (id, tipo, nombre, cantidad, precio_unitario)
    `)
    .eq('id', pedidoId)
    .eq('es_invitado', true)
    .eq('guest_token_hash', tokenHash)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

function texto(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'create') {
      const carrito = body.carrito;
      if (!Array.isArray(carrito) || carrito.length === 0) {
        return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
      }

      const guestToken = randomBytes(32).toString('hex');
      const guestTokenHash = hashToken(guestToken);
      const tempEmail = `guest-${randomUUID()}@maderasdelmundo.invalid`;
      const tempPassword = randomBytes(32).toString('hex');
      let tempUserId = null;

      try {
        const { data: creado, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: tempEmail,
          password: tempPassword,
          email_confirm: true
        });
        if (createError || !creado?.user) throw createError || new Error('No se pudo iniciar la compra como invitado');
        tempUserId = creado.user.id;

        const cliente = supabasePublic();
        const { error: signError } = await cliente.auth.signInWithPassword({
          email: tempEmail,
          password: tempPassword
        });
        if (signError) throw signError;

        const { data: pedidoId, error: pedidoError } = await cliente.rpc(
          'crear_pedido_desde_carrito',
          { p_carrito: carrito }
        );
        if (pedidoError || !pedidoId) throw pedidoError || new Error('No se pudo crear el pedido');

        const { error: marcarError } = await supabaseAdmin
          .from('pedidos')
          .update({
            user_id: null,
            es_invitado: true,
            guest_token_hash: guestTokenHash,
            updated_at: new Date().toISOString()
          })
          .eq('id', pedidoId)
          .eq('user_id', tempUserId);

        if (marcarError) {
          await cliente.rpc('cancelar_pedido', { p_pedido_id: pedidoId });
          throw marcarError;
        }

        await supabaseAdmin.auth.admin.deleteUser(tempUserId);
        tempUserId = null;

        return NextResponse.json({ pedidoId, guestToken });
      } finally {
        if (tempUserId) {
          await supabaseAdmin.auth.admin.deleteUser(tempUserId).catch(() => {});
        }
      }
    }

    const pedidoId = body.pedidoId;
    const guestToken = body.guestToken;
    const pedido = await obtenerPedido(pedidoId, guestToken);

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido de invitado no encontrado' }, { status: 404 });
    }

    if (action === 'read') {
      return NextResponse.json({ pedido });
    }

    if (action === 'save') {
      const form = body.form || {};
      const entrega = form.entrega;
      const nombre = texto(form.nombre);
      const apellidos = texto(form.apellidos);
      const email = texto(form.email);
      const telefono = texto(form.telefono);

      if (!['envio', 'recogida'].includes(entrega)) {
        return NextResponse.json({ error: 'Tipo de entrega no válido' }, { status: 400 });
      }
      if (!nombre || !apellidos || !email || !telefono) {
        return NextResponse.json({ error: 'Completa los datos de contacto' }, { status: 400 });
      }

      const direccion = texto(form.direccion);
      const codigoPostal = texto(form.codigo_postal);
      const poblacion = texto(form.poblacion);
      const provincia = texto(form.provincia);
      const pais = texto(form.pais) || 'España';

      if (entrega === 'envio' && (!direccion || !codigoPostal || !poblacion || !provincia || !pais)) {
        return NextResponse.json({ error: 'Completa la dirección de envío' }, { status: 400 });
      }

      if (!['reservado', 'pendiente_pago'].includes(pedido.estado)) {
        return NextResponse.json({ error: 'El pedido ya no puede modificarse' }, { status: 400 });
      }
      if (!pedido.reserva_hasta || new Date(pedido.reserva_hasta) <= new Date()) {
        return NextResponse.json({ error: 'La reserva ha caducado' }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from('pedidos')
        .update({
          entrega,
          nombre_entrega: nombre,
          apellidos_entrega: apellidos,
          email_entrega: email,
          telefono_entrega: telefono,
          direccion_entrega: entrega === 'envio' ? direccion : null,
          codigo_postal_entrega: entrega === 'envio' ? codigoPostal : null,
          poblacion_entrega: entrega === 'envio' ? poblacion : null,
          provincia_entrega: entrega === 'envio' ? provincia : null,
          pais_entrega: entrega === 'envio' ? pais : null,
          estado: 'pendiente_pago',
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoId)
        .eq('guest_token_hash', hashToken(guestToken));

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === 'accept') {
      if (body.version !== CONDICIONES_COMPRA_VERSION) {
        return NextResponse.json({ error: 'Versión de condiciones no válida' }, { status: 400 });
      }
      if (pedido.estado !== 'pendiente_pago') {
        return NextResponse.json({ error: 'El pedido no está listo para pagar' }, { status: 400 });
      }
      if (!pedido.reserva_hasta || new Date(pedido.reserva_hasta) <= new Date()) {
        return NextResponse.json({ error: 'La reserva ha caducado' }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from('pedidos')
        .update({
          condiciones_aceptadas_at: new Date().toISOString(),
          condiciones_version: CONDICIONES_COMPRA_VERSION,
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoId)
        .eq('guest_token_hash', hashToken(guestToken));
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === 'cancel') {
      const { error } = await supabaseAdmin.rpc('cancelar_pedido_invitado', {
        p_pedido_id: pedidoId,
        p_guest_token_hash: hashToken(guestToken)
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Guest order API:', error);
    return NextResponse.json(
      { error: error?.message || 'No se pudo procesar el pedido de invitado' },
      { status: 500 }
    );
  }
}
