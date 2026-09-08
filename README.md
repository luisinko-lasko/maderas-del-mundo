# Maderas del mundo — v1

Primera maqueta funcional del proyecto. Es una aplicación Next.js sin base de datos todavía: todos los datos son de demostración.

## Arrancar en un Mac

Necesitas Node.js 20 o superior.

1. Descomprime esta carpeta.
2. Abre Terminal y entra en la carpeta, por ejemplo:
   `cd ~/Downloads/maderas-del-mundo-v1`
3. Instala dependencias:
   `npm install`
4. Arranca la web:
   `npm run dev`
5. Abre en Safari:
   `http://localhost:3000`

Para detenerla: Control + C en Terminal.

## Qué incluye

- Portada conceptual y responsive.
- About Maderas del mundo.
- Catálogo de 6 especies de demostración.
- Ficha individual para cada madera.
- Área “Mi colección” simulada.
- Tienda en modo DRAFT, sin pagos.
- Panel de administración simulado con inventario.

## Siguiente fase prevista

- PostgreSQL / Supabase.
- Registro y login real.
- Colecciones por usuario.
- Inventario real.
- Códigos de barras / QR y activación de muestras físicas.
- Pedidos y Stripe Checkout.
- Panel admin operativo.
- Fotografías reales de las muestras.
