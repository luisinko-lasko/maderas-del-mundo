'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import styles from './catalogo.module.css';

const FORM_VACIO = {
  imagen_url: '',
  imagen_commons_page: '',
  imagen_fuente: '',
  imagen_autor: '',
  imagen_licencia: '',
  imagen_verificada: false
};

export default function AdminCatalogo() {
  const router = useRouter();
  const [maderas, setMaderas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);

  async function cargarCatalogo() {
    setError(null);

    const { data, error: catalogoError } = await supabase.rpc(
      'admin_listar_catalogo'
    );

    if (catalogoError) {
      setError(catalogoError.message);
      setCargando(false);
      return;
    }

    setMaderas(data || []);
    setCargando(false);
  }

  useEffect(() => {
    let activo = true;

    async function iniciar() {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (!activo) return;

      if (userError || !user) {
        router.replace('/login');
        return;
      }

      const { data: esAdmin, error: adminError } =
        await supabase.rpc('es_admin');

      if (!activo) return;

      if (adminError || esAdmin !== true) {
        router.replace('/');
        return;
      }

      await cargarCatalogo();
    }

    iniciar();

    return () => {
      activo = false;
    };
  }, [router]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase('es');

    return maderas.filter(madera => {
      if (filtro === 'sin_precio' && madera.precio !== null) return false;
      if (filtro === 'sin_imagen' && madera.imagen_url) return false;
      if (
        filtro === 'pendiente_imagen' &&
        (!madera.imagen_url || madera.imagen_verificada)
      ) return false;
      if (filtro === 'no_publicadas' && madera.publicada) return false;

      if (!q) return true;

      const texto = [
        madera.xilo_id,
        madera.nombre,
        madera.nombre_ingles,
        madera.otros_nombres,
        madera.nombre_cientifico,
        madera.familia
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('es');

      return texto.includes(q);
    });
  }, [maderas, busqueda, filtro]);

  const stats = useMemo(() => ({
    total: maderas.length,
    publicadas: maderas.filter(m => m.publicada).length,
    conPrecio: maderas.filter(m => m.precio !== null).length,
    sinImagen: maderas.filter(m => !m.imagen_url).length,
    pendientesImagen: maderas.filter(
      m => m.imagen_url && !m.imagen_verificada
    ).length
  }), [maderas]);

  function editar(madera) {
    setEditando(madera.id);
    setMensaje('');
    setError(null);
    setForm({
      imagen_url: madera.imagen_url || '',
      imagen_commons_page: madera.imagen_commons_page || '',
      imagen_fuente: madera.imagen_fuente || '',
      imagen_autor: madera.imagen_autor || '',
      imagen_licencia: madera.imagen_licencia || '',
      imagen_verificada: Boolean(madera.imagen_verificada)
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicion() {
    setEditando(null);
    setForm(FORM_VACIO);
    setMensaje('');
    setError(null);
  }

  async function guardar(e) {
    e.preventDefault();

    setGuardando(true);
    setError(null);
    setMensaje('');

    const { error: guardarError } = await supabase.rpc(
      'admin_actualizar_catalogo_web',
      {
        p_madera_id: editando,
        p_imagen_url: form.imagen_url,
        p_imagen_commons_page: form.imagen_commons_page,
        p_imagen_fuente: form.imagen_fuente,
        p_imagen_autor: form.imagen_autor,
        p_imagen_licencia: form.imagen_licencia,
        p_imagen_verificada: form.imagen_verificada
      }
    );

    if (guardarError) {
      setError(guardarError.message);
      setGuardando(false);
      return;
    }

    await cargarCatalogo();
    setMensaje('Cambios de imagen guardados. Los datos de la hoja MDM no se han modificado.');
    setEditando(null);
    setForm(FORM_VACIO);
    setGuardando(false);
  }

  function euros(valor) {
    if (valor === null || valor === undefined) return '—';

    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(valor));
  }

  if (cargando) {
    return (
      <main className="page-shell">
        <h1>Cargando catálogo…</h1>
      </main>
    );
  }

  const maderaEditando = maderas.find(m => m.id === editando);

  return (
    <main className="admin-page">
      <aside className="admin-side">
        <div className="brand-mark admin-logo">MDM</div>
        <strong>Administración</strong>

        <nav>
          <Link href="/admin">Inventario</Link>
          <Link href="/admin/catalogo" className="active">Catálogo</Link>
          <Link href="/admin/series">Series</Link>
          <Link href="/admin/produccion">Producción</Link>
          <Link href="/admin/pedidos">Pedidos</Link>
          <Link href="/admin/usuarios">Usuarios</Link>
        </nav>

        <Link href="/">← Web pública</Link>
      </aside>

      <section className="admin-main">
        <div className="admin-top">
          <div>
            <div className="page-eyebrow">Administración / Catálogo</div>
            <h1>Catálogo</h1>
            <p className={styles.intro}>
              Los datos maestros, incluido el precio, proceden de la hoja MDM y son solo lectura.
              Aquí se gestionan únicamente los datos de imagen.
            </p>
          </div>

          <Link href="/catalogo" className="button">
            Ver catálogo público
          </Link>
        </div>

        {error && <p className="admin-error">{error}</p>}
        {mensaje && <p className={styles.notice}>{mensaje}</p>}

        {maderaEditando && (
          <form className={styles.editor} onSubmit={guardar}>
            <div className={styles.editorHead}>
              <div>
                <span className="page-eyebrow">Edición web</span>
                <h2>
                  #{String(maderaEditando.xilo_id).padStart(3, '0')} · {maderaEditando.nombre}
                </h2>
              </div>
              <button type="button" className="button" onClick={cancelarEdicion}>
                Cerrar
              </button>
            </div>

            <div className={styles.editorGrid}>
              <section className={styles.masterData}>
                <div className={styles.sectionTitle}>
                  <strong>Datos maestros · hoja MDM</strong>
                  <span>Solo lectura</span>
                </div>

                <dl className={styles.masterGrid}>
                  <div><dt># Xilo</dt><dd>{maderaEditando.xilo_id}</dd></div>
                  <div><dt>Nombre</dt><dd>{maderaEditando.nombre || '—'}</dd></div>
                  <div><dt>Inglés</dt><dd>{maderaEditando.nombre_ingles || '—'}</dd></div>
                  <div><dt>Otros nombres</dt><dd>{maderaEditando.otros_nombres || '—'}</dd></div>
                  <div><dt>Nombre científico</dt><dd><em>{maderaEditando.nombre_cientifico || '—'}</em></dd></div>
                  <div><dt>Familia</dt><dd>{maderaEditando.familia || '—'}</dd></div>
                  <div><dt>Densidad</dt><dd>{maderaEditando.densidad_seco_15 ? `${maderaEditando.densidad_seco_15} kg/m³` : '—'}</dd></div>
                  <div><dt>Janka</dt><dd>{maderaEditando.janka_lbf ? `${maderaEditando.janka_lbf} lbf` : '—'}</dd></div>
                  <div><dt>Dureza</dt><dd>{maderaEditando.dureza || '—'}</dd></div>
                  <div><dt>Publicada</dt><dd>{maderaEditando.publicada ? 'Sí' : 'No'}</dd></div>
                  <div><dt>PVP</dt><dd>{euros(maderaEditando.precio)}</dd></div>
                  <div><dt>CITES</dt><dd>{maderaEditando.cites || '—'}</dd></div>
                  <div><dt>UE</dt><dd>{maderaEditando.ue || '—'}</dd></div>
                  <div className={styles.wide}><dt>Origen</dt><dd>{maderaEditando.origen || '—'}</dd></div>
                </dl>

                <p className={styles.lockNote}>
                  Para cambiar cualquiera de estos datos hay que modificar la hoja MDM y volver a importar.
                </p>
              </section>

              <section className={styles.webData}>
                <div className={styles.sectionTitle}>
                  <strong>Datos propios de la web</strong>
                  <span>Imagen · editable</span>
                </div>


                <label>
                  URL de la imagen
                  <input
                    value={form.imagen_url}
                    onChange={e => setForm({ ...form, imagen_url: e.target.value })}
                    placeholder="https://…"
                  />
                </label>

                {form.imagen_url && (
                  <div className={styles.preview}>
                    <img src={form.imagen_url} alt="Previsualización de la madera" />
                  </div>
                )}

                <label>
                  Página de Wikimedia Commons
                  <input
                    value={form.imagen_commons_page}
                    onChange={e => setForm({ ...form, imagen_commons_page: e.target.value })}
                    placeholder="https://commons.wikimedia.org/…"
                  />
                </label>

                <div className={styles.twoColumns}>
                  <label>
                    Fuente
                    <input
                      value={form.imagen_fuente}
                      onChange={e => setForm({ ...form, imagen_fuente: e.target.value })}
                    />
                  </label>

                  <label>
                    Autor
                    <input
                      value={form.imagen_autor}
                      onChange={e => setForm({ ...form, imagen_autor: e.target.value })}
                    />
                  </label>
                </div>

                <label>
                  Licencia
                  <input
                    value={form.imagen_licencia}
                    onChange={e => setForm({ ...form, imagen_licencia: e.target.value })}
                  />
                </label>

                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={form.imagen_verificada}
                    disabled={!form.imagen_url}
                    onChange={e => setForm({ ...form, imagen_verificada: e.target.checked })}
                  />
                  Imagen revisada y correcta
                </label>

                <div className={styles.editorActions}>
                  <button className="button dark" disabled={guardando}>
                    {guardando ? 'Guardando…' : 'Guardar cambios de imagen'}
                  </button>
                </div>
              </section>
            </div>
          </form>
        )}

        <div className={styles.stats}>
          <div><span>Entradas</span><strong>{stats.total}</strong></div>
          <div><span>Publicadas</span><strong>{stats.publicadas}</strong></div>
          <div><span>Con precio</span><strong>{stats.conPrecio}</strong></div>
          <div><span>Sin imagen</span><strong>{stats.sinImagen}</strong></div>
          <div><span>Imágenes por revisar</span><strong>{stats.pendientesImagen}</strong></div>
        </div>

        <div className={styles.toolbar}>
          <input
            type="search"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por número, nombre, científico o familia…"
          />

          <div className="admin-inventory-tabs">
            {[
              ['todas', 'Todas'],
              ['sin_precio', 'Sin precio'],
              ['sin_imagen', 'Sin imagen'],
              ['pendiente_imagen', 'Imagen por revisar'],
              ['no_publicadas', 'No publicadas']
            ].map(([valor, texto]) => (
              <button
                key={valor}
                className={filtro === valor ? 'active' : ''}
                onClick={() => setFiltro(valor)}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.listHead}>
          <span>Madera</span>
          <span>Hoja MDM</span>
          <span>Stock</span>
          <span>Precio</span>
          <span>Imagen</span>
          <span></span>
        </div>

        <div className={styles.list}>
          {visibles.length === 0 && (
            <div className={styles.empty}>No hay entradas con este filtro.</div>
          )}

          {visibles.map(madera => (
            <article className={styles.row} key={madera.id}>
              <div className={styles.identity}>
                <div className={styles.thumb}>
                  {madera.imagen_url ? (
                    <img src={madera.imagen_url} alt="" />
                  ) : (
                    <span>Sin imagen</span>
                  )}
                </div>
                <div>
                  <strong>
                    #{String(madera.xilo_id).padStart(3, '0')} · {madera.nombre}
                  </strong>
                  <em>{madera.nombre_cientifico || '—'}</em>
                  <small>{madera.familia || '—'}</small>
                </div>
              </div>

              <div className={styles.masterState}>
                <span className={madera.publicada ? styles.okBadge : styles.offBadge}>
                  {madera.publicada ? 'Publicada' : 'No publicada'}
                </span>
                <small>Solo lectura</small>
              </div>

              <div className={styles.numberCell}>
                <strong>{Number(madera.stock_disponible || 0)}</strong>
                <span>disponibles</span>
              </div>

              <div className={styles.priceCell}>
                <strong>{euros(madera.precio)}</strong>
              </div>

              <div className={styles.imageState}>
                {!madera.imagen_url ? (
                  <span className={styles.warnBadge}>Sin imagen</span>
                ) : madera.imagen_verificada ? (
                  <span className={styles.okBadge}>Verificada</span>
                ) : (
                  <span className={styles.pendingBadge}>Por revisar</span>
                )}
              </div>

              <div className={styles.rowActions}>
                {madera.publicada && (
                  <Link href={`/catalogo/${madera.slug}`} target="_blank">
                    Ver ficha
                  </Link>
                )}
                <button type="button" onClick={() => editar(madera)}>
                  Editar web
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
