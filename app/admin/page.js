'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Admin() {

  const router = useRouter();
  const [vista, setVista] = useState('maderas');

  const [piezas, setPiezas] = useState([]);
  const [maderas, setMaderas] = useState([]);

  const [productos, setProductos] = useState([]);
  const [inventarioProductos, setInventarioProductos] = useState([]);

  const [maderaId, setMaderaId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [mostrarFormularioPiezas, setMostrarFormularioPiezas] = useState(false);

  const [mostrarFormularioProducto, setMostrarFormularioProducto] = useState(false);
  const [productoNombre, setProductoNombre] = useState('');
  const [productoTipo, setProductoTipo] = useState('caja');
  const [productoCapacidad, setProductoCapacidad] = useState('');
  const [productoPrecio, setProductoPrecio] = useState('');
  const [productoStock, setProductoStock] = useState(0);

  const [productoEditando, setProductoEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTipo, setEditTipo] = useState('caja');
  const [editCapacidad, setEditCapacidad] = useState('');
  const [editPrecio, setEditPrecio] = useState('');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function cargarDatos() {
    setError(null);

    const [
      { data: piezasData, error: piezasError },
      { data: maderasData, error: maderasError },
      { data: productosData, error: productosError },
      { data: inventarioData, error: inventarioError }
    ] = await Promise.all([
      supabase
        .from('piezas')
        .select(`
          id,
          codigo,
          estado,
          madera_id,
          madera:maderas (
            id,
            xilo_id,
            nombre,
            nombre_cientifico,
            slug
          )
        `)
        .order('codigo'),

      supabase
        .from('maderas')
        .select('id, xilo_id, nombre, nombre_cientifico, slug')
        .eq('publicada', true)
        .order('xilo_id'),

      supabase
        .from('productos')
        .select('id, nombre, tipo, capacidad, precio, activo')
        .in('tipo', ['caja', 'otro'])
        .order('nombre'),

      supabase
        .from('inventario_productos')
        .select('producto_id, stock, reservado')
    ]);

    if (
      piezasError ||
      maderasError ||
      productosError ||
      inventarioError
    ) {
      setError(
        piezasError?.message ||
        maderasError?.message ||
        productosError?.message ||
        inventarioError?.message
      );
      setCargando(false);
      return;
    }

    setPiezas(piezasData || []);
    setMaderas(maderasData || []);
    setProductos(productosData || []);
    setInventarioProductos(inventarioData || []);

    if (!maderaId && maderasData?.length) {
      setMaderaId(maderasData[0].id);
    }

    setCargando(false);
  }

  useEffect(() => {

    let activo = true;

    async function iniciarAdmin() {

      setCargando(true);
      setError(null);

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (!activo) return;

      if (userError || !user) {
        router.replace('/login');
        return;
      }

      console.log(
        'Comprobando acceso admin:',
        user.email,
        user.id
      );

      const { data: esAdmin, error: adminError } =
        await supabase.rpc('es_admin');

      if (!activo) return;

      console.log(
        'Resultado es_admin:',
        esAdmin,
        adminError
      );

      if (adminError) {
        console.error(
          'Error comprobando administrador:',
          adminError
        );

        router.replace('/');
        return;
      }

      if (esAdmin !== true) {
        console.log(
          'Acceso denegado a /admin para:',
          user.email
        );

        router.replace('/');
        return;
      }

      await cargarDatos();
    }

    iniciarAdmin();

    return () => {
      activo = false;
    };

  }, [router]);


  const resumenMaderas = useMemo(() => {
    const mapa = new Map();

    for (const madera of maderas) {
      mapa.set(madera.id, {
        ...madera,
        total: 0,
        disponibles: 0,
        reservadas: 0,
        vendidas: 0,
        retiradas: 0,
        piezasDisponibles: []
      });
    }

    for (const pieza of piezas) {
      const fila = mapa.get(pieza.madera_id);
      if (!fila) continue;

      fila.total += 1;

      if (pieza.estado === 'disponible') {
        fila.disponibles += 1;
        fila.piezasDisponibles.push(pieza);
      }

      if (pieza.estado === 'reservada') fila.reservadas += 1;
      if (pieza.estado === 'vendida') fila.vendidas += 1;
      if (pieza.estado === 'retirada') fila.retiradas += 1;
    }

    return Array.from(mapa.values())
      .filter(m => m.total > 0)
      .sort((a, b) => a.xilo_id - b.xilo_id);
  }, [piezas, maderas]);

  const resumenProductos = useMemo(() => {
    const inventarioMap = Object.fromEntries(
      inventarioProductos.map(i => [
        i.producto_id,
        {
          stock: Number(i.stock || 0),
          reservado: Number(i.reservado || 0)
        }
      ])
    );

    return productos.map(producto => {
      const inv = inventarioMap[producto.id] || {
        stock: 0,
        reservado: 0
      };

      return {
        ...producto,
        stock: inv.stock,
        reservado: inv.reservado,
        disponible: Math.max(0, inv.stock - inv.reservado)
      };
    });
  }, [productos, inventarioProductos]);

  async function crearPiezas(e) {
    e.preventDefault();

    const numero = Math.max(1, Number(cantidad) || 1);

    setGuardando(true);
    setError(null);

    const nuevas = Array.from(
      { length: numero },
      () => ({ madera_id: maderaId })
    );

    const { error } = await supabase
      .from('piezas')
      .insert(nuevas);

    if (error) {
      setError(error.message);
      setGuardando(false);
      return;
    }

    setCantidad(1);
    setMostrarFormularioPiezas(false);
    setGuardando(false);

    await cargarDatos();
  }

  async function venderUna(fila) {
    const pieza = fila.piezasDisponibles[0];
    if (!pieza) return;

    const aceptar = window.confirm(
      `¿Marcar una pieza de ${fila.nombre} como vendida?`
    );

    if (!aceptar) return;

    const { error } = await supabase
      .from('piezas')
      .update({ estado: 'vendida' })
      .eq('id', pieza.id)
      .eq('estado', 'disponible');

    if (error) {
      setError(error.message);
      return;
    }

    await cargarDatos();
  }

  async function crearProducto(e) {
    e.preventDefault();

    if (!productoNombre.trim()) {
      setError('Pon un nombre al producto.');
      return;
    }

    const capacidad =
      productoTipo === 'caja' && productoCapacidad
        ? Number(productoCapacidad)
        : null;

    const precio =
      productoPrecio !== ''
        ? Number(productoPrecio)
        : null;

    const stockInicial = Math.max(0, Number(productoStock) || 0);

    setGuardando(true);
    setError(null);

    const { data: nuevoProducto, error: productoError } = await supabase
      .from('productos')
      .insert({
        nombre: productoNombre.trim(),
        tipo: productoTipo,
        capacidad,
        precio,
        activo: true
      })
      .select('id')
      .single();

    if (productoError) {
      setError(productoError.message);
      setGuardando(false);
      return;
    }

    const { error: stockError } = await supabase
      .from('inventario_productos')
      .insert({
        producto_id: nuevoProducto.id,
        stock: stockInicial
      });

    if (stockError) {
      setError(stockError.message);
      setGuardando(false);
      return;
    }

    setProductoNombre('');
    setProductoTipo('caja');
    setProductoCapacidad('');
    setProductoPrecio('');
    setProductoStock(0);
    setMostrarFormularioProducto(false);
    setGuardando(false);

    await cargarDatos();
  }

  function empezarEdicion(producto) {
    setProductoEditando(producto.id);
    setEditNombre(producto.nombre || '');
    setEditTipo(producto.tipo || 'caja');
    setEditCapacidad(producto.capacidad ?? '');
    setEditPrecio(producto.precio ?? '');
    setError(null);
  }

  function cancelarEdicion() {
    setProductoEditando(null);
    setEditNombre('');
    setEditTipo('caja');
    setEditCapacidad('');
    setEditPrecio('');
  }

  async function guardarEdicion(productoId) {
    if (!editNombre.trim()) {
      setError('El producto necesita un nombre.');
      return;
    }

    setGuardando(true);
    setError(null);

    const capacidad =
      editTipo === 'caja' && editCapacidad !== ''
        ? Number(editCapacidad)
        : null;

    const precio =
      editPrecio !== ''
        ? Number(editPrecio)
        : null;

    const { error } = await supabase
      .from('productos')
      .update({
        nombre: editNombre.trim(),
        tipo: editTipo,
        capacidad,
        precio,
        updated_at: new Date().toISOString()
      })
      .eq('id', productoId);

    if (error) {
      setError(error.message);
      setGuardando(false);
      return;
    }

    cancelarEdicion();
    setGuardando(false);
    await cargarDatos();
  }

  async function cambiarStockProducto(producto, cambio) {
    const nuevoStock = Math.max(0, producto.stock + cambio);

    const { error } = await supabase
      .from('inventario_productos')
      .upsert({
        producto_id: producto.id,
        stock: nuevoStock,
        updated_at: new Date().toISOString()
      });

    if (error) {
      setError(error.message);
      return;
    }

    await cargarDatos();
  }

  const totalDisponibles = piezas.filter(
    p => p.estado === 'disponible'
  ).length;

  const totalOtrosProductos = resumenProductos.reduce(
    (suma, p) => suma + p.disponible,
    0
  );

  if (cargando) {
    return (
      <main className="page-shell">
        <h1>Cargando inventario…</h1>
      </main>
    );
  }

  return (
    <main className="admin-page">

      <aside className="admin-side">
        <div className="brand-mark admin-logo">MDM</div>
        <strong>Administración</strong>

        <nav>
          <Link href="/admin" className="active">Inventario</Link>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/admin/series">Series</Link>
          <Link href="/admin/pedidos">Pedidos</Link>
          <Link href="/admin/usuarios">Usuarios</Link>
        </nav>

        <Link href="/">← Web pública</Link>
      </aside>

      <section className="admin-main">

        <div className="admin-top">
          <div>
            <div className="page-eyebrow">
              Administración / Inventario
            </div>

            <h1>
              {vista === 'maderas'
                ? 'Piezas de madera'
                : 'Otros productos'}
            </h1>
          </div>

          {vista === 'maderas' ? (
            <button
              className="button dark"
              onClick={() =>
                setMostrarFormularioPiezas(!mostrarFormularioPiezas)
              }
            >
              + Añadir piezas
            </button>
          ) : (
            <button
              className="button dark"
              onClick={() =>
                setMostrarFormularioProducto(!mostrarFormularioProducto)
              }
            >
              + Nuevo producto
            </button>
          )}
        </div>

        <div className="admin-inventory-tabs">
          <button
            className={vista === 'maderas' ? 'active' : ''}
            onClick={() => setVista('maderas')}
          >
            Piezas de madera
          </button>

          <button
            className={vista === 'productos' ? 'active' : ''}
            onClick={() => setVista('productos')}
          >
            Otros productos
          </button>
        </div>

        {error && <p className="admin-error">{error}</p>}

        {vista === 'maderas' && (
          <>
            {mostrarFormularioPiezas && (
              <form className="new-piece-form" onSubmit={crearPiezas}>
                <div>
                  <span className="page-eyebrow">Entrada de stock</span>
                  <h2>Añadir piezas</h2>
                </div>

                <label>
                  Madera
                  <select
                    value={maderaId}
                    onChange={(e) => setMaderaId(e.target.value)}
                  >
                    {maderas.map((m) => (
                      <option value={m.id} key={m.id}>
                        #{String(m.xilo_id).padStart(3, '0')} · {m.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                  />
                </label>

                <div className="new-piece-actions">
                  <button
                    type="submit"
                    className="button dark"
                    disabled={guardando}
                  >
                    {guardando ? 'Añadiendo…' : 'Añadir'}
                  </button>

                  <button
                    type="button"
                    className="button"
                    onClick={() => setMostrarFormularioPiezas(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div className="admin-stats">
              <div>
                <span>Stock disponible</span>
                <strong>{totalDisponibles}</strong>
              </div>

              <div>
                <span>Maderas con stock</span>
                <strong>
                  {resumenMaderas.filter(m => m.disponibles > 0).length}
                </strong>
              </div>

              <div>
                <span>Unidades registradas</span>
                <strong>{piezas.length}</strong>
              </div>
            </div>

            <div className="inventory-summary">
              <div className="inventory-summary-row inventory-summary-head">
                <span>#</span>
                <span>Madera</span>
                <span>Total</span>
                <span>Disponibles</span>
                <span>Reservadas</span>
                <span>Vendidas</span>
                <span></span>
              </div>

              {resumenMaderas.map((m) => (
                <div className="inventory-summary-row" key={m.id}>
                  <span>
                    {String(m.xilo_id).padStart(3, '0')}
                  </span>

                  <span>
                    <strong>{m.nombre}</strong>
                    <em>{m.nombre_cientifico}</em>
                  </span>

                  <span>{m.total}</span>
                  <span><strong>{m.disponibles}</strong></span>
                  <span>{m.reservadas}</span>
                  <span>{m.vendidas}</span>

                  <span className="inventory-actions">
                    <button
                      type="button"
                      disabled={m.disponibles === 0}
                      onClick={() => venderUna(m)}
                    >
                      Vender 1
                    </button>

                    <Link href={`/catalogo/${m.slug}`}>
                      Ficha ↗
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {vista === 'productos' && (
          <>
            {mostrarFormularioProducto && (
              <form
                className="new-product-form"
                onSubmit={crearProducto}
              >
                <div>
                  <span className="page-eyebrow">Nuevo producto</span>
                  <h2>Crear producto</h2>
                </div>

                <label>
                  Nombre
                  <input
                    value={productoNombre}
                    onChange={(e) => setProductoNombre(e.target.value)}
                    placeholder="Caja para 10 piezas"
                  />
                </label>

                <label>
                  Tipo
                  <select
                    value={productoTipo}
                    onChange={(e) => setProductoTipo(e.target.value)}
                  >
                    <option value="caja">Caja para piezas</option>
                    <option value="otro">Otro producto</option>
                  </select>
                </label>

                {productoTipo === 'caja' && (
                  <label>
                    Capacidad
                    <input
                      type="number"
                      min="1"
                      value={productoCapacidad}
                      onChange={(e) => setProductoCapacidad(e.target.value)}
                      placeholder="10"
                    />
                  </label>
                )}

                <label>
                  Precio €
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productoPrecio}
                    onChange={(e) => setProductoPrecio(e.target.value)}
                    placeholder="19.90"
                  />
                </label>

                <label>
                  Stock inicial
                  <input
                    type="number"
                    min="0"
                    value={productoStock}
                    onChange={(e) => setProductoStock(e.target.value)}
                  />
                </label>

                <div className="new-piece-actions">
                  <button
                    type="submit"
                    className="button dark"
                    disabled={guardando}
                  >
                    {guardando ? 'Creando…' : 'Crear producto'}
                  </button>

                  <button
                    type="button"
                    className="button"
                    onClick={() => setMostrarFormularioProducto(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div className="admin-stats">
              <div>
                <span>Unidades en stock</span>
                <strong>{totalOtrosProductos}</strong>
              </div>

              <div>
                <span>Productos</span>
                <strong>{resumenProductos.length}</strong>
              </div>

              <div>
                <span>Con stock</span>
                <strong>
                  {resumenProductos.filter(p => p.disponible > 0).length}
                </strong>
              </div>
            </div>

            <div className="other-products-table">
              <div className="other-products-row other-products-head">
                <span>Producto</span>
                <span>Tipo</span>
                <span>Stock / reservado / disponible</span>
                <span></span>
              </div>

              {resumenProductos.length === 0 && (
                <div className="other-products-empty">
                  Todavía no hay otros productos creados.
                </div>
              )}

              {resumenProductos.map(producto => (
                <div className="other-products-row" key={producto.id}>

                  {productoEditando === producto.id ? (
                    <>
                      <span className="product-edit-fields">
                        <input
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                        />
                      </span>

                      <span className="product-edit-fields">
                        <select
                          value={editTipo}
                          onChange={(e) => setEditTipo(e.target.value)}
                        >
                          <option value="caja">Caja para piezas</option>
                          <option value="otro">Otro producto</option>
                        </select>
                      </span>

                      <span>
                        <strong>{producto.stock}</strong>
                        <em>
                          {producto.reservado} reserv. · {producto.disponible} disp.
                        </em>
                      </span>

                      <span className="inventory-actions">
                        {editTipo === 'caja' && (
                          <label className="product-edit-field">
                            <span>Capacidad</span>
                            <input
                              className="small-edit-input"
                              type="number"
                              min="1"
                              value={editCapacidad}
                              onChange={(e) => setEditCapacidad(e.target.value)}
                            />
                          </label>
                        )}

                        <label className="product-edit-field">
                          <span>Precio €</span>
                          <input
                            className="small-edit-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={editPrecio}
                            onChange={(e) => setEditPrecio(e.target.value)}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => guardarEdicion(producto.id)}
                          disabled={guardando}
                        >
                          Guardar
                        </button>

                        <button
                          type="button"
                          onClick={cancelarEdicion}
                        >
                          Cancelar
                        </button>
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        <strong>{producto.nombre}</strong>

                        {producto.capacidad && (
                          <em>
                            Capacidad: {producto.capacidad} piezas
                          </em>
                        )}

                        {producto.precio != null && (
                          <em>
                            {Number(producto.precio).toFixed(2)} €
                          </em>
                        )}
                      </span>

                      <span>
                        {producto.tipo === 'caja'
                          ? 'Caja para piezas'
                          : 'Otro producto'}
                      </span>

                      <span>
                        <strong>{producto.stock}</strong>
                        <em>
                          {producto.reservado} reserv. · {producto.disponible} disp.
                        </em>
                      </span>

                      <span className="inventory-actions">
                        <button
                          onClick={() => cambiarStockProducto(producto, -1)}
                          disabled={producto.stock === 0}
                        >
                          −1
                        </button>

                        <button
                          onClick={() => cambiarStockProducto(producto, 1)}
                        >
                          +1
                        </button>

                        <button
                          onClick={() => cambiarStockProducto(producto, 10)}
                        >
                          +10
                        </button>

                        <button
                          type="button"
                          onClick={() => empezarEdicion(producto)}
                        >
                          Editar
                        </button>
                      </span>
                    </>
                  )}

                </div>
              ))}
            </div>
          </>
        )}

      </section>
    </main>
  );
}
