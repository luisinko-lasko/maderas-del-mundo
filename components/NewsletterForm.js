'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './NewsletterForm.module.css';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);
  const [estado, setEstado] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function suscribir(e) {
    e.preventDefault();
    setEstado('');

    if (!consentimiento) {
      setEstado('Debes autorizar el envío de novedades por correo.');
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consentimiento })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo iniciar la suscripción.');
      }

      setEmail('');
      setConsentimiento(false);
      setEstado('Revisa tu correo para confirmar la suscripción.');
    } catch (error) {
      setEstado(error.message || 'No se pudo iniciar la suscripción.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={suscribir}>
      <strong>Novedades por correo</strong>
      <p>
        Nuevas maderas, series y noticias del proyecto. Sin frecuencia fija.
      </p>

      <div className={styles.row}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com"
          aria-label="Correo electrónico"
          autoComplete="email"
          required
        />
        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Apuntarme'}
        </button>
      </div>

      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={consentimiento}
          onChange={e => setConsentimiento(e.target.checked)}
        />
        <span>
          Quiero recibir comunicaciones de Maderas del Mundo por correo electrónico.
          Responsable: Luis Rodriguez. Finalidad: envío de novedades del proyecto.
          La base jurídica es mi consentimiento y puedo retirarlo en cualquier momento.
          Más información y derechos en la{' '}
          <Link href="/privacidad">política de privacidad</Link>.
        </span>
      </label>

      {estado && <p className={styles.status} role="status">{estado}</p>}
    </form>
  );
}
