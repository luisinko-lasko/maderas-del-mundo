# Maderas del Mundo

Aplicación de catálogo, tienda y administración de la Asociación Maderas del Mundo. Usa Next.js App Router, Supabase para datos y cuentas, Stripe Checkout para pago y Brevo para correos transaccionales. Producción: https://www.maderasdelmundo.es.

## Manual vigente

[Manual de administración y mantenimiento — Versión 1](docs/manual-maderas-del-mundo.md) describe plataformas, hoja MDM, macros, fotos, inventario, series, compras, usuarios, despliegue, copias y resolución de errores. [Historial del manual](docs/manual-historial.md).

`AGENTS.md` exige actualizar los capítulos afectados junto con los cambios del proyecto. Los antiguos textos de maqueta, incluido `README.txt`, son históricos y no describen el sistema actual.

## Desarrollo

Configura `.env.local` con las variables del capítulo 10 del manual. No publiques secretos. Una instalación conectada a producción puede modificar sus datos.

```bash
npm ci
npm run dev
node --test tests/venta.test.mjs
npm run build
```

`docs/condiciones-venta.sql` conserva una migración ya aplicada; no debe ejecutarse de nuevo completa. El repositorio no contiene un único instalador que reconstruya todas las funciones y tablas de Supabase. Conserva copias del esquema, datos, configuración y objetos de Storage.
