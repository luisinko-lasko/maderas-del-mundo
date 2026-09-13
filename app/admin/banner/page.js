'use client';

import { useEffect, useMemo, useState } from 'react';
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

function formatearFecha(fecha) {
  if (!fecha) return '';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(`${fecha}T12:00:00`));
}

export default function AdminBannerPage() {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [texto, setTexto] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function cargar() {
    const { data, error: cargaError } = await supabase.rpc('admin_listar_banners');

    if (cargaError) {
      setError(cargaError.message);
      return;
    }

    setBanners(data || []);
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

  const hoy = fechaMadrid();

  const bannerVisibleId = useMemo(() => {
    const activos = banners.filter(
      (banner) => banner.fecha_inicio <= hoy && banner.fecha_fin >= hoy
    );
    return activos[0]?.id || null;
  }, [banners, hoy]);

  function limpiarFormulario() {
    setEditandoId(null);
    setTexto('');
    setFechaInicio('');
    setFechaFin('');
  }

  function editar(banner) {
    setEditandoId(banner.id);
    setTexto(banner.texto || '');
    setFechaInicio(banner.fecha_inicio || '');
    setFechaFin(banner.fecha_fin || '');
    setError('');
    setMensaje('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (!texto.trim()) {
      setError('Escribe el texto del banner.');
      return;
    }

    if (!fechaInicio || !fechaFin) {
      setError('Indica la fecha de inicio y la fecha de fin.');
      return;
    }

    if (fechaFin < fechaInicio) {
      setError('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }

    setGuardando(true);

    const { error: guardarError } = await supabase.rpc('admin_guardar_banner', {
      p_id: editandoId,
      p_texto: texto,
      p_fecha_inicio: fechaInicio,
      p_fecha_fin: fechaFin
    });

    if (guardarError) {
      setError(guardarError.message);
      setGuardando(false);
      return;
    }

    const eraEdicion = Boolean(editandoId);
    limpiarFormulario();
    await cargar();
    setMensaje(eraEdicion ? 'Banner actualizado.' : 'Banner añadido.');
    setGuardando(false);
  }

  async function borrar(banner) {
    if (!window.confirm(`¿Borrar este banner?\n\n${banner.texto}`)) return;

    setError('');
    setMensaje('');

    const { error: borrarError } = await supabase.rpc('admin_borrar_banner', {
      p_id: banner.id
    });

    if (borrarError) {
      setError(borrarError.message);
      return;
    }

    if (editandoId === banner.id) limpiarFormulario();
    await cargar();
    setMensaje('Banner borrado.');
  }

  function estado(banner) {
    if (hoy < banner.fecha_inicio) return 'Programado';
    if (hoy > banner.fecha_fin) return 'Finalizado';
    if (banner.id === bannerVisibleId) return 'Visible ahora';
    return 'Activo · tiene prioridad otro más reciente';
  }

  if (cargando) {
    return <main className="page-shell"><h1>Cargando banners…</h1></main>;
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
            <h1>Banners públicos</h1>
            <p>
              Puedes dejar varios avisos programados. Si coinciden en fechas,
              se muestra el último que hayas creado; los anteriores quedan como respaldo.
            </p>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {mensaje && <p className={styles.notice}>{mensaje}</p>}

        <section className={styles.panel}>
          <div className={styles.statusRow}>
            <div>
              <strong>{editandoId ? 'Editar banner' : 'Añadir banner'}</strong><br />
              <small>Solo texto, sin enlace ni botón.</small>
            </div>
            {editandoId && <span className={styles.status}>Editando</span>}
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
              <span>Máximo 500 caracteres.</span>
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
                {guardando
                  ? 'Guardando…'
                  : editandoId
                    ? 'Guardar cambios'
                    : 'Añadir banner'}
              </button>

              {editandoId && (
                <button
                  className={styles.secondary}
                  type="button"
                  disabled={guardando}
                  onClick={limpiarFormulario}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>

          {texto.trim() && (
            <div className={styles.preview}>
              <strong>Vista previa</strong>
              <div className={styles.previewBox}>{texto}</div>
            </div>
          )}
        </section>

        <section className={styles.listSection}>
          <div className={styles.listHeader}>
            <h2>Programados</h2>
            <span>{banners.length} {banners.length === 1 ? 'banner' : 'banners'}</span>
          </div>

          {banners.length === 0 ? (
            <div className={styles.empty}>No hay ningún banner programado.</div>
          ) : (
            <div className={styles.bannerList}>
              {banners.map((banner) => (
                <article className={styles.bannerCard} key={banner.id}>
                  <div className={styles.bannerCardTop}>
                    <span className={styles.status}>{estado(banner)}</span>
                    <span className={styles.period}>
                      {formatearFecha(banner.fecha_inicio)} — {formatearFecha(banner.fecha_fin)}
                    </span>
                  </div>

                  <p>{banner.texto}</p>

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() => editar(banner)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={styles.danger}
                      onClick={() => borrar(banner)}
                    >
                      Borrar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
