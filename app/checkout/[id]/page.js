'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();

  const [pedido, setPedido] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    entrega: 'envio',
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    codigo_postal: '',
    poblacion: '',
    provincia: '',
    pais: 'España'
  });

  useEffect(() => {
    async function cargar() {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: pedidoData, error: pedidoError } =
        await supabase
          .from('pedidos')
          .select('*')
          .eq('id', id)
          .single();

      if (pedidoError) {
        setError('No se pudo cargar el pedido.');
        setCargando(false);
        return;
      }

      const { data: lineasData, error: lineasError } =
        await supabase
          .from('pedido_lineas')
          .select('*')
          .eq('pedido_id', id)
          .order('created_at');

      if (lineasError) {
        setError('No se pudo cargar el contenido del pedido.');
        setCargando(false);
        return;
      }

      const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (perfilError) {
        console.error('Error cargando perfil:', perfilError);
      }

      setPedido(pedidoData);
      setLineas(lineasData || []);

      setForm({
        entrega: pedidoData.entrega || 'envio',
        nombre: pedidoData.nombre_entrega || perfilData?.nombre || '',
        apellidos: pedidoData.apellidos_entrega || perfilData?.apellidos || '',
        email: pedidoData.email_entrega || user.email || '',
        telefono: pedidoData.telefono_entrega || perfilData?.telefono || '',
        direccion: pedidoData.direccion_entrega || perfilData?.direccion || '',
        codigo_postal: pedidoData.codigo_postal_entrega || perfilData?.codigo_postal || '',
        poblacion: pedidoData.poblacion_entrega || perfilData?.poblacion || '',
        provincia: pedidoData.provincia_entrega || perfilData?.provincia || '',
        pais: pedidoData.pais_entrega || perfilData?.pais || 'España'
      });

      setCargando(false);
    }

    cargar();
  }, [id, router]);

  function cambiar(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function continuar(e) {
    e.preventDefault();
    setError('');

    if (!form.nombre || !form.apellidos || !form.email || !form.telefono) {
      setError('Completa los datos de contacto.');
      return;
    }

    if (
      form.entrega === 'envio' &&
      (
        !form.direccion ||
        !form.codigo_postal ||
        !form.poblacion ||
        !form.provincia ||
        !form.pais
      )
    ) {
      setError('Completa la dirección de envío.');
      return;
    }

    setGuardando(true);

    const { error: guardarError } = await supabase.rpc(
      'guardar_checkout',
      {
        p_pedido_id: id,
        p_entrega: form.entrega,
        p_nombre: form.nombre,
        p_apellidos: form.apellidos,
        p_email: form.email,
        p_telefono: form.telefono,
        p_direccion:
          form.entrega === 'envio'
            ? form.direccion
            : null,
        p_codigo_postal:
          form.entrega === 'envio'
            ? form.codigo_postal
            : null,
        p_poblacion:
          form.entrega === 'envio'
            ? form.poblacion
            : null,
        p_provincia:
          form.entrega === 'envio'
            ? form.provincia
            : null,
        p_pais:
          form.entrega === 'envio'
            ? form.pais
            : 'España'
      }
    );

    if (guardarError) {
      setError(guardarError.message);
      setGuardando(false);
      return;
    }

    router.push(`/checkout/${id}/pago`);
  }

  if (cargando) {
    return (
      <main className="checkout-page">
        <p>Cargando pedido…</p>
      </main>
    );
  }

  if (error && !pedido) {
    return (
      <main className="checkout-page">
        <h1>No se pudo abrir el pedido</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="checkout-page">

      <div className="checkout-heading">
        <div className="page-eyebrow">
          Maderas del mundo / Pedido
        </div>
        <h1>Finalizar compra</h1>
      </div>

      <div className="checkout-layout">

        <form
          className="checkout-form"
          onSubmit={continuar}
        >

          <section className="checkout-block">
            <span className="page-eyebrow">
              01 · Entrega
            </span>

            <div className="checkout-delivery-options">

              <label>
                <input
                  type="radio"
                  name="entrega"
                  value="envio"
                  checked={form.entrega === 'envio'}
                  onChange={cambiar}
                />
                <span>
                  <strong>Envío a domicilio</strong>
                  <small>
                    Enviaremos el pedido a la dirección indicada.
                  </small>
                </span>
              </label>

              <label>
                <input
                  type="radio"
                  name="entrega"
                  value="recogida"
                  checked={form.entrega === 'recogida'}
                  onChange={cambiar}
                />
                <span>
                  <strong>Recogida en mano</strong>
                  <small>
                    Sin gastos de envío.
                  </small>
                </span>
              </label>

            </div>
          </section>


          <section className="checkout-block">
            <span className="page-eyebrow">
              02 · Datos de contacto
            </span>

            <div className="checkout-fields two">
              <label>
                Nombre
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={cambiar}
                  required
                />
              </label>

              <label>
                Apellidos
                <input
                  name="apellidos"
                  value={form.apellidos}
                  onChange={cambiar}
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={cambiar}
                  required
                />
              </label>

              <label>
                Teléfono
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={cambiar}
                  required
                />
              </label>
            </div>
          </section>


          {form.entrega === 'envio' && (
            <section className="checkout-block">

              <span className="page-eyebrow">
                03 · Dirección
              </span>

              <div className="checkout-fields">

                <label>
                  Dirección
                  <input
                    name="direccion"
                    value={form.direccion}
                    onChange={cambiar}
                    required
                  />
                </label>

                <div className="checkout-fields two">
                  <label>
                    Código postal
                    <input
                      name="codigo_postal"
                      value={form.codigo_postal}
                      onChange={cambiar}
                      required
                    />
                  </label>

                  <label>
                    Población
                    <input
                      name="poblacion"
                      value={form.poblacion}
                      onChange={cambiar}
                      required
                    />
                  </label>

                  <label>
                    Provincia
                    <input
                      name="provincia"
                      value={form.provincia}
                      onChange={cambiar}
                      required
                    />
                  </label>

                  <label>
                    País
                    <input
                      name="pais"
                      value={form.pais}
                      onChange={cambiar}
                      required
                    />
                  </label>
                </div>

              </div>

            </section>
          )}


          {error && (
            <p className="cart-order-error">
              {error}
            </p>
          )}

          <button
            className="button dark checkout-continue"
            disabled={guardando}
          >
            {guardando
              ? 'Guardando…'
              : 'Continuar al pago'}
          </button>

        </form>


        <aside className="checkout-summary">

          <span className="page-eyebrow">
            Tu pedido
          </span>

          <div className="checkout-lines">

            {lineas.map(linea => (
              <div
                className="checkout-line"
                key={linea.id}
              >
                <div>
                  <strong>{linea.nombre}</strong>

                  <small>
                    {linea.tipo === 'madera'
                      ? 'Pieza individual'
                      : 'Serie'}
                  </small>
                </div>

                <div>
                  {linea.cantidad > 1 &&
                    `${linea.cantidad} × `}

                  {Number(
                    linea.precio_unitario
                  ).toFixed(2)} €
                </div>
              </div>
            ))}

          </div>

          <div className="checkout-total">
            <span>Total provisional</span>
            <strong>
              {Number(pedido.total).toFixed(2)} €
            </strong>
          </div>

          <p className="checkout-note">
            Las piezas de este pedido están reservadas
            temporalmente.
          </p>

          <Link href="/tienda">
            ← Volver a la tienda
          </Link>

        </aside>

      </div>

    </main>
  );
}
