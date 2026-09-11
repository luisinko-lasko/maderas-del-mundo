'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function CambiarPasswordPage() {
  const [lista, setLista] = useState(false);
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
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

  return (
    <main className="page-shell login-page">
      <div className="page-eyebrow">Mi cuenta</div>
      <h1>Cambiar contraseña</h1>

      {!terminado && lista && (
        <form className="login-form" onSubmit={guardar}>
          <label>
            Nueva contraseña
            <input
              type="password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label>
            Repetir contraseña
            <input
              type="password"
              minLength={8}
              required
              value={repetir}
              onChange={(e) => setRepetir(e.target.value)}
            />
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
