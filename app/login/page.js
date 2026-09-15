'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { vaciarCarrito } from '../../lib/carrito';

export default function LoginPage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState(false);
  const [totalMaderas, setTotalMaderas] = useState(0);
  const [perfil, setPerfil] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    direccion: '',
    codigo_postal: '',
    poblacion: '',
    provincia: '',
    pais: 'España'
  });
  const [pedidos, setPedidos] = useState([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function cargarDatosUsuario(usuario) {
    if (!usuario) return;

    const { count } = await supabase
      .from('coleccion_usuario')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', usuario.id);

    setTotalMaderas(count || 0);

    const { data: perfilData } = await supabase
      .from('perfiles')
      .select('*')
      .eq('user_id', usuario.id)
      .maybeSingle();

    if (perfilData) {
      setPerfil({
        nombre: perfilData.nombre || '',
        apellidos: perfilData.apellidos || '',
        telefono: perfilData.telefono || '',
        direccion: perfilData.direccion || '',
        codigo_postal: perfilData.codigo_postal || '',
        poblacion: perfilData.poblacion || '',
        provincia: perfilData.provincia || '',
        pais: perfilData.pais || 'España'
      });
    }

    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select(`
        id,
        estado,
        entrega,
        total,
        created_at,
        pedido_lineas (
          id,
          tipo,
          nombre,
          cantidad,
          precio_unitario
        )
      `)
      .eq('user_id', usuario.id)
      .order('created_at', { ascending: false });

    if (pedidosError) {
      console.error(pedidosError);
    } else {
      setPedidos(pedidosData || []);
    }
  }

  useEffect(() => {
    async function cargarUsuario() {
      const { data } = await supabase.auth.getUser();
      const usuario = data.user || null;
      setUser(usuario);

      if (usuario) {
        await cargarDatosUsuario(usuario);
      }

      setCargando(false);
    }

    cargarUsuario();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const usuario = session?.user || null;
        setUser(usuario);

        if (!usuario) {
          setTotalMaderas(0);
          setPedidos([]);
          return;
        }

        await cargarDatosUsuario(usuario);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function entrar(e) {
    e.preventDefault();
    setMensaje('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMensaje(
        error.code === 'email_not_confirmed'
          ? 'Debes confirmar tu correo electrónico antes de entrar.'
          : error.message
      );
      return;
    }

    setMensaje('');
  }

  async function recuperarPassword() {
    setMensaje('');

    if (!email) {
      setMensaje('Escribe primero el correo electrónico de tu cuenta.');
      return;
    }

    setEnviandoRecuperacion(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/cambiar-password`
    });

    setEnviandoRecuperacion(false);

    if (error) {
      setMensaje(error.message);
      return;
    }

    setMensaje(
      'Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña.'
    );
  }

  async function salir() {
    await supabase.auth.signOut();
    vaciarCarrito();
    setMensaje('');
  }

  function cambiarPerfil(campo, valor) {
    setPerfil((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function guardarPerfil(e) {
    e.preventDefault();
    if (!user) return;

    setGuardando(true);
    setMensaje('');

    const { error } = await supabase
      .from('perfiles')
      .upsert({
        user_id: user.id,
        ...perfil,
        updated_at: new Date().toISOString()
      });

    setMensaje(
      error
        ? 'No se pudieron guardar los datos: ' + error.message
        : 'Datos guardados correctamente.'
    );
    setGuardando(false);
  }

  function formatearFecha(fecha) {
    if (!fecha) return '';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(fecha));
  }

  function formatearPrecio(valor) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(valor || 0));
  }

  const pedidosVisibles = mostrarHistorico
    ? pedidos
    : pedidos.filter((pedido) =>
        ['pagado', 'preparando', 'enviado', 'entregado'].includes(pedido.estado)
      );

  const hayHistorico = pedidos.some((pedido) =>
    ['cancelado', 'caducado'].includes(pedido.estado)
  );

  if (cargando) {
    return (
      <main className="page-shell">
        <p>Cargando…</p>
      </main>
    );
  }

  if (user) {
    return (
      <main className="page-shell account-page">
        <div className="page-eyebrow">Área personal</div>
        <h1>Mi cuenta</h1>

        <div className="account-grid">
          <section className="account-card">
            <span className="account-label">Usuario</span>
            <strong>{user.email}</strong>
          </section>

          <Link href="/coleccion" className="account-card account-link">
            <span className="account-label">Mi colección</span>
            <strong>
              {totalMaderas} {totalMaderas === 1 ? 'madera' : 'maderas'}
            </strong>
            <span>Ver colección →</span>
          </Link>
        </div>

        <h2 className="facts-title">Datos personales</h2>

        <form className="login-form account-profile-form" onSubmit={guardarPerfil}>
          <label>
            Nombre
            <input
              type="text"
              value={perfil.nombre}
              onChange={(e) => cambiarPerfil('nombre', e.target.value)}
            />
          </label>

          <label>
            Apellidos
            <input
              type="text"
              value={perfil.apellidos}
              onChange={(e) => cambiarPerfil('apellidos', e.target.value)}
            />
          </label>

          <label>
            Teléfono
            <input
              type="tel"
              value={perfil.telefono}
              onChange={(e) => cambiarPerfil('telefono', e.target.value)}
            />
          </label>

          <label>
            Dirección
            <input
              type="text"
              value={perfil.direccion}
              onChange={(e) => cambiarPerfil('direccion', e.target.value)}
            />
          </label>

          <label>
            Código postal
            <input
              type="text"
              value={perfil.codigo_postal}
              onChange={(e) => cambiarPerfil('codigo_postal', e.target.value)}
            />
          </label>

          <label>
            Población
            <input
              type="text"
              value={perfil.poblacion}
              onChange={(e) => cambiarPerfil('poblacion', e.target.value)}
            />
          </label>

          <label>
            Provincia
            <input
              type="text"
              value={perfil.provincia}
              onChange={(e) => cambiarPerfil('provincia', e.target.value)}
            />
          </label>

          <label>
            País
            <input
              type="text"
              value={perfil.pais}
              onChange={(e) => cambiarPerfil('pais', e.target.value)}
            />
          </label>

          <button type="submit" className="login-button" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar datos'}
          </button>
        </form>

        {mensaje && <p className="login-message">{mensaje}</p>}

        <div className="account-orders-head">
          <h2 className="facts-title">Mis pedidos</h2>
          {hayHistorico && (
            <button
              type="button"
              className="button"
              onClick={() => setMostrarHistorico(!mostrarHistorico)}
            >
              {mostrarHistorico
                ? 'Ocultar cancelados'
                : 'Mostrar cancelados y caducados'}
            </button>
          )}
        </div>

        {pedidosVisibles.length === 0 ? (
          <div className="collection-empty">
            <h2>Aún no tienes pedidos</h2>
            <p>Tus compras aparecerán aquí.</p>
            <Link href="/tienda">Ir a la tienda →</Link>
          </div>
        ) : (
          <div className="account-orders">
            {pedidosVisibles.map((pedido) => (
              <article className="account-order" key={pedido.id}>
                <div className="account-order-head">
                  <div>
                    <span className="account-label">Pedido</span>
                    <strong>{pedido.id.slice(0, 8)}</strong>
                    <span>
                      {pedido.entrega === 'presencial'
                        ? 'Venta presencial'
                        : 'Compra online'}
                    </span>
                    <span>{formatearFecha(pedido.created_at)}</span>
                  </div>

                  <div className="account-order-status">
                    <span className={`order-status ${pedido.estado}`}>
                      {pedido.estado}
                    </span>
                    <strong>{formatearPrecio(pedido.total)}</strong>
                  </div>
                </div>

                <div className="account-order-lines">
                  {(pedido.pedido_lineas || []).map((linea) => (
                    <div key={linea.id}>
                      <span>{linea.cantidad} × {linea.nombre}</span>
                      <strong>
                        {formatearPrecio(
                          Number(linea.cantidad) * Number(linea.precio_unitario)
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}

        <button className="login-button account-logout" onClick={salir}>
          Cerrar sesión
        </button>
      </main>
    );
  }

  return (
    <main className="page-shell login-page">
      <div className="page-eyebrow">Mi cuenta</div>
      <h1>Entrar</h1>
      <p>Accede a tu colección personal de maderas.</p>

      <form className="login-form" onSubmit={entrar}>
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
              required
              minLength={8}
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
                fontSize: '18px',
                padding: '8px'
              }}
            >
              {mostrarPassword ? '◉' : '👁'}
            </button>
          </span>
        </label>

        <button type="submit" className="login-button">
          Entrar
        </button>

        <button
          type="button"
          className="button"
          onClick={recuperarPassword}
          disabled={enviandoRecuperacion}
          style={{ alignSelf: 'flex-start' }}
        >
          {enviandoRecuperacion
            ? 'Enviando…'
            : 'He olvidado mi contraseña'}
        </button>
      </form>

      <p style={{ marginTop: '22px' }}>
        ¿No tienes cuenta? <Link href="/crear-cuenta">Crear cuenta</Link>
      </p>

      {mensaje && (
        <p className="login-message" role="status" aria-live="polite">
          {mensaje}
        </p>
      )}
    </main>
  );
}
