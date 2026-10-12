# Manual de administración y mantenimiento de Maderas del Mundo

Versión 1 · 11 de octubre de 2026
Responsable del proyecto: Luis Rodríguez
Web: https://www.maderasdelmundo.es
Repositorio: https://github.com/luisinko-lasko/maderas-del-mundo
Estado de referencia del código: 443ea3a, antes de incorporar este manual.

Este manual permite administrar el catálogo, las fotografías, el inventario, las ventas y las cuentas, y localizar los cambios técnicos en cada plataforma. Empieza por la tarea que quieras hacer en el capítulo 2. Los capítulos 3 a 8 cubren el trabajo diario; los capítulos 9 a 15 explican código, configuración, publicación y recuperación.

Los procedimientos que modifican datos requieren comprobar el proyecto y el registro antes de guardar. Las contraseñas y claves reales se conservan en sus paneles y en un gestor de contraseñas; este documento identifica dónde encontrarlas sin reproducirlas. Un despliegue de la web no sustituye una copia de la base de datos.

## 1 Cómo está organizado el sistema

### 1.1 Las plataformas y su función

| Plataforma | Qué contiene | Cuándo se usa |
| --- | --- | --- |
| Google Sheets | Fichas de maderas y PVP en la pestaña MDM | Corregir datos o incorporar especies |
| Google Apps Script | Macro que envía MDM a Supabase y consulta Species+ | Sincronizar y mantener CITES |
| Supabase Database | Catálogo, piezas, productos, pedidos y colecciones | Consultar datos y cambiar reglas del servidor |
| Supabase Auth | Cuentas, contraseñas y confirmaciones | Recuperar acceso y administrar autenticación |
| Supabase Storage | Fotografías de las 86 maderas | Subir o sustituir imágenes |
| GitHub | Archivos de la web y su historial | Cambiar textos, diseño y funcionamiento |
| Vercel | Compilación y publicación de la web | Desplegar, configurar variables y consultar errores |
| Stripe | Sesiones de pago y cobros | Comprobar pagos, pruebas y reembolsos |
| Brevo | Correos transaccionales enviados por la aplicación | Comprobar confirmaciones y avisos de alta |
| Proveedor de dominio y correo | DNS y buzón contacto@maderasdelmundo.es | Renovaciones, correo y cambios de dominio |
| Species+ | Información consultada sobre CITES y UE | Actualizar columnas L a N de MDM |

El recorrido de los datos es: MDM → macro → Supabase → web. El recorrido del código es: GitHub → Vercel → web. El pago va desde la web a Stripe, que comunica el resultado al servidor; el servidor actualiza Supabase y envía la confirmación con Brevo.

### 1.2 Accesos que conviene guardar

| Acceso | Dirección |
| --- | --- |
| Web pública | https://www.maderasdelmundo.es |
| Administración | https://www.maderasdelmundo.es/admin |
| Código | https://github.com/luisinko-lasko/maderas-del-mundo |
| Proyecto Vercel | https://vercel.com/maderas-del-mundo/maderas-del-mundo |
| Proyecto Supabase | https://supabase.com/dashboard/project/zdmhhxjghmbdccsbbmob |
| Hoja MDM | https://docs.google.com/spreadsheets/d/1KfHApEF4aVWYWc7N1o7m-2ZzpYobo8goNZg0LQ_HwKY/edit#gid=1230961312 |
| Stripe | https://dashboard.stripe.com |
| Brevo | https://app.brevo.com |

En Vercel, el equipo y el proyecto se llaman maderas-del-mundo. En Supabase, la referencia del proyecto es zdmhhxjghmbdccsbbmob y la URL de la API es https://zdmhhxjghmbdccsbbmob.supabase.co. La hoja tiene otras pestañas, pero la macro de sincronización documentada lee únicamente MDM.

Guarda fuera del repositorio qué cuenta utilizas para cada plataforma, cómo recuperar su acceso y quién gestiona el dominio y el buzón. Las cuentas de la web en Supabase Auth son independientes de las cuentas con las que entras en GitHub, Vercel o Supabase.

### 1.3 Tres identificadores diferentes

xilo_id es el número estable de una especie: 1, 2, …, 86. Sirve para vincular MDM y la base de datos y para nombrar las fotos. id es el UUID interno de esa especie y se usa en relaciones con otras tablas. codigo identifica una pieza física concreta, por ejemplo MDM-00001; se genera con una secuencia.

El slug es el nombre que aparece en la dirección de una ficha. Una nueva madera obtiene un slug con nombre y número; sincronizar cambios de nombre no cambia el slug existente. Mantén el xilo_id: renumerar la hoja puede actualizar una especie distinta de la que pretendías modificar.

## 2 Dónde cambiar cada cosa

| Quiero cambiar | Lugar principal | Verificación |
| --- | --- | --- |
| Nombre, científico, densidad, Janka, origen o PVP | MDM y menú Sincronizar con Supabase | Ficha y tienda |
| Mostrar u ocultar una especie | MDM, columna K Publicada | Catálogo |
| Continentes de una especie | Supabase, maderas.continentes | Filtro por continente |
| Fotografía de una madera | Storage y /admin/catalogo | Catálogo y ficha de tienda |
| Añadir stock de madera | /admin, Añadir piezas | Disponibles y botón Comprar ahora |
| Crear caja o cambiar su precio | /admin, Otros productos | Serie que use esa caja |
| Crear o modificar una serie | /admin/series | Ficha de serie y disponibilidad |
| Registrar una venta a un usuario en un mercado | /admin/usuarios, ficha del usuario | Pedido, stock y colección |
| Preparar o enviar un pedido | /admin/pedidos o /admin/produccion | Estado siguiente |
| Aviso temporal en la web | /admin/banner | Web pública en sus fechas |
| Texto de portada o El proyecto | GitHub, app/page.js o app/about/page.js | Preview y web publicada |
| Colores, tamaño o disposición | GitHub, CSS correspondiente | Escritorio y móvil |
| Envío mínimo, tarifas o descuentos | lib/venta.js y función SQL calcular_condiciones_venta | Casos del capítulo 7 |
| Texto de condiciones de compra | app/condiciones-compra/page.js y lib/legal.js | Aceptación antes del pago |
| Clave de Supabase, Stripe o Brevo | Variables del proyecto en Vercel | Redeploy y operación afectada |
| Confirmación de compra por correo | lib/brevo.js y Brevo | Registro del correo |
| Confirmación de cuenta o recuperación de contraseña | Supabase Auth y archivos de cuenta | Enlace recibido |
| Dominio de la web | Vercel Domains y DNS del proveedor | Web, login y pagos |

Los cambios de datos se ven al volver a cargar las páginas que los consultan; normalmente no requieren redeploy. Los cambios de código y de variables requieren una nueva publicación. Si una ficha conserva datos antiguos, comprueba también la caché y si esa ruta se está generando en el servidor.

## 3 Fichas y precios en Google Sheets

### 3.1 Estructura de MDM

La fila 1 contiene las cabeceras; las filas de datos empiezan en la 2. La macro lee A:Q por posición. Cambiar el título de una cabecera no cambia esa posición. Insertar una columna dentro de A:Q desplaza los datos y obliga a corregir la macro.

| Columna | Contenido | Destino o uso |
| --- | --- | --- |
| A | Número de madera | maderas.xilo_id |
| B | Nombre | maderas.nombre |
| C | Eng | maderas.nombre_ingles |
| D | Otros | maderas.otros_nombres |
| E | Nombre Científico | maderas.nombre_cientifico |
| F | Familia | maderas.familia |
| G | Densidad seco 15% | maderas.densidad_seco_15, entero |
| H | Janka lbf | maderas.janka_lbf, entero |
| I | Dureza | maderas.dureza |
| J | Origen | maderas.origen |
| K | Publicada | Booleano, Sí o No |
| L | CITES | maderas.cites |
| M | UE | maderas.ue |
| N | CITES desde | maderas.cites_desde |
| O | precio_m3 | No se envía por esta macro |
| P | Impacto | No se envía por esta macro |
| Q | PVP | Se envía como pvp; se guarda en maderas.precio |

O y P pueden alimentar cálculos de la hoja. La web recibe el resultado numérico de Q, no el precio por metro cúbico. Si Q tiene una fórmula, cambia sus entradas o su fórmula: escribir encima elimina el cálculo de esa celda. Añadir columnas después de Q no altera el rango que se sincroniza.

### 3.2 Cambiar una ficha o un precio

1. Abre MDM y localiza la madera por su número de A.
2. Cambia los campos necesarios. En Q utiliza una celda numérica, con dos decimales si hacen falta; el formato moneda es correcto.
3. Comprueba K: Sí para publicada y No para oculta. No la dejes vacía en una fila con número.
4. Abre Maderas del mundo → Sincronizar con Supabase.
5. Espera el aviso de sincronización terminada. Si aparece un error, sigue el capítulo 14.
6. En Supabase, Table Editor → maderas, filtra xilo_id y comprueba precio y el campo modificado.
7. Recarga la ficha y la tienda. Un precio ya guardado en una línea de un pedido conserva el valor de esa compra.

