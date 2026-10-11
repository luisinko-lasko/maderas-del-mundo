export const VENTA_VERSION = '2026-10-11';
export const CORREO_VENTAS = 'contacto@maderasdelmundo.es';
export const porcentajeDescuento = piezas => piezas >= 20 ? 20 : piezas >= 10 ? 10 : 0;
export const costeEnvio = piezas => piezas >= 5 && piezas <= 30 ? (piezas <= 10 ? 5 : 8) : null;
export const euros = valor => Number(valor || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

export function errorEnvio(piezas, pais, codigoPostal) {
  if (piezas < 5) return 'El envío a domicilio requiere una compra mínima de 5 piezas.';
  if (piezas > 30) return `Para enviar más de 30 piezas, consulta en ${CORREO_VENTAS}.`;
  const cp = String(codigoPostal || '').trim();
  const prefijo = Number(cp.slice(0, 2));
  if (!['españa', 'espana', 'spain', 'es'].includes(String(pais || '').trim().toLowerCase()) ||
      !/^\d{5}$/.test(cp) || prefijo < 1 || prefijo > 50 || [7, 35, 38].includes(prefijo)) {
    return `Solo enviamos a la península española. Para otros destinos, consulta en ${CORREO_VENTAS}.`;
  }
  return '';
}

export function lineasStripe(pedido) {
  if (pedido.venta_version !== VENTA_VERSION) throw new Error('Revisa los datos de entrega para actualizar el pedido.');
  if (pedido.entrega === 'envio') {
    const error = errorEnvio(pedido.numero_piezas, pedido.pais_entrega, pedido.codigo_postal_entrega);
    if (error) throw new Error(error);
  }
  const centimos = valor => Math.round(Number(valor || 0) * 100);
  const cajas = (pedido.pedido_lineas || []).reduce((s, l) => s + centimos(l.precio_caja_unitario) * l.cantidad, 0);
  const articulos = centimos(pedido.subtotal) - centimos(pedido.descuento) - cajas;
  const filas = [
    [`Piezas y series · ${pedido.numero_piezas} piezas${pedido.descuento_porcentaje ? ` · descuento ${pedido.descuento_porcentaje}%` : ''}`, articulos],
    ['Cajas', cajas],
    ['Envío a domicilio · península española', centimos(pedido.gastos_envio)]
  ].filter(([, importe]) => importe > 0);
  if (filas.reduce((s, [, n]) => s + n, 0) !== centimos(pedido.total)) throw new Error('El importe del pedido no coincide con el pago.');
  return filas.map(([name, unit_amount]) => ({quantity: 1, price_data: {currency: 'eur', unit_amount, product_data: {name}}}));
}

export function comprobarImporteStripe(session, pedido) {
  if (session.currency !== 'eur' || session.amount_total !== Math.round(Number(pedido.total) * 100)) {
    throw new Error('El pago de Stripe no coincide con el importe del pedido. Contacta con contacto@maderasdelmundo.es.');
  }
}
