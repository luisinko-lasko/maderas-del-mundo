'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminMenuEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith('/admin')) return;

    function actualizarMenus() {
      const navs = document.querySelectorAll('.admin-side nav');

      navs.forEach((nav) => {
        let catalogo = nav.querySelector(
          'a[href="/admin/catalogo"], a[href="/catalogo"]'
        );

        if (!catalogo) {
          catalogo = document.createElement('a');
          catalogo.href = '/admin/catalogo';
          catalogo.textContent = 'Catálogo';
          catalogo.dataset.adminCatalog = 'true';

          const inventario = nav.querySelector('a[href="/admin"]');
          if (inventario?.nextSibling) {
            nav.insertBefore(catalogo, inventario.nextSibling);
          } else {
            nav.appendChild(catalogo);
          }
        } else if (catalogo.getAttribute('href') === '/catalogo') {
          catalogo.setAttribute('href', '/admin/catalogo');
        }

        if (pathname.startsWith('/admin/catalogo')) {
          catalogo.classList.add('active');
        } else {
          catalogo.classList.remove('active');
        }

        let produccion = nav.querySelector('a[href="/admin/produccion"]');

        if (!produccion) {
          produccion = document.createElement('a');
          produccion.href = '/admin/produccion';
          produccion.textContent = 'Producción';
          produccion.dataset.adminProduction = 'true';

          const pedidos = nav.querySelector('a[href="/admin/pedidos"]');

          if (pedidos) {
            nav.insertBefore(produccion, pedidos);
          } else {
            nav.appendChild(produccion);
          }
        }

        if (pathname.startsWith('/admin/produccion')) {
          produccion.classList.add('active');
        } else {
          produccion.classList.remove('active');
        }
      });
    }

    actualizarMenus();

    const observer = new MutationObserver(() => {
      actualizarMenus();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();

      document
        .querySelectorAll('a[data-admin-production="true"]')
        .forEach((link) => link.remove());

      document
        .querySelectorAll('a[data-admin-catalog="true"]')
        .forEach((link) => link.remove());
    };
  }, [pathname]);

  return null;
}