La sincronización envía todas las filas con número, no solamente la que acabas de editar. Una celda vacía en un campo sincronizado puede borrar el dato de Supabase. Una fila ausente no borra automáticamente una especie: para ocultarla, utiliza Publicada = No.

### 3.3 Incorporar una madera nueva

1. Añade una fila al final de MDM con un xilo_id nuevo y único, sin cambiar los anteriores.
2. Completa nombre, científico, propiedades, origen, Publicada y PVP.
3. Sincroniza. La función actual inserta la especie si no existe y actualiza la que ya existe.
4. Comprueba en Supabase que hay una sola fila con ese xilo_id y que tiene slug.
5. Rellena continentes en Supabase si quieres que aparezca en los filtros. La sincronización actual no calcula ese campo.
6. Sube la foto y guarda su URL como explica el capítulo 5.
7. Añade piezas físicas desde /admin. Crear una ficha no crea stock.
8. Comprueba catálogo, filtro, ficha de tienda y disponibilidad.

Una nueva especie puede aparecer en Todas y no aparecer en Europa o América si continentes está vacío. En la revisión de esta versión, los números 85 y 86 tienen ese campo vacío; editar únicamente Origen no lo rellena.

### 3.4 Publicar y ocultar

La macro acepta Sí, Si, true o 1 como publicado; No, false o 0 como oculto, sin distinguir mayúsculas. Utiliza Sí y No para mantener la hoja clara. Un valor distinto provoca un error y la operación SQL no confirma el lote.

Ocultar una madera conserva su registro y las relaciones históricas. No borres especies con pedidos o colecciones. La URL de una ficha oculta puede dejar de funcionar para un visitante por las reglas de acceso.

## 4 Macros de Google y actualización CITES

### 4.1 Abrir y guardar el código

1. Desde la propia hoja, abre Extensiones → Apps Script.
2. Localiza el archivo que contiene onOpen, sincronizarSupabase y actualizarCitesBloque.
3. Antes de editar, copia todo su contenido a un archivo local con fecha.
4. Haz el cambio, guarda y ejecuta la función correspondiente desde el selector superior si necesitas probarla.
5. Si Google pide autorización, comprueba que es el script de esta hoja y autoriza las operaciones necesarias.
6. Vuelve a la hoja y recárgala para regenerar el menú de onOpen.

Guardar la macro no la ejecuta. La macro vinculada a la hoja no necesita publicarse como aplicación web para funcionar desde el menú. No sustituyas todo el script para corregir una función: podrías perder las funciones CITES o el menú.

### 4.2 Propiedades del script

En Apps Script, abre Configuración del proyecto, con el icono de engranaje, y busca Propiedades del script. Conserva estos nombres exactamente:

| Propiedad | Qué debe contener |
| --- | --- |
| SUPABASE_URL | https://zdmhhxjghmbdccsbbmob.supabase.co |
| SUPABASE_KEY | Clave utilizada para llamar a la API de este proyecto |
| SUPABASE_SYNC_TOKEN | Token que valida la función de sincronización |
| SPECIESPLUS_TOKEN | Token de acceso a Species+ |

Estas propiedades son distintas de las variables de Vercel. Cambiar una no actualiza la otra. La clave de conexión y el token de sincronización también son distintos. El token se comprueba actualmente en sync_madera_desde_mdm; para rotarlo, modifica su validación en Supabase y la propiedad de Apps Script de forma coordinada, sin publicarlo en GitHub.

### 4.3 Cómo se sincroniza

sincronizarSupabase lee getRange(2, 1, ultimaFila - 1, 17). Crea objetos JSON con los campos de MDM y pvp, y hace un POST a /rest/v1/rpc/sync_maderas_desde_mdm. Envía p_token y p_maderas, y autentica la llamada con SUPABASE_KEY en apikey y Authorization.

La función SQL por lote llama a sync_madera_desde_mdm para crear o actualizar cada especie, y guarda Publicada, CITES, UE, fecha y PVP. El slug de una especie existente se conserva. La macro no cambia stock, imágenes, continentes ni colecciones. El servidor devuelve el número de maderas procesadas.

### 4.4 Conservar los céntimos del PVP

El helper numeroONull del script compartido redondea a entero con Math.round. Es adecuado para número Xilo, densidad y Janka, pero no para precios. La asignación de Q debe usar un helper separado:

```javascript
// Dentro del objeto que construye cada madera:
pvp: precioONull(fila[16])

// Añadir como función independiente, fuera de sincronizarSupabase:
function precioONull(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const limpio = typeof valor === 'number'
    ? valor
    : String(valor).trim().replace(/€/g, '').replace(/\s/g, '').replace(',', '.');
  const numero = Number(limpio);
  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error('PVP no válido: ' + valor);
  }
  return Math.round((numero + Number.EPSILON) * 100) / 100;
}
```

Utiliza números o textos sencillos como 5,50; este helper no interpreta separadores de miles combinados con decimales. getValues devuelve números cuando la celda está bien configurada. Comprueba un precio como 5,50: debe llegar a Supabase como 5.50, sin convertirse en 6. Conserva numeroONull sin cambios para los campos enteros. Este fragmento es la corrección de referencia que debe conservarse en el editor de la hoja.

### 4.5 CITES y Species+

El menú ofrece Actualizar CITES completo y cinco bloques de 20 filas. El código compartido de Completo llama a los bloques que empiezan en 0, 20, 40, 60 y 80: cubre hasta 100 filas de datos. Para más especies hay que ampliar ese recorrido y el menú, o recorrer los bloques en un bucle.

Cada consulta usa el nombre científico de E y la API https://api.speciesplus.net/api/v1/taxon_concepts, con taxonomy=CITES y with_eu_listings=true. Se prefiere un nombre aceptado activo; los sinónimos pueden llevar al nombre aceptado. El helper toma la primera especie antes de una coma y, en algunos casos, el nombre específico entre paréntesis.

El resultado se escribe en L, M y N. Después hay que ejecutar Sincronizar con Supabase para enviarlo a la web. Revisa las filas que muestren ERROR y los nombres sin resultado: una celda vacía no demuestra por sí sola que la especie esté libre de restricciones. La macro es una ayuda informativa y no guarda documentación de procedencia ni certificados de cada pieza.

### 4.6 Consultar un fallo de macro

En Apps Script abre Ejecuciones, localiza la ejecución reciente y consulta sus registros. La sincronización registra HTTP, tiempo y respuesta de Supabase. Si el error menciona un número Xilo, vuelve a esa fila. Si hay HTTP 401/403, comprueba las propiedades y los permisos. No copies claves a los registros para depurar.

## 5 Fotografías y diseño de las fichas

### 5.1 Organización actual

Al preparar esta versión hay 86 maderas, todas publicadas y con imagen_url. Las fotografías están en el bucket público maderas-fotos de Supabase Storage. Se llaman 1.jpg, 2.jpg, …, 86.jpg; el nombre corresponde a xilo_id, no al código MDM de una pieza física.

Una dirección de ejemplo es https://zdmhhxjghmbdccsbbmob.supabase.co/storage/v1/object/public/maderas-fotos/1.jpg. Ser un bucket público permite mostrar las fotos a visitantes; no lo utilices para guardar documentos privados ni datos de clientes.

Las imágenes se muestran verticales sin rotación ni recorte. app/wood-portraits.css aplica proporción 2:3 y object-fit: contain al catálogo y a la tienda. Las fichas individuales limitan el ancho. La hoja de estilos se importa al final de los CSS globales en app/layout.js, de modo que puede sobrescribir reglas anteriores.

### 5.2 Subir fotos en lote

1. Prepara JPG verticales, con el número de cada especie como nombre. Conserva los originales fuera de Supabase.
2. Abre Supabase → Storage → maderas-fotos.
3. Selecciona Upload files y carga varios archivos; si la interfaz no admite soltar una carpeta, selecciona sus archivos.
4. Comprueba que quedan en la raíz del bucket y con el nombre previsto. Una carpeta adicional cambia la URL.
5. Si son fotos de especies que ya tenían esas URL, abre varias fichas para verificar la sustitución.
6. Si son nuevas especies o nuevas rutas, guarda cada URL en /admin/catalogo.

Subir archivos no crea fichas ni vincula automáticamente una nueva foto a una madera. La vinculación es maderas.imagen_url. Si el panel no permite reemplazar un archivo existente, sube un nombre nuevo, por ejemplo 1-v2.jpg, y cambia la URL; evita borrar primero la foto que aún usa la web.

### 5.3 Cambiar una foto y su atribución

1. Entra con un usuario administrador y abre /admin/catalogo.
2. Busca por número o nombre y pulsa Editar en la madera.
3. Pega la URL pública de la imagen.
4. Para una fotografía propia, indica fuente Fotografía propia de Maderas del Mundo y autor Maderas del Mundo; deja vacíos los campos Commons y licencia si no corresponden.
5. Marca imagen verificada cuando hayas comprobado especie, foto y derecho de uso.
6. Guarda y abre catálogo, ficha de catálogo y ficha de tienda.

La portada rotatoria, components/HomeWoodRotator.js, selecciona fotos de maderas publicadas y verificadas. Una foto sin verificar puede verse en su ficha y no entrar en esa rotación. El cambio entre fotos ocurre cada 7000 milisegundos; su aspecto se controla en HomeWoodRotator.module.css.

