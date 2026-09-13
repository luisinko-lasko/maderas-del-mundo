import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

function clienteServicio() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Faltan variables de Supabase en el servidor.');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function comprobarAdmin(request, supabase) {
  const cabecera = request.headers.get('authorization') || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';

  if (!token) {
    return { error: 'Sesión no válida.', status: 401 };
  }

  const { data, error } = await supabase.auth.getUser(token);
  const usuario = data?.user;

  if (error || !usuario) {
    return { error: 'Sesión no válida.', status: 401 };
  }

  const { data: admin, error: adminError } = await supabase
    .from('administradores')
    .select('user_id')
    .eq('user_id', usuario.id)
    .maybeSingle();

  if (adminError || !admin) {
    return { error: 'Acceso denegado.', status: 403 };
  }

  return { usuario };
}

function respuestaError(mensaje, status = 400) {
  return Response.json({ error: mensaje }, { status });
}

export async function POST(request) {
  try {
    const supabase = clienteServicio();
    const acceso = await comprobarAdmin(request, supabase);

    if (acceso.error) {
      return respuestaError(acceso.error, acceso.status);
    }

    const body = await request.json();
    const accion = body?.accion;

    if (accion === 'crear') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const nombre = String(body.nombre || '').trim();
      const apellidos = String(body.apellidos || '').trim();

      if (!email || !email.includes('@')) {
        return respuestaError('Introduce un correo electrónico válido.');
      }

      if (password.length < 8) {
        return respuestaError('La contraseña inicial debe tener al menos 8 caracteres.');
      }

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (error) return respuestaError(error.message);

      if (data?.user && (nombre || apellidos)) {
        const { error: perfilError } = await supabase
          .from('perfiles')
          .upsert({
            user_id: data.user.id,
            nombre: nombre || null,
            apellidos: apellidos || null,
            updated_at: new Date().toISOString()
          });

        if (perfilError) {
          return respuestaError(
            `El usuario se creó, pero no se pudo guardar el perfil: ${perfilError.message}`
          );
        }
      }

      return Response.json({ ok: true, user_id: data.user.id });
    }

    const userId = String(body.user_id || '');

    if (!userId) {
      return respuestaError('Falta el usuario.');
    }

    if (accion === 'administrador') {
      const convertir = Boolean(body.valor);

      if (!convertir && userId === acceso.usuario.id) {
        return respuestaError('No puedes quitarte a ti mismo los permisos de administrador.');
      }

      if (convertir) {
        const { error } = await supabase
          .from('administradores')
          .upsert({ user_id: userId });
        if (error) return respuestaError(error.message);
      } else {
        const { error } = await supabase
          .from('administradores')
          .delete()
          .eq('user_id', userId);
        if (error) return respuestaError(error.message);
      }

      return Response.json({ ok: true });
    }

    if (accion === 'forzar_password') {
      const { data: usuarioData, error: usuarioError } =
        await supabase.auth.admin.getUserById(userId);

      if (usuarioError || !usuarioData?.user?.email) {
        return respuestaError(usuarioError?.message || 'No se encontró el usuario.');
      }

      const passwordTemporal = `${randomBytes(24).toString('base64url')}Aa1!`;

      const { error: cambioError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: passwordTemporal }
      );

      if (cambioError) return respuestaError(cambioError.message);

      const origen = new URL(request.url).origin;
      const { error: correoError } = await supabase.auth.resetPasswordForEmail(
        usuarioData.user.email,
        { redirectTo: `${origen}/cambiar-password` }
      );

      if (correoError) {
        return respuestaError(
          `La contraseña anterior ya no es válida, pero no se pudo enviar el correo: ${correoError.message}`
        );
      }

      return Response.json({ ok: true });
    }

    if (accion === 'borrar') {
      if (userId === acceso.usuario.id) {
        return respuestaError('No puedes borrar tu propio usuario.');
      }

      const { count, error: pedidosError } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (pedidosError) return respuestaError(pedidosError.message);

      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) return respuestaError(error.message);

      return Response.json({
        ok: true,
        pedidos_preservados: count || 0
      });
    }

    return respuestaError('Acción no reconocida.');
  } catch (error) {
    return respuestaError(error.message || 'Error interno.', 500);
  }
}
