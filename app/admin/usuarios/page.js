'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

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

      <section className="admin-main">
        <div className="admin-top">
          <div>
            <div className="page-eyebrow">Administración / Usuarios</div>
            <h1>Usuarios</h1>
          </div>
          <button className="button dark" onClick={() => setMostrarCrear(!mostrarCrear)}>
            {mostrarCrear ? 'Cancelar' : '+ Crear usuario'}
          </button>
        </div>

        {error && <p className="admin-error">{error}</p>}
        {mensaje && <p className="login-message">{mensaje}</p>}

        {mostrarCrear && (
          <form className="account-card login-form" onSubmit={crearUsuario}>
            <h2>Nuevo usuario</h2>
            <label>Correo electrónico
              <input type="email" required value={nuevo.email}
                onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} />
            </label>
            <label>Contraseña inicial
              <input type="password" required minLength={8} value={nuevo.password}
                onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} />
            </label>
            <label>Nombre
              <input value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
            </label>
            <label>Apellidos
              <input value={nuevo.apellidos}
                onChange={(e) => setNuevo({ ...nuevo, apellidos: e.target.value })} />
            </label>
            <button className="login-button" disabled={procesando === 'crear'}>
              {procesando === 'crear' ? 'Creando…' : 'Crear usuario'}
            </button>
          </form>
        )}

        <div className="admin-stats">
          <div><span>Usuarios registrados</span><strong>{usuarios.length}</strong></div>
          <div><span>Administradores</span><strong>{usuarios.filter(u => u.es_administrador).length}</strong></div>
          <div><span>Con pedidos</span><strong>{usuarios.filter(u => Number(u.pedidos) > 0).length}</strong></div>
        </div>

        <div className="inventory-summary">
          <div className="inventory-summary-row inventory-summary-head">
            <span>Usuario</span><span>Nombre</span><span>Rol</span><span>Pedidos</span>
            <span>Total comprado</span><span>Alta</span><span>Acciones</span>
          </div>

          {usuarios.map((usuario) => {
            const nombreCompleto = [usuario.nombre, usuario.apellidos].filter(Boolean).join(' ') || '—';
            const ocupado = procesando === usuario.user_id;

            return (
              <div className="inventory-summary-row" key={usuario.user_id}>
                <span>
                  <strong>{usuario.email}</strong>
                  {usuario.poblacion && <em>{usuario.poblacion}{usuario.provincia ? ` · ${usuario.provincia}` : ''}</em>}
                </span>
                <span>{nombreCompleto}</span>
                <span><strong>{usuario.es_administrador ? 'Administrador' : 'Usuario'}</strong></span>
                <span>{usuario.pedidos}</span>
                <span>{formatearPrecio(usuario.total_comprado)}</span>
                <span>{formatearFecha(usuario.creado_en)}</span>
                <span style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap' }}>
                  <Link href={`/admin/usuarios/${usuario.user_id}`} className="button">Ver</Link>
                  <button className="button" disabled={ocupado} onClick={() => forzarPassword(usuario)}>Contraseña</button>
                  <button className="button" disabled={ocupado} onClick={() => cambiarAdmin(usuario)}>
                    {usuario.es_administrador ? 'Quitar admin' : 'Hacer admin'}
                  </button>
                  <button className="button" disabled={ocupado} onClick={() => borrarUsuario(usuario)}>Borrar</button>
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
