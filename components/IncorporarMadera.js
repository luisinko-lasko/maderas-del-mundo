'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import styles from './IncorporarMadera.module.css';

export default function IncorporarMadera({ madera }) {
  const [usuario, setUsuario] = useState(null);
  const [enColeccion, setEnColeccion] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (!activo) return;
        const user = data?.user;
        if (!user) { setCargando(false); return; }
        if (authError) throw authError;
        setUsuario(user);
        const { data: entrada, error: consultaError } = await supabase.from('coleccion_usuario')
          .select('id').eq('user_id', user.id).eq('madera_id', madera.id).maybeSingle();
        if (consultaError) throw consultaError;
        if (activo) setEnColeccion(Boolean(entrada));
        // El destino del registro se usa una sola vez, incluso si el correo se abre en otro dispositivo.
        if (String(user.user_metadata?.mdm_madera_pendiente) === String(madera.xilo_id)) {
          await supabase.auth.updateUser({ data: { mdm_madera_pendiente: null } });
        }
      } catch (err) {
        if (activo) setError(err.message || 'No se pudo consultar tu colección.');
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargar();
    return () => { activo = false; };
  }, [madera.id, madera.xilo_id]);

  async function añadir() {
    if (!usuario || guardando || enColeccion) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      const { error: guardarError } = await supabase.from('coleccion_usuario').insert({
        user_id: usuario.id, madera_id: madera.id,
        fecha_adquisicion: new Date().toISOString(), origen: 'añadida por el usuario'
      });
      if (guardarError && guardarError.code !== '23505') throw guardarError;
      setEnColeccion(true);
      setMensaje(guardarError ? 'Esta madera ya está en tu colección.' : 'Madera añadida a tu colección.');
    } catch (err) { setError(err.message || 'No se pudo añadir la madera.'); }
    finally { setGuardando(false); }
  }

  async function quitar() {
    if (!usuario || guardando || !window.confirm(`¿Quitar ${madera.nombre} de tu colección?`)) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      const { error: quitarError } = await supabase.from('coleccion_usuario').delete()
        .eq('user_id', usuario.id).eq('madera_id', madera.id);
      if (quitarError) throw quitarError;
      setEnColeccion(false); setMensaje('Madera quitada de tu colección.');
    } catch (err) { setError(err.message || 'No se pudo quitar la madera.'); }
    finally { setGuardando(false); }
  }

  return (
    <main className="page-shell">
      <div className="page-eyebrow">Mi colección / Añadir una madera</div>
      <section className={styles.panel}>
        <img className={styles.imagen} src={madera.imagen_url || '/sin-imagen-madera.jpg'} alt={`Madera de ${madera.nombre}`} />
        <div>
          <p>#{String(madera.xilo_id).padStart(3, '0')}</p>
          <h1>{madera.nombre}</h1>
          <p className="latin">{madera.nombre_cientifico}</p>
          <p>¿Tienes una pieza de esta madera? Incorpora la especie a tu colección personal.</p>
          {cargando ? <p role="status">Comprobando tu colección…</p> : usuario ? (
            <div className={styles.acciones}>
              {enColeccion ? <><p role="status">Esta madera ya está en tu colección.</p>
                <button className="button" onClick={quitar} disabled={guardando}>Quitar de mi colección</button></> :
                <button className="button dark" onClick={añadir} disabled={guardando || Boolean(error)}>
                  {guardando ? 'Guardando…' : 'Añadir a mi colección'}
                </button>}
              <Link href="/coleccion">Ver mi colección →</Link>
            </div>
          ) : (
            <div className={styles.acciones}>
              <Link className="button dark" href={`/login?madera=${madera.xilo_id}`}>Entrar para añadir</Link>
              <Link href={`/crear-cuenta?madera=${madera.xilo_id}`}>Crear una cuenta</Link>
            </div>
          )}
          {mensaje && <p role="status" aria-live="polite">{mensaje}</p>}
          {error && <p role="alert">{error} <button className="button" onClick={() => window.location.reload()}>Reintentar</button></p>}
          <p className={styles.ficha}><Link href={`/catalogo/${madera.slug}`}>Ver ficha completa →</Link></p>
        </div>
      </section>
    </main>
  );
}