Si se sigue mostrando la foto anterior, prueba una recarga completa y una ventana privada. Cambiar a un nombre de archivo nuevo evita reutilizar una URL almacenada en caché. No soluciones ese problema cambiando de especie o renumerando MDM.

### 5.4 Imágenes de El proyecto

El texto de El proyecto está en app/about/page.js. La imagen de los cortes está en public/images/about-cortes-secciones.webp; las de densidad y Janka en about-densidad.jpg y about-janka.jpg. Las rutas de public se usan desde la raíz: /images/…, sin añadir public a la URL.

La página explica el formato aproximado 10 × 5 × 1,2 cm y la sección radial habitual a favor de la veta. Algunos ejemplos y cifras están escritos en el código, no consultados desde MDM: cambiar una especie en la hoja no cambia automáticamente esos ejemplos. Los archivos SVG antiguos de cortes y propiedades siguen en public, pero la página utiliza las rutas que aparecen en sus etiquetas img.

## 6 Inventario series cajas y administración diaria

### 6.1 Entrar en administración

Inicia sesión en /login y abre /admin. La cuenta debe existir en Supabase Auth y su user_id debe figurar en public.administradores. Las páginas comprueban es_admin; si no tienes permiso vuelves a la web pública.

El menú de administración incluye Inventario, Catálogo, Series, Producción, Pedidos, Usuarios y Banner. components/AdminMenuEnhancer.js completa y corrige algunos enlaces. Si falta una opción, prueba su dirección directa antes de asumir que los datos se han borrado.

### 6.2 Añadir piezas de madera

1. Abre Inventario → Piezas de madera → Añadir piezas.
2. Selecciona la especie por número y nombre.
3. Introduce la cantidad física que has fabricado y que puede venderse.
4. Pulsa Añadir una sola vez y espera.
5. Comprueba el aumento de Total y Disponibles.

Cada unidad crea una fila en piezas. El trigger generar_codigo_pieza asigna el código con piezas_codigo_seq. El stock de una especie se calcula contando piezas con estado disponible: no hay una casilla de stock de maderas que deba editarse en MDM.

| Estado de pieza | Significado |
| --- | --- |
| disponible | Puede asignarse a una compra |
| reservada | Asignada temporalmente a un pedido |
| vendida | Compra confirmada o venta registrada |
| retirada | Apartada de la venta |

No conviertas manualmente una pieza reservada en disponible sin resolver antes su pedido: otro comprador podría adquirirla mientras el primero paga. Para retirar una pieza defectuosa sin pedido, localiza su código en Table Editor → piezas y cambia disponible a retirada. Comprueba que no pertenece a una reserva activa.

### 6.3 La diferencia entre Vender 1 y venta presencial

Vender 1 en Inventario toma una pieza disponible y la marca vendida. Esa acción reduce el stock, pero no crea por sí misma un pedido ni añade la madera a la colección de un usuario.

Para registrar una venta con cliente utiliza Usuarios → ficha del usuario → Venta presencial:

1. Selecciona la madera disponible y revisa el precio cobrado.
2. Pulsa Añadir para cada pieza. Puedes añadir varias de la misma especie.
3. Revisa la lista y el total; quita las líneas equivocadas antes de confirmar.
4. Pulsa Registrar venta completa.
5. Comprueba el pedido entregado, la reducción del stock y la colección del cliente.

La función admin_registrar_venta_presencial_multiple registra el importe introducido, asigna piezas y crea el pedido con entrega presencial. No aplica automáticamente los descuentos de compra online: introduce el precio realmente cobrado, con cualquier descuento presencial ya incluido. No registres una venta de prueba en un cliente real si luego vas a borrarla.

### 6.4 Cajas y otros productos

En Inventario → Otros productos puedes crear un producto con nombre, tipo, capacidad si es caja, precio y stock inicial. Usa Editar para sus datos; los controles de stock modifican inventario_productos.stock. Disponible se calcula como stock menos reservado.

La capacidad expresa cuántas piezas admite una caja. La reserva de una caja se refleja en reservado y se descuenta del stock cuando se confirma el pago. No reduzcas stock por debajo de lo que ya está reservado. Comprueba la cantidad real antes de guardar una corrección.

Los productos de tipo otro pueden gestionarse en inventario, pero la tienda actual presenta principalmente piezas de madera, series y cajas vinculadas a series. Crear un producto de tipo otro no garantiza que tenga un flujo de compra público.

### 6.5 Crear o modificar una serie

1. Abre /admin/series → Nueva serie.
2. Escribe nombre, descripción y precio base de la serie.
3. Selecciona las maderas. La interfaz actual incorpora una pieza de cada especie seleccionada.
4. Elige Sin caja, Caja opcional o Caja obligatoria.
5. Si corresponde, selecciona las cajas permitidas, con precio, capacidad y stock adecuados.
6. Guarda y abre la serie en la tienda.

El precio base de una serie se guarda en productos.precio: no se recalcula automáticamente al cambiar los PVP individuales de MDM. La composición está en producto_maderas y las cajas permitidas en serie_cajas.

La disponibilidad se calcula con el componente que tenga menos unidades suficientes. Si una serie incluye una pieza de cinco especies y una de ellas tiene cero, la serie queda agotada. Con caja obligatoria también se limita por las cajas disponibles. Las series consumen las mismas piezas que la venta individual: no debes duplicar su stock.

Al editar una serie, guarda una copia de su composición: la interfaz actual actualiza el producto y sustituye las relaciones mediante varias operaciones. Si aparece un error durante el guardado, revisa composición y cajas antes de volver a venderla.

### 6.6 Banners y producción

En /admin/banner crea un texto de hasta 500 caracteres, con fecha de inicio y de fin. Guarda y comprueba la web durante su periodo de publicación. Puedes programar varios; si se solapan, la interfaz indica que se muestra el último creado. El banner admite texto, no botones ni enlaces configurables.

/admin/produccion muestra pedidos pagados o preparando y maderas publicadas con precio cuyo stock es bajo. El selector del límite sirve para consultar reposición; no configura por sí mismo una alerta de correo. Confirma envío o recogida en el detalle del pedido: algunos rótulos de Producción simplifican la modalidad y pueden mostrar Envío para una recogida.

## 7 Compra envío descuentos y cobro

### 7.1 Reglas de esta versión

| Número de piezas físicas | Descuento sobre piezas y series | Envío a península española |
| --- | --- | --- |
| 1 a 4 | 0% | No disponible; recogida permitida |
| 5 a 9 | 0% | 5 € |
| 10 | 10% | 5 € |
| 11 a 19 | 10% | 8 € |
| 20 a 30 | 20% | 8 € |
| Más de 30 | 20% | Consultar por correo; pago con envío bloqueado |

Las cajas y el envío no reciben el descuento. Las piezas que hay dentro de una serie cuentan para el tramo: dos series de diez piezas suman veinte. Se aplica un solo porcentaje a toda la base de piezas y series, sin acumular 10% y 20%. La recogida no tiene mínimo ni gastos de envío.

Fuera de la península española, el checkout con envío muestra un error y pide consultar en contacto@maderasdelmundo.es. La validación comprueba país España y código postal de cinco cifras con prefijo 01 a 50, excluyendo 07, 35 y 38; Ceuta y Melilla también quedan fuera. Es una validación de país y formato provincial, no una comprobación de existencia de cada dirección postal.

### 7.2 Ejemplos del total

| Compra de ejemplo | Base de piezas | Descuento | Caja | Envío | Total |
| --- | --- | --- | --- | --- | --- |
| 5 piezas a 5 € | 25 € | 0 € | 0 € | 5 € | 30 € |
| 10 piezas a 5 € | 50 € | 5 € | 0 € | 5 € | 50 € |
| 20 piezas a 5 € y caja de 12 € | 100 € | 20 € | 12 € | 8 € | 100 € |
| 20 piezas a 5 € con recogida | 100 € | 20 € | 0 € | 0 € | 80 € |

subtotal suma las líneas de artículos, incluida la caja cuando forma parte de la línea. descuento se calcula sobre la parte de piezas y series. total = subtotal − descuento + gastos_envio. Las líneas guardan su precio de compra para conservar el historial.

### 7.3 Recorrido de una compra

1. El visitante abre la tienda o pulsa Comprar ahora en una ficha del catálogo con stock.
2. Añade una madera o una serie al carrito; si corresponde elige caja.
3. Continúa como usuario o invitado. Un carrito guardado en el navegador no reserva stock todavía.
4. El servidor crea el pedido y asigna las piezas disponibles. La reserva inicial dura 30 minutos; la preparación de la sesión Stripe gestiona su caducidad posterior.
5. El cliente completa entrega y contacto. Las condiciones se comprueban también en el servidor.
6. Acepta las condiciones de compra y ve el desglose antes del pago.
7. Stripe recoge el pago. El servidor comprueba sesión, moneda e importe y confirma la compra en Supabase.
8. Las piezas pasan a vendidas, las cajas se descuentan y se envía la confirmación por Brevo si está configurado.

