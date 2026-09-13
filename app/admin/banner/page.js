'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import styles from './banner.module.css';

function fechaMadrid() {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const valores = Object.fromEntries(
    partes.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value])
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
}

export default function AdminBannerPage() {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [actualizado, setActualizado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function cargar() {
    const { data, error: cargaError } = await supabase.rpc('admin_obtener_banner');

    if (cargaError) {
      setError(cargaError.message);
      return;
    }

    const banner = data?.[0];
    setTexto(banner?.texto || '');
    setFechaInicio(banner?.fecha_inicio || '');
    setFechaFin(banner?.fecha_fin || '');
    setActualizado(banner?.updated_at || null);
  }

  useEffect(() => {
    let activo = true;

    async function iniciar() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!activo) return;

      if (userError || !user) {
        router.replace('/login');
        return;
      }

      const { data: esAdmin, error: adminError } = await supabase.rpc('es_admin');
      if (!activo) return;

      if (adminError || esAdmin !== true) {
        router.replace('/');
        return;
      }

      await cargar();
      if (activo) setCargando(false);
    }

    iniciar();
    return () => { activo = false; };
  }, [router]);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (texto.trim() && (!fechaInicio || !fechaFin)) {
      setError('Indica la fecha de inicio y la fecha de fin.');
      return;
    }

    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      setError('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }

    setGuardando(true);

    const { error: guardarError } = await supabase.rpc('admin_guardar_banner', {
      p_texto: texto,
      p_fecha_inicio: fechaInicio || null,
      p_fecha_fin: fechaFin || null
    });

    if (guardarError) {
      setError(guardarError.message);
      setGuardando(false);
      return;
    }

    await cargar();
    setMensaje(texto.trim() ? 'Banner guardado.' : 'Banner desactivado.');
    setGuardando(false);
  }

  async function desactivar() {
    if (!window.confirm('¿Desactivar el banner? El texto y las fechas se borrarán.')) return;

    setGuardando(true);
    setError('');
    setMensaje('');

    const { error: guardarError } = await supabase.rpc('admin_guardar_banner', {
      p_texto: '',
      p_fecha_inicio: null,
      p_fecha_fin: null
    });

    if (guardarError) {
      setError(guardarError.message);
      setGuardando(false);
      return;
    }

    setTexto('');
    setFechaInicio('');
    setFechaFin('');
    await cargar();
    setMensaje('Banner desactivado.');
    setGuardando(false);
  }

  function estado() {
    if (!texto.trim() || !fechaInicio || !fechaFin) return 'Inactivo';
    const hoy = fechaMadrid();
    if (hoy < fechaInicio) return 'Programado';
    if (hoy > fechaFin) return 'Finalizado';
    return 'Visible ahora';
  }

  function formatearActualizado(valor) {
    if (!valor) return 'Todavía no se ha configurado';
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Madrid'
    }).format(new Date(valor));
  }

  if (cargando) {
    return <main className="page-shell"><h1>Cargando banner…</h1></main>;
  }

  return (
    <main className="admin-page">
      <aside className="admin-side">
        <div className="brand-mark admin-logo">MDM</div>
        <strong>Administración</strong>
        <nav>
          <Link href="/admin">Inventario</Link>
          <Link href="/admin/catalogo">Catálogo</Link>
          <Link href="/admin/series">Series</Link>
          <Link href="/admin/pedidos">Pedidos</Link>
          <Link href="/admin/usuarios">Usuarios</Link>
          <Link href="/admin/banner" className="active">Banner</Link>
        </nav>
        <Link href="/">← Web pública</Link>
      </aside>

      <section className={`admin-main ${styles.shell}`}>
        <div className={styles.header}>
          <div>
            <div className="page-eyebrow">Administración / Banner</div>
            <h1>Banner público</h1>
            <p>
              Muestra un aviso de texto en toda la web durante las fechas indicadas.
              No lleva enlace ni botón y desaparece automáticamente al terminar el periodo.
            </p>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {mensaje && <p className={styles.notice}>{mensaje}</p>}

        <section className={styles.panel}>
          <div className={styles.statusRow}>
            <div>
              <strong>Estado</strong><br />
              <small>Último cambio: {formatearActualizado(actualizado)}</small>
            </div>
            <span className={styles.status}>{estado()}</span>
          </div>

          <form className={styles.form} onSubmit={guardar}>
            <label>
              Texto a mostrar
              <textarea
                value={texto}
                maxLength={500}
                placeholder="Ej.: Estaremos en el Mercado de Nápoles el próximo fin de semana."
                onChange={(e) => setTexto(e.target.value)}
              />
            </label>

            <div className={styles.meta}>
              <span>Si dejas el texto vacío, el banner quedará desactivado.</span>
              <span>{texto.length}/500</span>
            </div>

            <div className={styles.dates}>
              <label>
                Visible desde
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </label>

              <label>
                Visible hasta
                <input
                  type="date"
                  value={fechaFin}
                  min={fechaInicio || undefined}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </label>
            </div>

            <div className={styles.actions}>
              <button className="button dark" type="submit" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar banner'}
              </button>
              <button
                className={styles.secondary}
                type="button"
                disabled={guardando || !texto.trim()}
                onClick={desactivar}
              >
                Desactivar
              </button>
            </div>
          </form>

          {texto.trim() && (
            <div className={styles.preview}>
              <strong>Vista previa</strong>
              <div className={styles.previewBox}>{texto}</div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
