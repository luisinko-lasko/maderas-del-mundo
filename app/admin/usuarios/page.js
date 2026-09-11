'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import styles from './usuarios.module.css';

export default function AdminUsuarios() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [procesando, setProcesando] = useState(null);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [nuevo, setNuevo] = useState({
    email: '',
    password: '',
    nombre: '',
    apellidos: ''
  });

  async function cargarUsuarios() {
    setCargando(true);
    setError(null);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      router.replace('/login');
      return;
    }

    const { data: esAdmin, error: adminError } = await supabase.rpc('es_admin');
    if (adminError || esAdmin !== true) {
      router.replace('/');
      return;
    }

    const { data, error: usuariosError } = await supabase.rpc('admin_listar_usuarios');
    if (usuariosError) setError(usuariosError.message);
    else setUsuarios(data || []);

    setCargando(false);
  }

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function llamarAdmin(payload) {
    const { data: sesionData } = await supabase.auth.getSession();
    const token = sesionData?.session?.access_token;

    if (!token) throw new Error('La sesión ha caducado.');

    const respuesta = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.error || 'No se pudo completar la operación.');
    return data;
  }

  async function crearUsuario(e) {
    e.preventDefault();
    setProcesando('crear');
    setError(null);
    setMensaje('');

    try {
      await llamarAdmin({ accion: 'crear', ...nuevo });
      setNuevo({ email: '', password: '', nombre: '', apellidos: '' });
      setMostrarCrear(false);
      setMensaje('Usuario creado correctamente.');
      await cargarUsuarios();
    } catch (e) {
      setError(e.message);
    } finally {
      setProcesando(null);
    }
  }

  async function cambiarAdmin(usuario) {
    const convertir = !usuario.es_administrador;
    const texto = convertir
      ? `¿Convertir a ${usuario.email} en administrador?`
      : `¿Quitar a ${usuario.email} los permisos de administrador?`;

    if (!window.confirm(texto)) return;

    setProcesando(usuario.user_id);
    setError(null);
    setMensaje('');

    try {
      await llamarAdmin({
        accion: 'administrador',
        user_id: usuario.user_id,
        valor: convertir
      });
      setMensaje(convertir ? 'Administrador añadido.' : 'Permisos de administrador retirados.');
      await cargarUsuarios();
    } catch (e) {
      setError(e.message);
    } finally {
      setProcesando(null);
    }
  }

  async function forzarPassword(usuario) {
    if (!window.confirm(
      `Se invalidará la contraseña actual de ${usuario.email} y se le enviará un correo para crear otra. ¿Continuar?`
    )) return;

    setProcesando(usuario.user_id);
    setError(null);
    setMensaje('');

    try {
      await llamarAdmin({ accion: 'forzar_password', user_id: usuario.user_id });
      setMensaje(`Cambio de contraseña solicitado para ${usuario.email}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setProcesando(null);
    }
  }

  async function borrarUsuario(usuario) {
    if (!window.confirm(
      `¿Borrar definitivamente a ${usuario.email}? Esta acción no se puede deshacer.`
    )) return;

    setProcesando(usuario.user_id);
    setError(null);
    setMensaje('');

    try {
      await llamarAdmin({ accion: 'borrar', user_id: usuario.user_id });
      setMensaje('Usuario borrado.');
      await cargarUsuarios();
    } catch (e) {
      setError(e.message);
    } finally {
      setProcesando(null);
    }
  }

  function formatearFecha(fecha) {
    if (!fecha) return '';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(fecha));
  }

  function formatearPrecio(valor) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency', currency: 'EUR'
    }).format(Number(valor || 0));
  }

  function iniciales(usuario) {
    const nombre = [usuario.nombre, usuario.apellidos].filter(Boolean).join(' ').trim();
    if (nombre) {
      return nombre.split(/\s+/).slice(0, 2).map((p) => p[0]).join('');
    }
    return (usuario.email || '?').slice(0, 2);
  }

  if (cargando) {
    return <main className="page-shell"><h1>Cargando usuarios…</h1></main>;
  }

  return (
    <main className="admin-page">
      <aside className="admin-side">
        <div className="brand-mark admin-logo">MDM</div>
        <strong>Administración</strong>
        <nav>
          <Link href="/admin">Inventario</Link>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/admin/series">Series</Link>
          <Link href="/admin/pedidos">Pedidos</Link>
          <Link href="/admin/usuarios" className="active">Usuarios</Link>
        </nav>
        <Link href="/">← Web pública</Link>
      </aside>

      <section className={`admin-main ${styles.shell}`}>
        <div className={styles.header}>
          <div>
            <div className="page-eyebrow">Administración / Usuarios</div>
            <h1>Usuarios</h1>
            <p>Gestiona las cuentas, los permisos de administrador y el acceso a la web desde un único sitio.</p>
          </div>

          <button
            className={styles.primaryButton}
            onClick={() => setMostrarCrear(!mostrarCrear)}
          >
            {mostrarCrear ? 'Cerrar formulario' : '+ Crear usuario'}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {mensaje && <p className={styles.notice}>{mensaje}</p>}

        {mostrarCrear && (
          <form className={styles.createPanel} onSubmit={crearUsuario}>
            <div className={styles.createHead}>
              <h2>Nuevo usuario</h2>
              <span>La contraseña inicial debe tener al menos 8 caracteres.</span>
            </div>

            <div className={styles.createGrid}>
              <label>
                Correo electrónico
                <input
                  type="email"
                  required
                  value={nuevo.email}
                  onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
                />
              </label>

              <label>
                Contraseña inicial
                <input
                  type="password"
                  required
                  minLength={8}
                  value={nuevo.password}
                  onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })}
                />
              </label>

              <label>
                Nombre
                <input
                  value={nuevo.nombre}
                  onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                />
              </label>

              <label>
                Apellidos
                <input
                  value={nuevo.apellidos}
                  onChange={(e) => setNuevo({ ...nuevo, apellidos: e.target.value })}
                />
              </label>

              <div className={styles.submitCell}>
                <button
                  className={styles.primaryButton}
                  disabled={procesando === 'crear'}
                >
                  {procesando === 'crear' ? 'Creando…' : 'Crear'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>Usuarios registrados</span>
            <strong>{usuarios.length}</strong>
          </div>
          <div className={styles.stat}>
            <span>Administradores</span>
            <strong>{usuarios.filter((u) => u.es_administrador).length}</strong>
          </div>
          <div className={styles.stat}>
            <span>Con pedidos</span>
            <strong>{usuarios.filter((u) => Number(u.pedidos) > 0).length}</strong>
          </div>
        </div>

        <section className={styles.directory}>
          <div className={styles.directoryHead}>
            <h2>Directorio</h2>
            <span>{usuarios.length} {usuarios.length === 1 ? 'cuenta' : 'cuentas'}</span>
          </div>

          <div className={styles.tableHead}>
            <span>Usuario</span>
            <span>Rol</span>
            <span>Pedidos</span>
            <span>Total comprado</span>
            <span>Alta</span>
            <span></span>
          </div>

          {usuarios.length === 0 ? (
            <div className={styles.empty}>Todavía no hay usuarios registrados.</div>
          ) : usuarios.map((usuario) => {
            const nombreCompleto = [usuario.nombre, usuario.apellidos]
              .filter(Boolean)
              .join(' ') || 'Sin nombre';
            const ubicacion = [usuario.poblacion, usuario.provincia]
              .filter(Boolean)
              .join(' · ');
            const ocupado = procesando === usuario.user_id;

            return (
              <div className={styles.row} key={usuario.user_id}>
                <div className={styles.identity}>
                  <div className={styles.avatar}>{iniciales(usuario)}</div>
                  <div className={styles.identityText}>
                    <strong>{usuario.email}</strong>
                    <span>{nombreCompleto}{ubicacion ? ` · ${ubicacion}` : ''}</span>
                  </div>
                </div>

                <div>
                  <span className={usuario.es_administrador ? styles.roleAdmin : styles.roleUser}>
                    {usuario.es_administrador ? 'Administrador' : 'Usuario'}
                  </span>
                </div>

                <span className={styles.numeric}>{usuario.pedidos}</span>
                <span className={styles.numeric}>{formatearPrecio(usuario.total_comprado)}</span>
                <span className={styles.date}>{formatearFecha(usuario.creado_en)}</span>

                <details className={styles.actions}>
                  <summary aria-label={`Acciones para ${usuario.email}`}>•••</summary>
                  <div className={styles.menu}>
                    <Link href={`/admin/usuarios/${usuario.user_id}`}>Ver ficha</Link>
                    <button
                      type="button"
                      className={styles.menuButton}
                      disabled={ocupado}
                      onClick={() => forzarPassword(usuario)}
                    >
                      Forzar cambio de contraseña
                    </button>
                    <button
                      type="button"
                      className={styles.menuButton}
                      disabled={ocupado}
                      onClick={() => cambiarAdmin(usuario)}
                    >
                      {usuario.es_administrador ? 'Quitar administrador' : 'Convertir en administrador'}
                    </button>
                    <div className={styles.menuDivider} />
                    <button
                      type="button"
                      className={styles.dangerButton}
                      disabled={ocupado}
                      onClick={() => borrarUsuario(usuario)}
                    >
                      Borrar usuario
                    </button>
                  </div>
                </details>
              </div>
            );
          })}
        </section>
      </section>
    </main>
  );
}