El carrito y el pedido activo se guardan en el navegador con las claves mdm-carrito y mdm-pedido-activo. No se comparten automáticamente entre dispositivos. No envíes a otras personas un enlace de invitado que contenga su token: permite acceder a ese pedido.

### 7.4 Compras de invitados y colecciones

Una compra de invitado tiene un token aleatorio; la base conserva su hash y no necesita mantener una cuenta ficticia permanente para el comprador. Si más adelante se registra y confirma el mismo correo, vincular_pedidos_invitado asocia los pedidos finalizados y sus especies a su cuenta.

La colección guarda especies distintas por usuario, no cada pieza repetida. Comprar dos piezas de la misma especie no crea dos fichas iguales en Mi colección. El botón de validar códigos o QR sigue deshabilitado como Próximamente: no hay activación pública por QR en esta versión. Para ventas presenciales utiliza el procedimiento administrativo del capítulo 6.

### 7.5 Cambiar las reglas de venta

Un cambio de envío o descuento requiere modificar y publicar un conjunto coherente:

1. Anota las nuevas reglas y conserva una copia de las actuales.
2. Cambia porcentajeDescuento, costeEnvio y errorEnvio en lib/venta.js según corresponda.
3. En Supabase → Database → Functions, localiza calcular_condiciones_venta y guarda su definición. Modifica la función con CREATE OR REPLACE FUNCTION; conserva firma, trigger, permisos y comprobaciones existentes.
4. Cambia la versión de venta tanto en lib/venta.js como en el texto new.venta_version de la función SQL.
5. Cambia components/CondicionesVenta.js y app/condiciones-compra/page.js para mostrar las reglas nuevas.
6. Actualiza CONDICIONES_COMPRA_VERSION en lib/legal.js cuando cambien las condiciones que se aceptan.
7. Revisa el capítulo 7 de este manual y sus ejemplos.
8. Prueba una preview con datos de prueba y publica en un periodo sin compras activas, coordinando el cambio SQL y el de código.
9. Revisa reservas anteriores y sesiones pendientes; no modifiques totales de pedidos ya pagados.

La base calcula importes en calcular_condiciones_venta, un trigger BEFORE UPDATE de pedidos cuando están reservados o pendientes de pago. fijar_precio_caja_pedido guarda el precio de caja al insertar una línea. Stripe usa esos importes; cambiar solo el texto del aviso no cambia el cobro.

docs/condiciones-venta.sql conserva la migración inicial. Ya se aplicó: no ejecutes el archivo completo otra vez, pues vuelve a añadir columnas y triggers. Para cambiar una tarifa, extrae y modifica la definición de la función necesaria, y guarda el SQL nuevo como una revisión documentada.

### 7.6 Casos que deben pasar después de un cambio

Comprueba recogida de una pieza; bloqueo de envío con cuatro; envío de cinco; límite de diez; once; veinte; treinta; bloqueo de treinta y una; códigos de Baleares, Canarias, Ceuta y Melilla; país extranjero; mezcla de piezas y series; caja sin descuento; cancelación y caducidad; importe que llega a Stripe. Un código postal válido no sustituye revisar la dirección física.

## 8 Pedidos usuarios y correos

### 8.1 Estados y preparación

| Estado del pedido | Qué ocurre |
| --- | --- |
| reservado | Se han asignado piezas para continuar la compra |
| pendiente_pago | Datos de entrega guardados; puede iniciarse el pago |
| pagado | Pago confirmado por el servidor |
| preparando | En preparación por administración |
| enviado | Marcado como enviado o en la etapa equivalente de entrega |
| entregado | Finalizado |
| cancelado | Compra cancelada y reserva liberada |
| caducado | Reserva vencida y liberada |

En /admin/pedidos filtra y abre el pedido. Revisa cliente, contacto, entrega, líneas, códigos de piezas e importes. Las transiciones administrativas permitidas son pagado → preparando → enviado → entregado. El selector solo permite el siguiente estado; no está previsto saltar etapas o retroceder desde el panel.

Antes de preparar, confirma que está pagado. No conviertas un pendiente_pago en pagado editando una celda: te saltarías el cobro, las cajas y la colección. La reserva se libera con cancelar_pedido o caducar_reservas_vencidas, no borrando el pedido.

### 8.2 Pago cobrado y pedido que no aparece pagado

1. Busca el pago en Stripe y abre su sesión Checkout.
2. Localiza metadata.pedido_id y compara con Supabase → pedidos.
3. Comprueba moneda EUR, importe y stripe_checkout_session_id.
4. En Stripe, revisa el evento y su entrega al webhook; en Vercel, consulta el error de esa petición.
5. Corrige el problema de claves, firma o datos, y vuelve a enviar el evento desde Stripe cuando corresponda.
6. Comprueba pedido pagado, piezas vendidas y correo enviado antes de cerrar la incidencia.

El webhook es /api/stripe/webhook. La página de resultado del pago también comprueba con Stripe lo ocurrido. Si el pedido ha caducado o la sesión no coincide, investiga la asignación de sus piezas antes de cualquier corrección manual: puede haber otra compra utilizando ese stock.

### 8.3 Reembolsos

El panel de la web no implementa un circuito completo de devolución y reposición de stock. Un reembolso se realiza y verifica en Stripe; no cambia automáticamente la colección o las piezas del proyecto mediante un evento de reembolso, porque el webhook actual atiende eventos de Checkout.

Documenta el reembolso y decide, cuando recibas y revises la pieza devuelta, si vuelve a estar disponible. No repongas una pieza que siga físicamente con el cliente. Conserva el pedido histórico; cualquier ajuste de estado o colección requiere una revisión concreta de sus relaciones y no borrar todas sus líneas.

### 8.4 Administración de usuarios

/admin/usuarios permite consultar usuarios y sus fichas, crear una cuenta, asignar o retirar rol de administrador, forzar cambio de contraseña y borrar cuentas. Las operaciones sensibles pasan por /api/admin/usuarios, que comprueba el usuario y su presencia en administradores.

Para crear una cuenta desde administración, introduce correo y contraseña inicial de al menos ocho caracteres. Esa creación administrativa confirma el correo directamente. Entrega el acceso por un medio privado y pide cambiar la contraseña.

Forzar contraseña invalida la anterior mediante una contraseña temporal aleatoria y solicita un correo de recuperación. Si falla el envío, la contraseña anterior puede haber quedado invalidada; revisa el mensaje de la operación y Supabase Auth antes de repetirla.

Borrar una cuenta conserva los pedidos y puede dejar user_id sin vinculación. El historial de una compra y su dirección de entrega no desaparecen necesariamente al borrar la cuenta. El sistema impide borrar tu propia cuenta o quitarte tu propio rol de administrador desde ese panel. Conserva al menos otro acceso administrativo recuperable.

### 8.5 Confirmaciones y Brevo

La confirmación de compra se genera en lib/brevo.js. Incluye número corto del pedido, líneas, descuento, envío, total y entrega. Se envía al correo de entrega o al correo de la cuenta, con copia oculta a contacto@maderasdelmundo.es cuando corresponde. El remitente y el nombre se pueden configurar con variables.

pedidos registra email_confirmacion_reservada_at, email_confirmacion_enviada_at y brevo_confirmacion_message_id. La reserva evita duplicar envíos. En la ficha de un pedido finalizado, el botón de confirmación solicita el envío; si ya consta enviado, el mecanismo evita repetirlo. No borres su fecha para forzar reenvíos sin revisar antes el registro de Brevo.

El aviso de nuevo usuario confirmado lo genera app/api/auth/nuevo-usuario/route.js. Un trigger de Supabase Auth llama a esa ruta y la aplicación guarda la marca de notificación en app_metadata. Esa ruta limita la antigüedad de la confirmación. Los textos de confirmación de cuenta y recuperación de contraseña se gestionan en Supabase Auth; no son la misma plantilla que la confirmación de compra.

En Brevo consulta correo transaccional → registros, busca destinatario y fecha y revisa entrega, rechazo o bloqueo. Para una API key, abre Settings → SMTP & API → API Keys & MCP. BREVO_API_KEY necesita una clave de API; una clave SMTP tiene otra función. Si Supabase Auth usa SMTP propio, sus credenciales se configuran aparte en Supabase.

## 9 Cambiar la web desde GitHub

### 9.1 Qué hay en el repositorio

El proyecto usa Next.js App Router. app contiene páginas y rutas del servidor; components contiene elementos reutilizables; lib contiene reglas y conexión; public contiene archivos públicos; docs y tests contienen documentación y comprobaciones. El catálogo real se consulta en Supabase.

Los README originales describían una maqueta sin base de datos y ya no representaban la aplicación. Este manual y el README actualizado son la referencia. lib/maderas.js conserva datos piloto y un helper de continentes; editar sus doce especies no modifica el catálogo real de Supabase.

### 9.2 Cambiar un texto con el navegador

1. Abre GitHub → repositorio → Code, y comprueba que partes de main.
2. Crea una rama con un nombre descriptivo, por ejemplo cambio/texto-about.
3. Abre app/about/page.js y pulsa el lápiz de edición.
4. Cambia únicamente el texto necesario. Conserva etiquetas, comillas, llaves e imports.
5. Guarda con Commit changes en tu rama, explicando el cambio.
6. Abre un Pull Request hacia main. Vercel construirá una preview.
7. Comprueba la preview, el resultado de compilación y el aspecto en móvil.
8. Integra el PR y revisa el despliegue de producción del commit nuevo.

