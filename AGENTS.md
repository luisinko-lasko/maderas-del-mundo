# Mantenimiento de Maderas del Mundo

## Documentación obligatoria

Luis ha pedido que cada cambio del proyecto actualice los capítulos correspondientes del manual. La fuente vigente es `docs/manual-maderas-del-mundo.md`; el historial está en `docs/manual-historial.md`.

Antes de dar por terminado un cambio de código, datos, reglas comerciales, esquema, configuración, macro o plataforma:

1. Leer las secciones afectadas del manual y contrastarlas con el estado final.
2. Actualizar procedimientos, cifras, rutas, nombres y ejemplos que cambien. Si el cambio no altera las instrucciones, registrar el cambio y su comprobación en el historial.
3. Incrementar la versión de la edición cuando cambie el contenido del manual y actualizar la fecha. La edición inicial es Versión 1; la siguiente es Versión 2.
4. Registrar capítulos afectados, commit o migración y comprobaciones en el historial.
5. Regenerar y entregar Word y PDF cuando cambie el manual. Sustituir el documento vigente conservando historial, y guardar una copia de la edición anterior cuando corresponda.
6. Incluir la documentación en el mismo cambio del repositorio cuando sea posible. Informar de un bloqueo real si impide actualizar una copia; no afirmar que se actualizó sin hacerlo.

Nunca incluir claves, tokens, contraseñas o exportaciones de clientes en documentación o Git. Las fotos están en Supabase Storage; el inventario de madera se calcula por filas en `piezas`. Las reglas de venta tienen representación en `lib/venta.js` y en `public.calcular_condiciones_venta()`; revisarlas juntas.
