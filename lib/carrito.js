const CLAVE = 'mdm-carrito';

export function leerCarrito() {
  if (typeof window === 'undefined') return [];

  try {
    return JSON.parse(localStorage.getItem(CLAVE) || '[]');
  } catch {
    return [];
  }
}

function guardar(carrito) {
  localStorage.setItem(CLAVE, JSON.stringify(carrito));
  window.dispatchEvent(new Event('mdm-carrito'));
}

export function añadirAlCarrito(item) {
  const carrito = leerCarrito();
  const clave = item.clave;
  const existente = carrito.find(x => x.clave === clave);

  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ ...item, cantidad: 1 });
  }

  guardar(carrito);
}

export function cambiarCantidad(clave, cantidad) {
  let carrito = leerCarrito();

  if (cantidad <= 0) {
    carrito = carrito.filter(x => x.clave !== clave);
  } else {
    carrito = carrito.map(x => x.clave === clave ? { ...x, cantidad } : x);
  }

  guardar(carrito);
}

export function eliminarDelCarrito(clave) {
  guardar(leerCarrito().filter(x => x.clave !== clave));
}

export function vaciarCarrito() {
  guardar([]);
}

const CLAVE_PEDIDO = 'mdm-pedido-activo';

export function leerPedidoActivo() {
  if (typeof window === 'undefined') return null;

  try {
    return JSON.parse(localStorage.getItem(CLAVE_PEDIDO) || 'null');
  } catch {
    return null;
  }
}

export function guardarPedidoActivo(id, firmaCarrito, extras = {}) {
  localStorage.setItem(
    CLAVE_PEDIDO,
    JSON.stringify({ id, firmaCarrito, ...extras })
  );
}

export function borrarPedidoActivo() {
  localStorage.removeItem(CLAVE_PEDIDO);
}

export function firmaCarrito(carrito = leerCarrito()) {
  return JSON.stringify(
    carrito
      .map(item => ({
        tipo: item.tipo,
        id: item.id,
        cantidad: item.cantidad,
        caja_id: item.caja_id || null
      }))
      .sort((a, b) =>
        `${a.tipo}-${a.id}-${a.caja_id || ''}`.localeCompare(
          `${b.tipo}-${b.id}-${b.caja_id || ''}`
        )
      )
  );
}
