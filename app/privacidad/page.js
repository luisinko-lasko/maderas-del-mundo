import styles from './privacidad.module.css';

export const metadata = {
  title: 'Política de privacidad · Maderas del mundo'
};

export default function PrivacidadPage() {
  return (
    <main className={`page-shell ${styles.page}`}>
      <div className="page-eyebrow">Maderas del mundo / Legal</div>
      <h1>Política de privacidad</h1>

      <p>
        Esta política explica qué datos personales tratamos en Maderas del Mundo,
        para qué los utilizamos y qué derechos tienes sobre ellos.
      </p>

      <div className={styles.summary}>
        <div>
          <span>Responsable</span>
          <strong>Luis Rodriguez · Maderas del Mundo</strong>
        </div>
        <div>
          <span>Contacto</span>
          <strong>contacto@maderasdelmundo.es</strong>
        </div>
        <div>
          <span>Finalidades</span>
          <strong>Cuenta, pedidos, colección y atención al usuario</strong>
        </div>
        <div>
          <span>Base jurídica</span>
          <strong>Contrato, obligación legal e interés legítimo</strong>
        </div>
      </div>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento de los datos recogidos a través de este sitio es
        <strong> Luis Rodriguez</strong>, que desarrolla el proyecto y actividad bajo el
        nombre comercial <strong>Maderas del Mundo</strong>.
      </p>
      <ul>
        <li>Correo electrónico: contacto@maderasdelmundo.es.</li>
        <li>Sitio web: maderasdelmundo.es.</li>
      </ul>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li>Datos de cuenta: correo electrónico e identificadores de usuario.</li>
        <li>Datos de perfil y entrega: nombre, apellidos, teléfono y dirección.</li>
        <li>Datos de compra: pedidos, importes, piezas adquiridas y estado del pedido.</li>
        <li>Datos de colección: maderas incorporadas a tu colección digital.</li>
        <li>Datos técnicos imprescindibles para seguridad y funcionamiento del servicio.</li>
      </ul>

      <h2>3. Para qué usamos los datos</h2>
      <ul>
        <li>Crear y mantener tu cuenta y tu colección digital.</li>
        <li>Gestionar compras, pagos, preparación, entrega y atención posventa.</li>
        <li>Registrar ventas presenciales asociadas a tu cuenta cuando proceda.</li>
        <li>Enviar comunicaciones necesarias relacionadas con tus pedidos o tu cuenta.</li>
        <li>Atender consultas, incidencias y solicitudes relacionadas con el servicio.</li>
        <li>Prevenir fraude, abuso y problemas de seguridad.</li>
      </ul>

      <h2>4. Base jurídica</h2>
      <p>
        El tratamiento necesario para gestionar tu cuenta, pedidos, comunicaciones de
        servicio y colección se basa en la ejecución de la relación contractual o en
        medidas precontractuales. Los tratamientos exigidos por normativa fiscal,
        mercantil o de consumo se realizan por obligación legal. Determinadas medidas de
        seguridad y prevención del abuso pueden basarse en el interés legítimo del
        responsable.
      </p>

      <h2>5. Proveedores y destinatarios</h2>
      <p>
        Para prestar el servicio utilizamos proveedores tecnológicos que pueden tratar
        datos por cuenta del responsable, entre ellos Supabase para autenticación y base
        de datos, Vercel para alojamiento de la aplicación, Stripe para pagos y Brevo para
        el envío de comunicaciones transaccionales relacionadas con pedidos y cuenta.
      </p>
      <p>
        No vendemos datos personales. Solo se comunicarán datos cuando sea necesario para
        prestar el servicio, cumplir una obligación legal o cuando exista otra base legítima.
      </p>

      <h2>6. Transferencias internacionales</h2>
      <p>
        Algunos proveedores tecnológicos pueden operar fuera del Espacio Económico Europeo.
        Cuando esto ocurra, el tratamiento deberá realizarse con las garantías previstas por
        la normativa aplicable, como decisiones de adecuación o cláusulas contractuales
        apropiadas ofrecidas por los respectivos proveedores.
      </p>

      <h2>7. Plazos de conservación</h2>
      <ul>
        <li>Datos de cuenta: mientras mantengas la cuenta activa y posteriormente durante los plazos necesarios para atender responsabilidades.</li>
        <li>Pedidos y facturación: durante los plazos exigidos por la normativa fiscal, mercantil y de consumo.</li>
        <li>Datos técnicos y de seguridad: durante el tiempo estrictamente necesario para su finalidad.</li>
      </ul>

      <h2>8. Tus derechos</h2>
      <p>
        Puedes solicitar acceso a tus datos, rectificación, supresión, limitación del
        tratamiento, portabilidad u oposición cuando corresponda escribiendo a
        <strong> contacto@maderasdelmundo.es</strong>.
      </p>
      <p>
        Si consideras que el tratamiento de tus datos no es adecuado, puedes presentar una
        reclamación ante la Agencia Española de Protección de Datos (AEPD).
      </p>

      <h2>9. Decisiones automatizadas</h2>
      <p>
        Maderas del Mundo no adopta decisiones con efectos jurídicos sobre los usuarios
        basadas únicamente en tratamientos automatizados ni realiza perfiles comerciales
        automatizados con ese alcance.
      </p>

      <h2>10. Cambios en esta política</h2>
      <p>
        Esta política podrá actualizarse cuando cambien los servicios, proveedores o
        requisitos legales. La versión publicada en esta página será la aplicable en cada
        momento.
      </p>
    </main>
  );
}
