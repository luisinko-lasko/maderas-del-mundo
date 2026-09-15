'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function CrearCuentaPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [correoEnviado, setCorreoEnviado] = useState(false);

  function vieneDeCompra() {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('origen') === 'compra';
  }

  async function crearCuenta(e) {
    e.preventDefault();
    setMensaje('');

    if (!email) {
      setMensaje('Escribe tu correo electrónico.');
      return;
    }

    if (password.length < 8) {
      setMensaje('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setEnviando(true);
    const compra = vieneDeCompra();
    const destino = compra ? '/continuar-compra' : '/login';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${destino}`
      }
    });

    if (error) {
      setMensaje(error.message);
      setEnviando(false);
      return;
    }

    if (data?.session) {
      router.replace(destino);
      return;
    }

    setCorreoEnviado(true);
    setEnviando(false);
  }

  const compra = typeof window !== 'undefined' && vieneDeCompra();
  const volverHref = compra ? '/continuar-compra' : '/login';

  if (correoEnviado) {
    return (
      <main className="page-shell login-page">
        <div className="page-eyebrow">Mi cuenta</div>
        <h1>Revisa tu correo</h1>
        <p>
          Te hemos enviado un mensaje a <strong>{email}</strong> para confirmar tu cuenta.
          Pulsa el enlace del correo para terminar el registro.
        </p>
        <p style={{ marginTop: '28px' }}>
          <Link href={volverHref}>← Volver a iniciar sesión</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="page-shell login-page">
      <div className="page-eyebrow">Mi cuenta</div>
      <h1>Crear cuenta</h1>
      <p>
        Al crear la cuenta te enviaremos un correo de confirmación. Tendrás que abrirlo
        y pulsar el enlace para terminar el registro.
      </p>

      <form className="login-form" onSubmit={crearCuenta}>
        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
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
                fontSize: '18px',
                padding: '8px'
              }}
            >
              {mostrarPassword ? '◉' : '👁'}
            </button>
          </span>
          <small>Al menos 8 caracteres.</small>
        </label>

        <button type="submit" className="login-button" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      {mensaje && (
        <p className="login-message" role="status" aria-live="polite">
          {mensaje}
        </p>
      )}

      <p style={{ marginTop: '28px' }}>
        ¿Ya tienes cuenta? <Link href={volverHref}>Volver a iniciar sesión</Link>
      </p>
    </main>
  );
}
