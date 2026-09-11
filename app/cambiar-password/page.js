'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function CambiarPasswordPage() {
  const [lista, setLista] = useState(false);
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarRepetir, setMostrarRepetir] = useState(false);
  const [mensaje, setMensaje] = useState('Comprobando enlace…');
  const [guardando, setGuardando] = useState(false);
  const [terminado, setTerminado] = useState(false);

  useEffect(() => {
    let activo = true;

    async function comprobar() {
      const { data } = await supabase.auth.getSession();
      if (!activo) return;

      if (data?.session?.user) {
        setLista(true);
        setMensaje('');
      } else {
        setMensaje('El enlace no es válido o ha caducado.');
      }
    }

    comprobar();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!activo) return;
      if (session?.user) {
        setLista(true);
        setMensaje('');
      }
    });

    return () => {
      activo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function guardar(e) {
    e.preventDefault();
    setMensaje('');

    if (password.length < 8) {
      setMensaje('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== repetir) {
      setMensaje('Las dos contraseñas no coinciden.');
      return;
    }

    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMensaje(error.message);
      setGuardando(false);
      return;
    }

    setTerminado(true);
    setMensaje('Contraseña cambiada correctamente.');
    setGuardando(false);
  }

  function campoPassword(valor, onChange, visible, setVisible, etiqueta) {
    return (
      <span style={{ position: 'relative', display: 'block' }}>
        <input
          type={visible ? 'text' : 'password'}
          minLength={8}
          required
          value={valor}
          onChange={onChange}
          style={{ paddingRight: '46px' }}
        />
        <button
          type="button"
          aria-label={visible ? `Ocultar ${etiqueta}` : `Mostrar ${etiqueta}`}
          title={visible ? `Ocultar ${etiqueta}` : `Mostrar ${etiqueta}`}
          onClick={() => setVisible(!visible)}
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
          {visible ? '◉' : '👁'}
        </button>
      </span>
    );
  }

  return (
    <main className="page-shell login-page">
      <div className="page-eyebrow">Mi cuenta</div>
      <h1>Cambiar contraseña</h1>

      {!terminado && lista && (
        <form className="login-form" onSubmit={guardar}>
          <label>
            Nueva contraseña
            {campoPassword(
              password,
              (e) => setPassword(e.target.value),
              mostrarPassword,
              setMostrarPassword,
              'contraseña'
            )}
          </label>

          <label>
            Repetir contraseña
            {campoPassword(
              repetir,
              (e) => setRepetir(e.target.value),
              mostrarRepetir,
              setMostrarRepetir,
              'contraseña repetida'
            )}
          </label>

          <button className="login-button" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar nueva contraseña'}
          </button>
        </form>
      )}

      {mensaje && <p className="login-message">{mensaje}</p>}

      {terminado && <Link href="/login">Ir a Mi cuenta →</Link>}
    </main>
  );
}
