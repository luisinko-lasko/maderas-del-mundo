import Link from 'next/link';

export const metadata = {
  title: 'Suscripción confirmada · Maderas del mundo'
};

export default function NewsletterConfirmado() {
  return (
    <main className="page-shell">
      <div className="page-eyebrow">Maderas del mundo / Novedades</div>
      <h1>Suscripción confirmada</h1>
      <p>
        Tu correo ya está en la lista de novedades de Maderas del Mundo.
        Podrás darte de baja desde cualquier mensaje que recibas.
      </p>
      <Link href="/" className="button">
        Volver al inicio
      </Link>
    </main>
  );
}
