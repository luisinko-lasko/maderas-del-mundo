import Link from 'next/link';
import styles from '../privacidad/privacidad.module.css';
import { CONDICIONES_COMPRA_VERSION } from '../../lib/legal';

export const metadata = {
  title: 'Condiciones de compra · Maderas del mundo'
};

export default function CondicionesCompraPage() {
  return (
    <main className={`page-shell ${styles.page}`}>
      <div className="page-eyebrow">Maderas del mundo / Legal</div>
      <h1>Condiciones de compra</h1>

      <p>
        Estas condiciones regulan las compras realizadas en maderasdelmundo.es.
        La versión aplicable a cada pedido es la que el cliente acepta antes de
        acceder al pago.
      </p>

      <div className={styles.summary}>
        <div>
          <span>Vendedor</span>
          <strong>Asociación Maderas del Mundo</strong>
        </div>
        <div>
          <span>Contacto</span>
          <strong>contacto@maderasdelmundo.es</strong>
        </div>
        <div>
          <span>Desistimiento</span>
          <strong>14 días naturales</strong>
        </div>
        <div>
          <span>Versión</span>
          <strong>{CONDICIONES_COMPRA_VERSION}</strong>
        </div>
      </div>

      <h2>1. Identidad del vendedor</h2>
      <p>
        El vendedor es la <strong>Asociación Maderas del Mundo</strong>, con domicilio
        social en Mercado de Nápoles, puesto 17, C/ Nápoles 53, 28043 Madrid, España.
        Los datos identificativos y de contacto actualizados están disponibles en el{' '}
        <Link href="/aviso-legal">Aviso legal</Link>.
      </p>

      <h2>2. Productos</h2>
      <p>
        Maderas del Mundo comercializa piezas de madera para colección y, cuando
        estén disponibles, series, cajas u otros productos relacionados. Las
        características esenciales de cada producto se muestran en su ficha o
        durante el proceso de compra.
      </p>
      <p>
        La madera es un material natural. El color, la veta, el poro y otros rasgos
        visuales pueden variar entre piezas de una misma especie. Estas variaciones
        naturales no se considerarán por sí solas una falta de conformidad cuando
        la pieza corresponda a la especie y características anunciadas.
      </p>

      <h2>3. Precio y forma de pago</h2>
      <p>
        Los precios se expresan en euros. Antes de confirmar el pago se muestra el
        importe total del pedido y, cuando proceda, cualquier coste adicional que
        resulte aplicable. El pago online se realiza mediante Stripe.
      </p>
      <p>
        Mientras el proceso de compra no muestre un coste de entrega separado,
        no se cargará al cliente ningún importe adicional por ese concepto.
      </p>

      <h2>4. Proceso de compra</h2>
      <p>
        El cliente selecciona los productos, inicia sesión o continúa como invitado,
        facilita o confirma sus datos de entrega, revisa el resumen del pedido,
        acepta estas condiciones y accede al pago seguro. Antes de pagar puede
        volver atrás para corregir los datos introducidos.
      </p>
      <p>
        El contrato se formaliza en español. Maderas del Mundo conserva en su sistema
        los datos esenciales del pedido y la versión de las condiciones aceptadas.
        Los clientes registrados pueden consultar sus pedidos desde su cuenta cuando
        esa función esté disponible para el estado correspondiente.
      </p>

      <h2>5. Disponibilidad y reserva</h2>
      <p>
        Las piezas físicas se asignan según la disponibilidad real de inventario.
        Durante el proceso de compra pueden quedar reservadas temporalmente. Una
        reserva caducada no garantiza la disponibilidad posterior de esas piezas.
      </p>
      <p>
        Si excepcionalmente no pudiera cumplirse un pedido ya pagado por falta de
        disponibilidad, se informará al cliente y se realizará el reembolso que
        corresponda sin demora indebida.
      </p>

      <h2>6. Entrega</h2>
      <p>
        El cliente podrá elegir las modalidades de entrega que estén disponibles en
        el proceso de compra. Cuando exista envío a domicilio, la dirección facilitada
        por el cliente será la utilizada para la entrega.
      </p>
      <p>
        Si no se acuerda expresamente un plazo diferente, el pedido se ejecutará sin
        demora indebida y, en todo caso, dentro del plazo máximo legal aplicable.
      </p>

      <h2>7. Derecho de desistimiento</h2>
      <p>
        En las compras a distancia, el consumidor dispone con carácter general de
        catorce días naturales desde que él o un tercero indicado por él, distinto
        del transportista, recibe los bienes para comunicar su decisión de desistir
        sin necesidad de justificar el motivo.
      </p>
      <p>
        Para ejercer este derecho basta con enviar, antes de que termine el plazo,
        una declaración inequívoca a contacto@maderasdelmundo.es. También puede
        utilizarse el modelo incluido al final de esta página, aunque no es obligatorio.
      </p>

      <h2>8. Devolución tras el desistimiento</h2>
      <p>
        Después de comunicar el desistimiento, los bienes deberán devolverse sin
        demora indebida y, como máximo, dentro de los catorce días naturales
        siguientes. Salvo que Maderas del Mundo indique expresamente lo contrario,
        el consumidor asumirá el coste directo de la devolución.
      </p>
      <p>
        El reembolso comprenderá los pagos que legalmente correspondan, incluidos
        en su caso los costes de la modalidad ordinaria de entrega. Se realizará por
        el mismo medio de pago utilizado en la compra, salvo acuerdo distinto, y
        dentro de los plazos legales. El reembolso podrá retenerse hasta recibir los
        bienes o hasta que el consumidor presente una prueba de su devolución, según
        proceda legalmente.
      </p>
      <p>
        El consumidor solo responderá de la disminución de valor causada por una
        manipulación distinta de la necesaria para determinar la naturaleza,
        características y funcionamiento del bien.
      </p>

      <h2>9. Excepciones al desistimiento</h2>
      <p>
        Las piezas ordinarias de catálogo no quedan excluidas del desistimiento por
        el mero hecho de ser de madera. Si en el futuro se ofreciera un producto
        confeccionado conforme a especificaciones del cliente o claramente
        personalizado, la posible exclusión del derecho de desistimiento se indicará
        expresamente antes de la compra.
      </p>

      <h2>10. Producto defectuoso o falta de conformidad</h2>
      <p>
        Los derechos derivados de una falta de conformidad son independientes del
        derecho de desistimiento. Para los bienes nuevos se aplicará el plazo legal
        de responsabilidad vigente. El cliente puede comunicar cualquier incidencia
        a contacto@maderasdelmundo.es para que se tramite la solución que corresponda.
      </p>

      <h2>11. Atención y reclamaciones</h2>
      <p>
        Para consultas relacionadas con una compra, entrega, devolución o reclamación,
        puede escribirse a contacto@maderasdelmundo.es. La identificación completa del
        vendedor y su domicilio constan en el <Link href="/aviso-legal">Aviso legal</Link>.
      </p>

      <h2>12. Legislación aplicable y jurisdicción</h2>
      <p>
        Estas condiciones se rigen por la legislación española.
      </p>
      <p>
        Para cualquier controversia derivada de la contratación, serán competentes los
        juzgados y tribunales que correspondan conforme a la legislación aplicable.
      </p>
      <p>
        Cuando el comprador tenga la condición de consumidor o usuario, se respetarán
        en todo caso las normas imperativas sobre competencia territorial y, en particular,
        los fueros que legalmente le correspondan.
      </p>

      <h2>Modelo de desistimiento</h2>
      <p>
        A la atención de Asociación Maderas del Mundo: por la presente comunico que
        desisto de mi contrato de venta del siguiente bien o bienes: [indicar productos].
        Pedido: [número de pedido]. Recibido el: [fecha]. Nombre del consumidor: [nombre].
        Dirección: [dirección]. Fecha: [fecha].
      </p>
      <p>
        Puede enviarse este texto, o cualquier otra declaración inequívoca con la misma
        finalidad, a contacto@maderasdelmundo.es.
      </p>
    </main>
  );
}
