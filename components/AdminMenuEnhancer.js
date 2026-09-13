'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminMenuEnhancer() {
  const pathname = usePathname();
  const router = useRouter();

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
        }

        catalogo.setAttribute('href', '/admin/catalogo');

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

        let banner = nav.querySelector('a[href="/admin/banner"]');

        if (!banner) {
          banner = document.createElement('a');
          banner.href = '/admin/banner';
          banner.textContent = 'Banner';
          banner.dataset.adminBanner = 'true';

          const usuarios = nav.querySelector('a[href="/admin/usuarios"]');
          if (usuarios?.nextSibling) {
            nav.insertBefore(banner, usuarios.nextSibling);
          } else {
            nav.appendChild(banner);
          }
        }

        if (pathname.startsWith('/admin/banner')) {
          banner.classList.add('active');
        } else {
          banner.classList.remove('active');
        }
      });
    }

    function interceptarCatalogo(event) {
      const enlace = event.target.closest?.('.admin-side nav a');
      if (!enlace) return;

      const texto = enlace.textContent?.trim().toLocaleLowerCase('es');
      const href = enlace.getAttribute('href');

      if (texto !== 'catálogo' && href !== '/catalogo' && href !== '/admin/catalogo') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      router.push('/admin/catalogo');
    }

    actualizarMenus();

    const observer = new MutationObserver(() => {
      actualizarMenus();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    document.addEventListener('click', interceptarCatalogo, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', interceptarCatalogo, true);

      document
        .querySelectorAll('a[data-admin-production="true"]')
        .forEach((link) => link.remove());

      document
        .querySelectorAll('a[data-admin-catalog="true"]')
        .forEach((link) => link.remove());

      document
        .querySelectorAll('a[data-admin-banner="true"]')
        .forEach((link) => link.remove());
    };
  }, [pathname, router]);

  return null;
}
