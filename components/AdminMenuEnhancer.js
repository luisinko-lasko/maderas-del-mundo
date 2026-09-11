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
        let link = nav.querySelector('a[href="/admin/produccion"]');

        if (!link) {
          link = document.createElement('a');
          link.href = '/admin/produccion';
          link.textContent = 'Producción';
          link.dataset.adminProduction = 'true';

          const pedidos = nav.querySelector('a[href="/admin/pedidos"]');

          if (pedidos) {
            nav.insertBefore(link, pedidos);
          } else {
            nav.appendChild(link);
          }
        }

        if (pathname.startsWith('/admin/produccion')) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
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
    };
  }, [pathname]);

  return null;
}