No pegues HTML completo dentro de una página sin respetar JSX. En JSX se usa className y las etiquetas deben cerrar; una llave abre una expresión JavaScript. Si solo modificas una frase entre etiquetas, el cambio suele ser sencillo de revisar.

### 9.3 Mapa de archivos

| Cambio | Archivo |
| --- | --- |
| Portada y llamadas principales | app/page.js |
| Foto cambiante de portada | components/HomeWoodRotator.js y su CSS |
| Menú, marca, pie y metadatos generales | app/layout.js |
| Menú móvil | components/MobileMenu.js y app/mobile-menu.css |
| El proyecto y ejemplos de propiedades | app/about/page.js |
| Catálogo y filtros | app/catalogo/page.js |
| Tarjeta del catálogo | components/WoodTile.js |
| Ficha del catálogo y Comprar ahora | app/catalogo/[slug]/page.js |
| Tienda y agrupaciones | app/tienda/page.js |
| Ficha de madera en tienda | app/tienda/madera/[slug]/page.js |
| Ficha y cajas de serie | app/tienda/serie/[id]/page.js |
| Carrito y resumen horizontal | app/carrito/page.js |
| Contenido del aviso de venta | components/CondicionesVenta.js |
| Datos de entrega | app/checkout/[id]/page.js |
| Confirmación previa al pago | app/checkout/[id]/pago/page.js |
| Login y perfil | app/login/page.js |
| Registro y recuperación | app/crear-cuenta/page.js y app/cambiar-password/page.js |
| Colección personal | app/coleccion/page.js |
| Condiciones y versión aceptada | app/condiciones-compra/page.js y lib/legal.js |
| Aviso legal y privacidad | app/aviso-legal/page.js y app/privacidad/page.js |
| Reglas y formato de importes | lib/venta.js y components/ResumenImportes.js |
| Carrito local | lib/carrito.js |
| Conexión pública Supabase | lib/supabase.js |
| Confirmación por correo | lib/brevo.js |
| Inventario y productos | app/admin/page.js |
| Imágenes de catálogo | app/admin/catalogo/page.js |
| Series | app/admin/series/page.js |
| Pedidos y producción | app/admin/pedidos, app/admin/produccion |
| Usuarios y permisos | app/admin/usuarios y app/api/admin/usuarios/route.js |
| Banners públicos | components/PublicBanner.js y app/admin/banner/page.js |
| Estilos generales | app/globals.css |
| Ajustes visuales añadidos | app/polish.css, app/banner.css y app/admin-mobile.css |
| Proporciones de las fotos | app/wood-portraits.css |

En el carrito, CondicionesVenta está fuera de la cuadrícula cart-summary: por eso ocupa todo el ancho. Si lo vuelves a colocar dentro, puede convertirse en una columna estrecha. Un aviso compartido se modifica una sola vez en su componente; comprueba las páginas que lo reutilizan.

### 9.4 Estilos y búsqueda de un texto

En GitHub o en el editor busca una frase exacta de la pantalla. Si aparece en varios archivos, revisa si es un dato de contacto repetido o un componente común. Para estilo, localiza su className y después esa clase en los CSS importados.

Una regla de CSS posterior puede sobrescribir otra anterior. Antes de añadir reglas nuevas al final de globals.css, revisa polish.css y wood-portraits.css. Los archivos *.module.css solo afectan a los componentes que importan su objeto styles. Prueba ancho de móvil y escritorio tras cambiar columnas, alturas o márgenes.

### 9.5 Trabajar en el Mac con Terminal

Instala una versión de Node.js compatible con Next.js 15 y Git, y comprueba node --version y npm --version. Si usas GitHub Desktop, puedes clonar y gestionar ramas desde su interfaz; también puedes hacerlo con estos comandos:

```bash
git clone https://github.com/luisinko-lasko/maderas-del-mundo.git
cd maderas-del-mundo
git switch -c cambio/mi-cambio
npm ci
npm run dev
```

Abre http://localhost:3000. Configura previamente .env.local como indica el capítulo 10. Para detener el servidor, Control + C. npm ci instala exactamente el lock; no elimina la base de datos. Si usas las credenciales de producción, el servidor local sí puede modificar datos reales al realizar compras o acciones de administración.

Tras editar:

```bash
git diff
node --test tests/venta.test.mjs
npm run build
git add app/about/page.js docs/manual-maderas-del-mundo.md
git commit -m "Actualizar texto del proyecto y manual"
git push -u origin cambio/mi-cambio
```

Sustituye los nombres de archivo y rama por los tuyos. Hay que publicar todos los archivos que formen parte del cambio. El proyecto no tiene scripts independientes de npm test o npm run lint; la comprobación disponible de reglas de venta se ejecuta con node --test.

### 9.6 Dependencias y seguridad

En esta versión package.json fija Next.js 15.5.26 y React y React DOM 19.1.8. Declara @supabase/supabase-js ^2.116.0 y stripe ^22.6.1; package-lock.json determina las versiones instaladas. Hay un override de PostCSS 8.5.23.

Las actualizaciones de dependencias se hacen en una rama y se prueban con npm ci, npm ls, npm audit y npm run build. Si cambias dependencias con npm install, guarda tanto package.json como package-lock.json. No ejecutes npm audit fix --force sin revisar qué versión mayor y qué comportamiento cambia. Un PR automático antiguo puede proponer versiones inferiores a las que ya hay en main.

La actualización de seguridad del 6 de octubre está descrita en docs/security-update-2026-10-06.md. Su revisión compiló con claves ficticias: eso confirma la compatibilidad del código, no un cobro ni un envío de correo real. No conviertas aquel resultado en una garantía permanente de ausencia de vulnerabilidades.

## 10 Vercel variables y publicación

### 10.1 Encontrar las variables

1. Entra en Vercel y selecciona el equipo maderas-del-mundo.
2. Abre el proyecto maderas-del-mundo; no te quedes en la página general del equipo ni en un despliegue aislado.
3. Abre Settings → Environment Variables, o usa el buscador del panel para encontrar Environment Variables.
4. Localiza el nombre exacto, abre su menú de acciones y edita el valor si tus permisos lo permiten.
5. Elige el entorno que debe recibirlo y guarda.
6. Abre Deployments y ejecuta Redeploy sobre el código correcto.

Si un control está gris, comprueba equipo, proyecto, rol y si la variable procede de una integración. No cambies el nombre para intentar desbloquearlo: el código no encontrará el nombre nuevo. Una variable guardada no se aplica a un despliegue que ya estaba construido.

### 10.2 Variables utilizadas por este código

| Variable | Finalidad | Exposición |
| --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | URL del proyecto Supabase | Pública |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Clave pública del cliente | Pública, acceso limitado por RLS |
| SUPABASE_SERVICE_ROLE_KEY | Operaciones privilegiadas del servidor | Secreta |
| STRIPE_SECRET_KEY | Crear y consultar pagos | Secreta |
| STRIPE_WEBHOOK_SECRET | Validar firma del webhook | Secreta, empieza por whsec_ |
| BREVO_API_KEY | Enviar correos por API | Secreta |
| BREVO_SENDER_NAME | Nombre del remitente | Configuración; por defecto Maderas del Mundo |
| BREVO_SENDER_EMAIL | Correo remitente | Configuración; por defecto contacto@maderasdelmundo.es |
| NEXT_PUBLIC_SITE_URL | Origen usado en recuperación administrativa | Pública; por defecto https://maderasdelmundo.es |

Una variable que empieza por NEXT_PUBLIC_ puede incorporarse al navegador. Nunca pongas una clave de servicio, de Stripe o de Brevo en un nombre con ese prefijo. No añadas una variable STRIPE_PUBLIC_KEY para resolver un error de STRIPE_SECRET_KEY: el Checkout alojado actual usa la clave secreta en el servidor.

En Supabase localiza las claves en Settings → API Keys. La aplicación conserva nombres de variables de las claves legacy anon y service_role. No cambies su tipo, el nombre esperado o el mecanismo de autenticación como una simple sustitución visual; cualquier migración a claves nuevas debe probarse con las llamadas de la web y de Apps Script.

Para configurar el trabajo local en el Mac, copia la plantilla incluida en el repositorio con cp .env.example .env.local. Abre .env.local en un editor de texto y rellena cada línea con NOMBRE=valor, obteniendo los valores del entorno de prueba en sus paneles. Sustituye también la URL de ejemplo de Supabase. No añadas espacios alrededor del signo igual ni pegues el nombre dos veces. En Finder, Comando + Mayúsculas + punto muestra los archivos que empiezan por punto. .env.local está excluido de Git; reinicia npm run dev después de cambiarlo. Las variables opcionales de correo pueden quedar sin configurar si no vas a probar el envío.

### 10.3 Production Preview y Development

Production sirve a la web pública; Preview a las ramas y PR; Development al trabajo local. Revisa cada entorno por separado. Una preview que compila sin claves de Brevo puede no enviar correos; una preview con la misma Supabase que producción puede modificar el inventario real.

