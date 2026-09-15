'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import {
  leerCarrito,
  leerPedidoActivo,
  guardarPedidoActivo,
  borrarPedidoActivo,
  firmaCarrito
} from '../../lib/carrito';

export default function ContinuarCompraPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [procesando, setProcesando] = useState(false);

  async function cancelarInvitadoActivo(pedidoActivo) {
    if (!pedidoActivo?.id || !pedidoActivo?.guestToken) return;
    await fetch('/api/guest/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cancel',
        pedidoId: pedidoActivo.id,
        guestToken: pedidoActivo.guestToken
      })
    }).catch(() => {});
  }

  async function continuarAutenticado() {
    if (procesando) return;
    setProcesando(true);
    setMensaje('');

    try {
      const carrito = leerCarrito();
      if (!carrito.length) throw new Error('El carrito está vacío.');

      const firma = firmaCarrito(carrito);
      const pedidoActivo = leerPedidoActivo();

      if (pedidoActivo?.modo === 'invitado') {
        await cancelarInvitadoActivo(pedidoActivo);
        borrarPedidoActivo();
      } else if (pedidoActivo?.id) {
        const { data: pedidoBD } = await supabase
          .from('pedidos')
          .select('id, estado, reserva_hasta')
          .eq('id', pedidoActivo.id)
          .maybeSingle();

        const activo = pedidoBD &&
          ['reservado', 'pendiente_pago'].includes(pedidoBD.estado) &&
          (!pedidoBD.reserva_hasta || new Date(pedidoBD.reserva_hasta) > new Date());

        if (activo && pedidoActivo.firmaCarrito === firma) {
          router.replace(`/checkout/${pedidoActivo.id}`);
          return;
        }

        if (activo) {
          await supabase.rpc('cancelar_pedido', { p_pedido_id: pedidoActivo.id });
        }
        borrarPedidoActivo();
      }

      const datosPedido = carrito.map(item => ({
        tipo: item.tipo,
        id: item.id,
        cantidad: item.cantidad,
        caja_id: item.caja_id || null
      }));

      const { data: pedidoId, error } = await supabase.rpc(
        'crear_pedido_desde_carrito',
        { p_carrito: datosPedido }
      );
      if (error) throw error;

      guardarPedidoActivo(pedidoId, firma);
      router.replace(`/checkout/${pedidoId}`);
    } catch (error) {
      setMensaje(error?.message || 'No se pudo iniciar el pedido.');
      setProcesando(false);
    }
  }

  async function comprarComoInvitado() {
    if (procesando) return;
    setProcesando(true);
    setMensaje('');

    try {
      const carrito = leerCarrito();
      if (!carrito.length) throw new Error('El carrito está vacío.');
      const firma = firmaCarrito(carrito);
      const anterior = leerPedidoActivo();

      if (anterior?.modo === 'invitado' && anterior.guestToken) {
        if (anterior.firmaCarrito === firma) {
          const respuesta = await fetch('/api/guest/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'read',
              pedidoId: anterior.id,
              guestToken: anterior.guestToken
            })
          });

          if (respuesta.ok) {
            const { pedido } = await respuesta.json();
            if (
              pedido &&
              ['reservado', 'pendiente_pago'].includes(pedido.estado) &&
              (!pedido.reserva_hasta || new Date(pedido.reserva_hasta) > new Date())
            ) {
              router.replace(`/checkout/${anterior.id}`);
              return;
            }
          }
        }

        await cancelarInvitadoActivo(anterior);
        borrarPedidoActivo();
      }

      const datosPedido = carrito.map(item => ({
        tipo: item.tipo,
        id: item.id,
        cantidad: item.cantidad,
        caja_id: item.caja_id || null
      }));

      const respuesta = await fetch('/api/guest/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', carrito: datosPedido })
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(resultado.error || 'No se pudo iniciar la compra como invitado');
      }

      guardarPedidoActivo(resultado.pedidoId, firma, {
        modo: 'invitado',
        guestToken: resultado.guestToken
      });

      router.replace(`/checkout/${resultado.pedidoId}`);
    } catch (error) {
      setMensaje(error?.message || 'No se pudo iniciar la compra como invitado.');
      setProcesando(false);
    }
  }

  async function entrar(e) {
    e.preventDefault();
    setMensaje('');
    setProcesando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMensaje(
        error.code === 'email_not_confirmed'
          ? 'Debes confirmar tu correo electrónico antes de entrar.'
          : error.message
      );
      setProcesando(false);
      return;
    }

    setProcesando(false);
    await continuarAutenticado();
  }

  useEffect(() => {
    let activo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (activo && data.session) continuarAutenticado();
    });
    return () => { activo = false; };
  }, []);

  return (
    <main className="page-shell login-page">
      <div className="page-eyebrow">Maderas del mundo / Compra</div>
      <h1>Continuar compra</h1>
      <p>Compra sin crear una cuenta, o accede para guardar automáticamente tus piezas en Mi colección.</p>

      <div className="account-card" style={{ minHeight: 0, margin: '34px 0' }}>
        <span className="account-label">Sin registro</span>
        <strong>Comprar como invitado</strong>
        <p style={{ margin: '8px 0 20px' }}>
          Te pediremos los datos de contacto y envío antes del pago.
        </p>
        <button className="button dark" onClick={comprarComoInvitado} disabled={procesando}>
          {procesando ? 'Preparando…' : 'Comprar como invitado'}
        </button>
      </div>

      <h2 className="facts-title">Ya tengo cuenta</h2>

      <form className="login-form" onSubmit={entrar}>
        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label>
          Contraseña
          <span style={{ position: 'relative', display: 'block' }}>
            <input
              type={mostrarPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="current-password"
              style={{ paddingRight: '46px' }}
            />
            <button
              type="button"
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setMostrarPassword(!mostrarPassword)}
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 0,
                background: 'transparent',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              {mostrarPassword ? '◉' : '👁'}
            </button>
          </span>
        </label>

        <button type="submit" className="login-button" disabled={procesando}>
          {procesando ? 'Entrando…' : 'Entrar y continuar'}
        </button>
      </form>

      <p style={{ marginTop: '22px' }}>
        ¿No tienes cuenta? <Link href="/crear-cuenta?origen=compra">Crear cuenta</Link>
      </p>

      {mensaje && (
        <p className="login-message" role="status" aria-live="polite">
          {mensaje}
        </p>
      )}

      <p style={{ marginTop: '28px' }}>
        <Link href="/carrito">← Volver al carrito</Link>
      </p>
    </main>
  );
}
