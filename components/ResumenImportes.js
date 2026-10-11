import { costeEnvio, euros } from '../lib/venta';
export default function ResumenImportes({ pedido, entrega, provisional = false }) {
  const modo = entrega || pedido.entrega;
  const envio = modo === 'envio' ? (provisional ? costeEnvio(Number(pedido.numero_piezas)) : Number(pedido.gastos_envio)) : 0;
  const total = Number(pedido.subtotal) - Number(pedido.descuento) + (envio || 0);
  return <div>
    <div className="checkout-line"><span>Artículos · {pedido.numero_piezas} piezas</span><span>{euros(pedido.subtotal)}</span></div>
    {Number(pedido.descuento) > 0 && <div className="checkout-line"><span>Descuento {pedido.descuento_porcentaje}%</span><span>−{euros(pedido.descuento)}</span></div>}
    <div className="checkout-line"><span>{modo === 'envio' ? 'Envío a domicilio' : 'Recogida en mano'}</span><span>{envio === null ? 'Consultar / mínimo 5 piezas' : euros(envio)}</span></div>
    <div className="checkout-total"><span>{envio === null ? 'Artículos con descuento' : provisional ? 'Total previsto' : 'Total'}</span><strong>{euros(total)}</strong></div>
  </div>;
}
