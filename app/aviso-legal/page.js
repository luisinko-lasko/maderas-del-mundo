import styles from '../privacidad/privacidad.module.css';

export const metadata = {
  title: 'Aviso legal · Maderas del mundo'
};

export default function AvisoLegalPage() {
  return (
    <main className={`page-shell ${styles.page}`}>
      <div className="page-eyebrow">Maderas del mundo / Legal</div>
      <h1>Aviso legal</h1>

      <p>
        Este aviso regula el acceso y uso del sitio web maderasdelmundo.es y recoge
        la información general del responsable de la actividad.
      </p>

      <h2>1. Titular del sitio</h2>
      <ul>
        <li>Titular: Asociación Maderas del Mundo.</li>
        <li>NIF: en tramitación.</li>
        <li>Domicilio social: Mercado de Nápoles, puesto 17, C/ Nápoles 53, 28043 Madrid, España.</li>
        <li>Correo electrónico: contacto@maderasdelmundo.es.</li>
        <li>Dominio: maderasdelmundo.es.</li>
      </ul>

      <h2>2. Objeto</h2>
      <p>
        Maderas del Mundo ofrece información sobre distintas especies de madera,
        herramientas para gestionar una colección personal y, cuando esté habilitada
        la venta, la posibilidad de adquirir piezas y series a través del sitio web.
      </p>

      <h2>3. Acceso y uso</h2>
      <p>
        El acceso al sitio implica aceptar estas condiciones de uso. El usuario se
        compromete a utilizar la web de forma lícita, a no interferir con su funcionamiento
        y a no intentar acceder a áreas, cuentas o datos para los que no tenga autorización.
      </p>

      <h2>4. Información comercial y precios</h2>
      <p>
        Cuando se ofrezcan productos a la venta, sus características esenciales, precio
        y, en su caso, gastos de envío se mostrarán antes de finalizar la compra. Las
        condiciones específicas de cada pedido serán las mostradas durante el proceso de
        compra y confirmadas al usuario.
      </p>

      <h2>5. Propiedad intelectual</h2>
      <p>
        Los textos, diseño, estructura y contenidos originales de Maderas del Mundo están
        protegidos por la normativa aplicable. Las fotografías, imágenes o materiales de
        terceros conservarán la autoría y condiciones de licencia que les correspondan.
        No se autoriza su explotación fuera de los límites permitidos por la ley o por la
        licencia aplicable.
      </p>

      <h2>6. Enlaces externos</h2>
      <p>
        El sitio puede incluir enlaces a páginas o servicios de terceros. Maderas del Mundo
        no controla su contenido ni sus políticas y no responde de cambios o actuaciones
        realizadas por esos terceros.
      </p>

      <h2>7. Responsabilidad</h2>
      <p>
        Se procura mantener la información del sitio actualizada y el servicio disponible,
        pero no puede garantizarse la ausencia absoluta de errores, interrupciones o
        incidencias técnicas. Cuando se detecte un error relevante se intentará corregirlo
        tan pronto como sea razonablemente posible.
      </p>

      <h2>8. Protección de datos</h2>
      <p>
        El tratamiento de datos personales se regula en la Política de privacidad del sitio.
        Para cualquier cuestión relacionada con privacidad o con el propio sitio puedes
        escribir a contacto@maderasdelmundo.es.
      </p>

      <h2>9. Legislación aplicable</h2>
      <p>
        Este sitio se rige por la legislación española que resulte aplicable. Cuando la
        normativa de consumidores determine un fuero obligatorio, será de aplicación el que
        corresponda conforme a dicha normativa.
      </p>
    </main>
  );
}
