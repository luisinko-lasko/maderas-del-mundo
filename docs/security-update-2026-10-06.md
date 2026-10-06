# Actualización de seguridad — 6 de octubre de 2026

El PR #1 de Vercel cambia únicamente package.json y package-lock.json: Next.js 15.5.2 → 15.5.9, @next/env → 15.5.9 y los binarios SWC → 15.5.7. React y React DOM permanecen en 19.1.1. También elimina metadatos libc de paquetes opcionales. Está en borrador, tiene conflictos con main y su check Vercel falló. No fue posible recuperar los registros del despliegue antiguo (API: Deployment not found); no se atribuye ese fallo a las dependencias.

La revisión parte de main c4394465d177954e5040e58ea097659d840f6c64. Su manifest declara Next.js ^15.5.21 y el lock instala 15.5.25; Supabase y Stripe se conservan. El PR antiguo supondría un retroceso y debe sustituirse por esta actualización.

## Cambios

- Next.js, @next/env y SWC: 15.5.26.
- React y React DOM: 19.1.8, manteniendo la rama 19.1.
- Override PostCSS 8.5.23 y source-map-js 1.2.2 en el lock, para resolver avisos adicionales sin migrar a Next.js 16.
- Manifest y lock sincronizados; versiones directas de Next.js y React fijadas.

Next.js incorpora su implementación RSC parcheada: la versión de react del manifest por sí sola no demuestra exposición a React2Shell. La implementación Next.js 15.5.25 del lock actual ya supera el parche original 15.5.7. Next.js 15.5.26 incorpora hardening adicional; la RCE de next/og publicada en septiembre afecta a Next.js 16.2–16.3.5, no a 15.x.

## Validación y límites

Se han instalado las dependencias, comprobado los peers con npm ls y compilado el proyecto. La compilación utiliza valores ficticios para Supabase y Stripe: verifica compatibilidad de código y generación de páginas, no servicios reales. No hay scripts de tests ni lint independientes. Persisten avisos CSS sobre start/end frente a flex-start/flex-end.

El override PostCSS sustituye la versión exacta pedida por Next.js; requiere mantener la prueba de compilación en futuras actualizaciones. Los avisos de PostCSS y source-map-js requieren CSS/mapas controlados por un atacante; no se encontró un servicio que acepte esos datos de visitantes.

## Aplicación y despliegue

1. Construir una preview de esta rama en Vercel. Utilizar npm ci y npm run build, con output y framework de Next.js por defecto; no configurar public como output.
2. Comprobar que Preview dispone de las variables necesarias: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET y variables de Brevo. Usar Stripe de prueba para validar pagos sin cobros reales.
3. Verificar portada, About, catálogo, ficha de madera, registro/login, colección, administración y compra de prueba; confirmar resultado y webhook del pago.
4. Tras una preview correcta, integrar esta rama en main y comprobar que Vercel despliega ese commit. Confirmar dominio y funcionamiento de producción. Cerrar el PR #1 como sustituido.
5. Si hay errores, restaurar el despliegue anterior conocido; no volver a Next.js 15.5.9. Si se confirma que producción estuvo ejecutando 15.5.2, revisar registros y rotar secretos del servidor después de parchear.

Fuentes: https://nextjs.org/blog/CVE-2025-66478 ; https://nextjs.org/blog/security-update-2025-12-11 ; https://nextjs.org/blog/nextjs-security-update-september-22-2026 ; https://github.com/postcss/postcss/security/advisories/GHSA-fxqj-rqcc-2cmp
