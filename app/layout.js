import './globals.css';
import './mobile-menu.css';
import Link from 'next/link';

export const metadata = {
  title: 'Maderas del mundo',
  description: 'Colección contemporánea de maderas del mundo'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <Link href="/" className="brand" aria-label="Maderas del mundo, inicio">
            <span className="brand-mark">MDM</span>
            <span className="brand-name">Maderas del mundo</span>
          </Link>

          <nav className="nav desktop-nav">
            <Link href="/catalogo">Catálogo</Link>
            <Link href="/about">El proyecto</Link>
            <Link href="/tienda">Tienda</Link>
            <Link href="/coleccion">Mi colección</Link>
            <Link href="/login">Mi cuenta</Link>
            <Link href="/carrito">Carrito</Link>
          </nav>

          <details className="mobile-menu">
            <summary aria-label="Abrir menú">Menú <span>☰</span></summary>
            <nav>
              <Link href="/catalogo">Catálogo</Link>
              <Link href="/about">El proyecto</Link>
              <Link href="/tienda">Tienda</Link>
              <Link href="/coleccion">Mi colección</Link>
              <Link href="/login">Mi cuenta</Link>
              <Link href="/carrito">Carrito</Link>
            </nav>
          </details>
        </header>
        {children}
        <footer className="footer">
          <div><strong>Maderas del mundo</strong><br/>Una colección material del mundo.</div>
          <div className="footer-meta">Madrid · Proyecto 2026<br/>Primera versión de trabajo</div>
        </footer>
      </body>
    </html>
  );
}
