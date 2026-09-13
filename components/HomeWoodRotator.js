'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './HomeWoodRotator.module.css';

function barajar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export default function HomeWoodRotator() {
  const [maderas, setMaderas] = useState([]);
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      const { data, error } = await supabase
        .from('maderas')
        .select('xilo_id, nombre, nombre_cientifico, imagen_url')
        .eq('publicada', true)
        .eq('imagen_verificada', true)
        .not('imagen_url', 'is', null)
        .order('xilo_id');

      if (!activo || error) return;

      const conImagen = (data || []).filter((m) => m.imagen_url?.trim());
      setMaderas(barajar(conImagen));
    }

    cargar();
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (maderas.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setIndice((actual) => (actual + 1) % maderas.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [maderas.length]);

  const madera = useMemo(
    () => (maderas.length ? maderas[indice % maderas.length] : null),
    [maderas, indice]
  );

  if (!madera) {
    return <div className={`${styles.frame} ${styles.fallback}`} aria-hidden="true" />;
  }

  return (
    <figure className={styles.frame}>
      <img
        key={`${madera.xilo_id}-${indice}`}
        className={styles.image}
        src={madera.imagen_url}
        alt={`Madera de ${madera.nombre}`}
      />
      <figcaption className={styles.caption}>
        <span>#{String(madera.xilo_id).padStart(3, '0')}</span>
        <strong>{madera.nombre}</strong>
        {madera.nombre_cientifico && <em>{madera.nombre_cientifico}</em>}
      </figcaption>
    </figure>
  );
}
