'use client';

import Link from 'next/link';
import { useRef } from 'react';

export default function MobileMenu() {
  const detailsRef = useRef(null);

  function cerrarMenu() {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }

  return (
    <details ref={detailsRef} className="mobile-menu">
      <summary aria-label="Abrir menú">Menú <span>☰</span></summary>
      <nav>
        <Link href="/catalogo" onClick={cerrarMenu}>Catálogo</Link>
        <Link href="/about" onClick={cerrarMenu}>El proyecto</Link>
        <Link href="/tienda" onClick={cerrarMenu}>Tienda</Link>
        <Link href="/coleccion" onClick={cerrarMenu}>Mi colección</Link>
        <Link href="/login" onClick={cerrarMenu}>Mi cuenta</Link>
        <Link href="/carrito" onClick={cerrarMenu}>Carrito</Link>
      </nav>
    </details>
  );
}