Para ensayar pagos, utiliza claves Stripe de pruebas y datos de prueba en una base separada. No cambies la clave de Production a pruebas para probar una rama. Algunas páginas crean clientes de Supabase y Stripe al cargar sus módulos, por lo que la compilación puede fallar por una clave ausente aunque no estés realizando una compra.

### 10.4 Revisar un despliegue

En Deployments abre el despliegue nuevo y comprueba rama, commit, entorno y estado. Ready significa que compiló; verifica además que el dominio público usa ese despliegue y que las operaciones necesarias funcionan. Un correo de vercel[bot] en un PR anuncia el resultado de su despliegue, que puede ser una preview y no la producción.

La configuración del proyecto debe usar Next.js y el build npm run build. El código está en la raíz del repositorio. No establezcas public como Output Directory para este proyecto: public solo contiene recursos estáticos.

Si no aparece despliegue tras integrar un PR, revisa la integración Git y la rama de producción. Abre el código actual de main y despliega ese commit desde el panel cuando corresponda. Repetir Redeploy sobre un despliegue antiguo vuelve a publicar su código, no necesariamente el último de main.

### 10.5 Volver a la versión anterior

Ante una regresión, abre un despliegue de producción que funcionaba y utiliza la opción de rollback si está disponible para el proyecto. Después comprueba el dominio y la asignación automática de nuevos despliegues, que puede necesitar reactivación mediante promoción.

También puedes revertir el commit en GitHub con un nuevo commit y publicar. Conserva el historial; no borres ramas o commits para ocultar el cambio. Volver al código anterior no restaura datos borrados ni deshace SQL ya aplicado en Supabase. Si el código anterior no entiende el esquema nuevo, necesitas una estrategia compatible de recuperación.

## 11 Supabase datos permisos y funciones

### 11.1 Table Editor SQL Editor y Functions

Table Editor permite revisar tablas y filtrar registros. SQL Editor permite ejecutar consultas y cambios SQL. Database → Functions muestra las funciones; guarda su definición antes de modificarla. En Logs puedes revisar errores de API, base o autenticación.

Empieza con SELECT antes de un UPDATE o DELETE. Filtra por xilo_id para una especie y por UUID para un pedido. En SQL, null significa ausencia de dato y no equivale a texto vacío ni a cero. Las fechas y horas pueden aparecer en UTC; interpreta su diferencia con Europe/Madrid al comparar registros.

### 11.2 Tablas principales

| Tabla | Contenido |
| --- | --- |
| maderas | Especies, propiedades, PVP, publicación, imagen y continentes |
| piezas | Unidades físicas, códigos, especie y estado |
| productos | Series, cajas y otros productos |
| producto_maderas | Composición y cantidad por especie de una serie |
| serie_cajas | Cajas permitidas para cada serie |
| inventario_productos | Stock y reservado de cajas u otros productos |
| pedidos | Cliente, entrega, estado, importes, Stripe y versiones aceptadas |
| pedido_lineas | Artículos y precios guardados de cada compra |
| pedido_piezas | Relación entre línea y pieza física asignada |
| coleccion_usuario | Especies adquiridas por usuario |
| perfiles | Datos personales y de contacto |
| administradores | user_id autorizados para administración |
| banner_publico | Avisos con fechas |
| auth.users | Cuentas gestionadas por Supabase Auth |
| storage.objects | Metadatos de archivos; las fotos se manejan desde Storage |

maderas.id se relaciona con piezas.madera_id, coleccion_usuario.madera_id y producto_maderas.madera_id. pedidos.id enlaza pedido_lineas.pedido_id; sus líneas enlazan pedido_piezas.pedido_linea_id y piezas.id. No cambies identificadores internos para corregir un nombre.

### 11.3 Funciones que sostienen el funcionamiento

| Función | Uso |
| --- | --- |
| es_admin | Comprueba rol administrativo |
| sync_madera_desde_mdm | Valida token e inserta o actualiza una especie |
| sync_maderas_desde_mdm | Sincroniza el lote con publicación, CITES y PVP |
| crear_pedido_desde_carrito | Valida artículos y asigna reservas |
| guardar_checkout | Guarda datos y modalidad de entrega |
| aceptar_condiciones_compra | Registra fecha y versión aceptadas |
| preparar_checkout_stripe | Prepara sesión y reserva de usuario |
| preparar_checkout_stripe_invitado | Lo equivalente para invitado |
| confirmar_pago_stripe | Confirma compra, piezas, cajas y colección |
| cancelar_pedido y cancelar_pedido_invitado | Liberan reservas correspondientes |
| caducar_reservas_vencidas | Libera reservas vencidas y conserva historial |
| calcular_condiciones_venta | Trigger que calcula y valida importes |
| fijar_precio_caja_pedido | Trigger que fija precio de caja de una línea |
| generar_codigo_pieza | Trigger que asigna MDM y número de secuencia |
| reservar_email_confirmacion | Evita enviar dos confirmaciones simultáneas |
| vincular_pedidos_invitado | Asocia compras al correo confirmado |
| admin_listar_pedidos y admin_detalle_pedido | Consultas administrativas |
| admin_cambiar_estado_pedido | Permite avanzar la preparación |
| admin_listar_usuarios y admin_detalle_usuario | Usuarios, perfil, compras y stock |
| admin_registrar_venta_presencial_multiple | Venta presencial con pedido y colección |
| admin_listar_catalogo y admin_actualizar_catalogo_web | Gestión de imágenes |
| admin_listar_banners, admin_guardar_banner, admin_borrar_banner | Programación de avisos |
| obtener_banner_activo | Aviso visible para el visitante |
| notificar_nuevo_usuario_contacto | Llamada desde Auth a la ruta de notificación |

También existen funciones auxiliares o heredadas como simular_pago_admin y variantes de venta presencial. No son una forma de cobrar dinero y no sustituyen Stripe. Conserva permisos y revisión del cuerpo al modificar una función SECURITY DEFINER: puede trabajar con privilegios del propietario.

### 11.4 Consultas de diagnóstico que no modifican datos

Pega cada consulta por separado en SQL Editor del proyecto correcto:

```sql
-- Una ficha concreta, ejemplo número 1
select xilo_id, nombre, slug, publicada, precio,
       continentes, imagen_url, imagen_verificada
from public.maderas where xilo_id = 1;

-- Stock por especie y estado
select m.xilo_id, m.nombre, p.estado, count(*) as unidades
from public.piezas p join public.maderas m on m.id = p.madera_id
group by m.xilo_id, m.nombre, p.estado
order by m.xilo_id, p.estado;

-- Reservas que ya han vencido
select id, estado, reserva_hasta
from public.pedidos
where estado in ('reservado', 'pendiente_pago')
  and reserva_hasta < now();

-- Historial de funciones sin mostrar su código ni secretos
select proname, pg_get_function_arguments(p.oid) as argumentos
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' order by proname;
```

Para liberar reservas vencidas, select public.caducar_reservas_vencidas(); sí modifica datos: ejecútalo solo después de contrastar los pagos que pudiera haber pendientes de confirmar. La función conserva los pedidos como caducados. La aplicación la utiliza en sus recorridos de reserva y pago; no confundas la existencia de la función con una tarea programada.

### 11.5 Corregir continentes

En Table Editor → maderas localiza el xilo_id y edita continentes como array de valores: Europa, África, América, Asia u Oceanía. Si prefieres SQL, conserva primero el valor actual y utiliza, por ejemplo:

```sql
-- Ejemplo de estructura; sustituye número y continentes por los correctos
begin;
update public.maderas
set continentes = array['Europa','Asia'], updated_at = now()
where xilo_id = 86;
select xilo_id, nombre, continentes from public.maderas where xilo_id = 86;
rollback;
```

El ejemplo termina en rollback y no guarda la edición. Cuando hayas verificado la clasificación de la especie y el registro, cambia rollback por commit para aplicar TU corrección. No copies el ejemplo como una clasificación botánica definitiva. Recarga el catálogo y prueba cada filtro.

### 11.6 RLS y permisos

RLS limita qué filas pueden leer o cambiar los visitantes y usuarios. El cliente público debe poder leer maderas publicadas y el stock permitido; el usuario debe ver sus datos, no los de otra cuenta. Los administradores tienen permisos de gestión específicos.

Ante un error de acceso, comprueba cuenta, rol, política y función. No desactives RLS para hacer que una consulta funcione. Tampoco cambies el cliente público para que utilice service_role: esa clave pertenece al servidor. Si una tabla nueva necesita acceso público, revisa permisos de tabla y políticas por separado.

### 11.7 Migraciones y reconstrucción

Las funciones y tablas actuales no están íntegramente creadas por un único archivo del repositorio. El historial de migraciones del proyecto conserva cambios de sincronización, checkout, permisos, invitados y reglas de venta. docs/condiciones-venta.sql es solo una parte del esquema.

Antes de reconstruir un proyecto, exporta esquema, funciones, triggers, políticas, secuencias y datos; conserva también configuración Auth, credenciales y objetos de Storage. Clonar GitHub o ejecutar la migración de venta no recrea todo el sistema. Prueba la restauración en un proyecto separado antes de sustituir producción.

