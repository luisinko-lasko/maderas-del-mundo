import Link from 'next/link';
export default function CondicionesVenta() {
  return <div className="sale-conditions">
    <p><strong>Descuento en piezas:</strong> 10% desde 10 piezas y 20% desde 20. Se aplica un único descuento al importe de las piezas y series, sin cajas ni envío.</p>
    <p><strong>Envío a domicilio:</strong> mínimo 5 piezas. Península española: 5 € de 5 a 10 piezas y 8 € de 11 a 30. Para otros destinos o más de 30 piezas, <a href="mailto:contacto@maderasdelmundo.es">consulta por correo</a>.</p>
    <p>La recogida en mano no tiene mínimo ni gastos de envío. Las piezas incluidas en las series cuentan para los tramos. <Link href="/condiciones-compra">Condiciones de compra</Link>.</p>
  </div>;
}