## 12 Supabase Auth Stripe Brevo dominio y correo

### 12.1 Confirmación y recuperación de cuentas

En Supabase abre Authentication → Users para revisar una cuenta, y la configuración de Authentication para URLs y envío de correo. El código solicita confirmación hacia /login o /continuar-compra, y recuperación hacia /cambiar-password.

Revisa que Site URL y las Redirect URLs admitan las rutas correspondientes del origen utilizado: https://www.maderasdelmundo.es y, si se usa, https://maderasdelmundo.es. Añade las rutas locales o de preview necesarias para pruebas, con el alcance mínimo adecuado. Guardar un dominio en Vercel no modifica estas URLs de Auth.

Si no llega una confirmación, consulta correo no deseado, registros de Auth y el proveedor de correo configurado. Si el enlace vuelve a una dirección incorrecta, comprueba Redirect URLs y el origen desde el que se solicitó. Si cambias la plantilla, conserva sus variables de confirmación y prueba el enlace completo.

### 12.2 Localizar las claves de Stripe

En Stripe abre el área de Developers o Workbench y busca API keys. Comprueba si estás en entorno de pruebas/sandbox o modo real. STRIPE_SECRET_KEY es la clave secreta: sk_test_ corresponde a pruebas y sk_live_ a real. Copia el valor directamente a Vercel; no lo pegues en una página ni en GitHub.

Una clave válida de pruebas permite simular pagos, pero no cobrar realmente. Antes de abrir ventas revisa modo real, activación de la cuenta, moneda, método de pago y destino de los ingresos desde Stripe. El estado Ready de Vercel no verifica esos puntos.

### 12.3 Configurar el webhook Stripe

1. En el entorno Stripe correspondiente abre Webhooks o Event destinations.
2. Crea o revisa el destino https://www.maderasdelmundo.es/api/stripe/webhook.
3. Configura checkout.session.completed, checkout.session.async_payment_succeeded y checkout.session.expired, que son los eventos atendidos por el código actual.
4. Guarda su signing secret en STRIPE_WEBHOOK_SECRET del entorno Vercel correspondiente.
5. Publica de nuevo si has cambiado variables y comprueba la respuesta del destino.

El secreto de firma whsec_ es distinto de la API key sk_ y pertenece a ese destino y modo. Evita una URL que redirija antes de llegar a la ruta: revisa la respuesta HTTP del envío en Stripe. Una respuesta 400 por firma puede indicar secreto equivocado, modo distinto o cuerpo alterado; una 500 necesita revisar los registros del servidor.

Para probar utiliza el modo de pruebas y los métodos de prueba oficiales de Stripe. No hagas ensayos con una tarjeta real en modo real. Después de una prueba, comprueba pedido, importes, piezas y correo, y conserva la separación con el inventario real.

### 12.4 Brevo y el buzón de contacto

Brevo envía mensajes; el buzón contacto@maderasdelmundo.es recibe consultas y respuestas. Configurar una API de Brevo no crea ese buzón. El remitente debe estar autorizado en Brevo, y la configuración DNS de autenticación debe corresponder al dominio utilizado.

Si cambias el correo de contacto, busca y revisa todos sus usos en app, lib, los textos legales, el SQL de validación, el destinatario de avisos y las plantillas de correo. BREVO_SENDER_EMAIL cambia el remitente, pero no cambia por sí sola todos los destinatarios y enlaces escritos en el código.

### 12.5 Dominio y DNS

La web pública usa maderasdelmundo.es y www.maderasdelmundo.es. En Vercel → Settings → Domains revisa qué dominio sirve producción y cuál redirige. En el proveedor DNS, utiliza los valores que Vercel indique para ese proyecto; no reutilices una IP de un tutorial antiguo.

Antes de tocar DNS, copia los registros actuales. Los registros del sitio y los del correo tienen funciones diferentes: A/CNAME suelen dirigir la web; MX dirige recepción de correo; TXT y otros registros pueden autenticar remitentes. No borres MX o registros de autenticación al conectar la web.

Un cambio de dominio requiere revisar Vercel, DNS, Supabase Auth, NEXT_PUBLIC_SITE_URL, webhook Stripe, enlaces del código y la función notificar_nuevo_usuario_contacto, que contiene una URL fija. Conserva el dominio anterior o su redirección mientras haya correos y enlaces antiguos en circulación.

## 13 Copias de seguridad recuperación y limpieza

### 13.1 Qué debe tener una copia útil

| Elemento | Cómo conservarlo |
| --- | --- |
| Código y manual | Historial Git y copia local del repositorio |
| Hoja y macros | Copia de Sheets y exportación del código Apps Script |
| Base de datos | Backup o exportación de esquema y datos |
| Fotografías | Originales y copia de los objetos de Storage |
| Configuración | Registro privado de entornos, dominios, Auth y webhook |
| Credenciales | Gestor de contraseñas; no dentro del manual |
| Operaciones económicas | Exportaciones de Stripe y pedidos según la gestión necesaria |

Los backups de base de datos no incluyen el contenido de los archivos de Storage. Copia las fotos aparte. Comprueba Database → Backups y la disponibilidad real según el plan; no presupongas que existe restauración automática en todos los proyectos.

### 13.2 Antes de un cambio importante

Guarda una copia fechada de la hoja, el código que vas a cambiar y la definición SQL afectada. Para datos importantes, toma una copia restaurable de la base; un CSV de una tabla no guarda las relaciones, Auth ni las funciones. Anota el commit y despliegue que funcionaban y prueba el cambio fuera de producción.

Comprueba que sabes restaurar esa copia. Para una reconstrucción completa, utiliza las herramientas de exportación y restauración de Supabase con su documentación vigente; al ejecutar una exportación, trata el resultado como privado porque puede contener clientes y secretos del esquema.

### 13.3 Qué hizo la limpieza anterior

La limpieza autorizada reinició inventario de piezas, pedidos y colecciones, conservando usuarios y catálogo. No es un estado permanente: se han vuelto a introducir piezas y compras. Añadir una madera no necesita repetirla.

Un reinicio elimina historia comercial. Un rollback de Vercel no recupera esos registros y Stripe no olvida sus cobros. Antes de cualquier nueva limpieza, exporta datos, resuelve pagos y reservas activos y decide si debes conservar pedidos reales.

### 13.4 Ejemplo de reinicio con ensayo previo

El siguiente bloque es deliberadamente destructivo dentro de una transacción que termina en rollback. No lo uses en una tienda con compras reales que deban conservarse. No borra usuarios, perfiles, especies, productos, fotos ni banners:

```sql
begin;
delete from public.pedido_piezas;
delete from public.pedido_lineas;
delete from public.pedidos;
delete from public.coleccion_usuario;
delete from public.piezas;
update public.inventario_productos
set stock = 0, reservado = 0, updated_at = now();
select (select count(*) from public.pedidos) as pedidos,
       (select count(*) from public.piezas) as piezas,
       (select count(*) from public.coleccion_usuario) as colecciones,
       (select count(*) from auth.users) as usuarios_conservados;
rollback;
```

La secuencia de códigos de pieza no se reinicia. El ensayo deshace los cambios en la base, pero puede bloquear operaciones mientras se ejecuta. Una aplicación que reciba un webhook después de borrar su pedido no podrá conciliarlo. Solo sustituye rollback por commit en una operación de reinicio preparada, con copia restaurable y sin cobros pendientes. Exportar y verificar antes forma parte del procedimiento.

### 13.5 Restaurar sin perder compras posteriores

Para un fallo de código, vuelve al despliegue correcto. Para un error de una fila, restaura esa fila o sus relaciones verificadas. Para pérdida extensa, considera restaurar la copia en un proyecto separado y recuperar selectivamente lo necesario. Restaurar toda una base a ayer puede eliminar las compras de hoy; comprueba los pagos de Stripe y el inventario antes de retomar la venta.

## 14 Errores habituales y cómo resolverlos

### 14.1 supabaseKey is required durante build

Falta una clave de Supabase en el entorno que compila. Comprueba SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_ANON_KEY, además de la URL. La ruta mencionada en el error ayuda a ver cuál crea el cliente. Entra en el proyecto Vercel correcto, guarda las variables para Preview o Production según el despliegue y vuelve a construir ese código.

### 14.2 Neither apiKey nor config authenticator provided

El servidor está creando Stripe sin STRIPE_SECRET_KEY. Usa la clave secreta del modo correspondiente, no pk_ ni whsec_. Guarda en Vercel para el entorno correcto y redeploy. Si sigue fallando, comprueba el nombre exacto y el despliegue que has abierto.

### 14.3 No veo Environment Variables o API Keys

En Vercel entra primero en el proyecto y después en Settings. En Supabase entra en el proyecto y busca Settings → API Keys; en Stripe revisa Developers/Workbench y el modo seleccionado. Si estás en una página general del equipo, un despliegue o un área de facturación, no estás aún en la configuración que necesita la web.

Un control gris puede deberse a permisos o a una variable gestionada. Revisa tu rol o la integración antes de crear otra variable con un nombre distinto. No hace falta borrar el proyecto para corregir este problema.

### 14.4 La macro falla al crear una madera

Comprueba xilo_id positivo y único, nombre obligatorio, Publicada válido y fecha N válida. La versión actual inserta nuevas especies desde sync_madera_desde_mdm. Si vuelve a aparecer No existe xilo_id, revisa que Apps Script usa la URL de este proyecto y que la función de ese proyecto contiene el cambio de inserción de octubre.

Un error del lote deja sin confirmar su transacción. El aviso de éxito debe incluir el número de filas. Comprueba después la especie concreta en Table Editor; no añadas la misma especie con otro número para sortear el fallo.

### 14.5 El PVP no cambia o se redondea

Comprueba que la macro lee 17 columnas y envía pvp desde fila[16], usando precioONull. En Supabase se guarda como precio. La columna O no es el precio de venta. Una fórmula de Q puede estar devolviendo el valor anterior; una cadena con moneda puede necesitar convertirse a número.

Si Table Editor ya tiene el precio correcto y la pantalla no, prueba un carrito nuevo y revisa la ficha. Los precios guardados en pedidos existentes conservan su historial: no edites un pedido pagado para hacer que coincida con el PVP de hoy.

### 14.6 La madera no aparece en tienda o Comprar ahora

Comprueba Publicada, piezas disponibles y precio. El catálogo puede mostrar una madera sin stock, pero la tienda filtra piezas con disponibilidad. El botón Comprar ahora depende de que la ficha encuentre stock; que el botón aparezca no certifica que hayas completado el precio ni la configuración de pago.

Si solo falta en un filtro de continente, revisa continentes. Si solo falta la foto de portada, revisa imagen_verificada. Si la serie aparece agotada, revisa cada especie y su caja obligatoria.

### 14.7 La foto no aparece o sale recortada

Abre directamente imagen_url. Si no carga, revisa bucket, nombre, carpeta, URL y permisos de lectura. Si carga pero se recorta, comprueba que layout importa wood-portraits.css y que el despliegue tiene su regla object-fit: contain. Un fichero con extensión jpg que no sea realmente JPG puede dar problemas; exporta la imagen en el formato correcto.

Para una sustitución en la misma URL, revisa caché o usa un nombre nuevo y vincúlalo. La foto de una especie no se selecciona por parecido de nombre: se vincula por su registro.

### 14.8 La compra da error de envío

Comprueba número de piezas físicas, país y código postal. Con cuatro piezas, fuera de la península o con más de treinta, el error es el comportamiento previsto. Ofrece recogida cuando proceda o consulta por correo para una propuesta fuera del circuito automático. No elimines la validación del navegador para aceptar un destino: Supabase y el servidor también deben aplicar una regla coherente.

### 14.9 No llega el correo

Distingue confirmación de cuenta, recuperación de contraseña y confirmación de compra. Para cuenta, revisa Auth; para compra, revisa lib/brevo y registros de Brevo. Comprueba BREVO_API_KEY, remitente autorizado, destinatario y si pedidos ya tiene fecha de envío. Si Brevo no está configurado, el código puede dejar el correo pendiente sin impedir que la compra quede pagada.

### 14.10 El PR se integró pero la web no cambia

Comprueba el commit de main, el commit del despliegue y el dominio asignado. La preview de un PR y la web pública pueden servir versiones diferentes. Si se ha hecho rollback, revisa la asignación automática. Redeploy reconstruye el código asociado al despliegue seleccionado; no sustituye verificar que es el commit que quieres.

## 15 Comprobaciones y mantenimiento del manual

### 15.1 Después de cualquier publicación

Abre portada, El proyecto, catálogo, una ficha, tienda y carrito. Revisa móvil y escritorio. Si cambió Auth, prueba registro o recuperación con una cuenta de prueba. Si cambió venta, realiza los casos del capítulo 7 en entorno de pruebas y verifica Stripe y base. Si cambió correo, comprueba el registro del envío. Anota resultado y limitaciones reales de la prueba.

node --test tests/venta.test.mjs prueba helpers de descuentos, envío y comprobación de importe. tests/venta.sql contiene pruebas de base con transacción y rollback, pero generan cambios temporales y pueden afectar a secuencias: utilízalas en un entorno de pruebas. npm run build valida la compilación; no demuestra que una clave de pago real, un buzón o un destino de envío sean correctos.

### 15.2 Revisión habitual

Durante la actividad revisa pedidos pagados, reservas vencidas, stock físico, errores de correo y cambios inesperados. Antes de publicar nuevos precios, contrasta algunas filas de Q con maderas.precio. Cuando incorpores especies revisa continentes, foto, publicación y stock.

Revisa periódicamente dependencias y copias, renovación del dominio, accesos a las plataformas y funcionamiento de recuperación de cuenta. Conserva una copia privada de la configuración sin incluir secretos en el manual. La aplicación no contiene un sistema completo de contabilidad ni una automatización de todas estas revisiones.

### 15.3 Cómo actualizar este manual

La fuente del manual está en docs/manual-maderas-del-mundo.md y el historial en docs/manual-historial.md. Word y PDF son sus versiones de lectura y edición. Después de un cambio, actualiza la fuente para que no queden copias divergentes.

1. Identifica los capítulos afectados antes de modificar el sistema.
2. Cambia sus procedimientos, cifras, nombres y ejemplos según el resultado final.
3. Incrementa la versión del manual y su fecha; la siguiente edición será Versión 2.
4. Añade al historial el cambio, capítulos, commit o migración y comprobación.
5. Regenera Word y PDF, revisa la paginación y conserva la edición anterior como referencia histórica.
6. Guarda documentación y código en el mismo cambio siempre que sea posible.

AGENTS.md contiene la instrucción de mantenimiento para el trabajo futuro en este repositorio. La actualización del documento se realiza junto con el cambio: no es una tarea automática que detecte por sí sola cualquier edición realizada fuera del proyecto o en otro panel.

Para generar los documentos sin ayuda, el repositorio incluye scripts/generar-manual.py. En el Mac instala Python 3 y LibreOffice; abre Terminal en la carpeta del repositorio y ejecuta:

```bash
python3 -m venv .venv-manual
source .venv-manual/bin/activate
python -m pip install python-docx pypdf
python scripts/generar-manual.py --output-dir manual-exportado --pdf
```

La carpeta manual-exportado contendrá Word y PDF, con el número de versión leído de la fuente. Sin --pdf, solo se crea el Word. LibreOffice se usa para convertir y pypdf para añadir los números de página al índice. También puedes editar el Word y exportar a PDF desde Word o LibreOffice, pero incorpora después esas modificaciones a la fuente Markdown para conservar un único contenido vigente. Revisa siempre el resultado al abrirlo, especialmente las tablas y los saltos de página.

### 15.4 Qué capítulos cambian según la tarea

| Cambio futuro | Capítulos que se deben revisar |
| --- | --- |
| Hoja, columnas o macro | 2, 3, 4, 11 y errores relacionados |
| Fotografías o proporciones | 2, 5 y 9 |
| Inventario, series o cajas | 6, 7, 8 y 11 |
| Envío, descuentos o condiciones | 7, 8, 9 y 15 |
| Stripe, claves o webhook | 7, 8, 10, 12 y 14 |
| Correo o dominio | 1, 8, 10, 12 y 14 |
| Usuarios, permisos o Auth | 6, 8, 11 y 12 |
| Estructura, estilos o dependencias | 9, 10, 14 y 15 |
| Copias, limpieza o recuperación | 11 y 13 |

## 16 Referencias y registro de esta versión

### 16.1 Documentación oficial para ampliar procedimientos

Los paneles pueden cambiar de nombre o distribución. Usa estos enlaces para contrastar opciones antes de una operación importante:

- Vercel variables: https://vercel.com/docs/environment-variables
- Vercel despliegues: https://vercel.com/docs/deployments/managing-deployments
- Vercel rollback: https://vercel.com/docs/instant-rollback
- Supabase claves: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase Auth y redirecciones: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase copias: https://supabase.com/docs/guides/platform/backups
- Supabase exportación y restauración: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- Stripe claves: https://docs.stripe.com/keys
- Stripe webhooks: https://docs.stripe.com/webhooks
- Stripe pruebas: https://docs.stripe.com/testing
- Apps Script propiedades: https://developers.google.com/apps-script/guides/properties
- Apps Script registros: https://developers.google.com/apps-script/guides/logging
- Brevo claves: https://developers.brevo.com/docs/api-key-authentication
- Brevo API de envío: https://developers.brevo.com/reference/send-transac-email

### 16.2 Historial inicial

Versión 1 recoge el catálogo real en Supabase, la sincronización desde MDM, inserción de nuevas especies, PVP con céntimos, 86 fotos verticales, inventario por piezas, series y cajas, ventas presenciales, cuentas y colecciones, compra como invitado, Stripe, Brevo, banners, actualización de dependencias y condiciones de venta del 11 de octubre. Incluye el aviso horizontal del carrito.

La revisión de esta edición contrastó el código de main, cabeceras y primeras filas de MDM, estructura y funciones de la base, bucket de fotografías y reglas de venta. Las claves reales se consultan en sus paneles. Antes de una venta o cambio de configuración, utiliza las comprobaciones de modo Stripe, entornos y Auth descritas en los capítulos correspondientes.
