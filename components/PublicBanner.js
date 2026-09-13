'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PublicBanner() {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargarBanner() {
      const { data, error } = await supabase.rpc('obtener_banner_activo');
      if (!activo) return;

      if (error) {
        console.error('No se pudo cargar el banner público:', error);
        setTexto('');
        return;
      }

      setTexto(data?.[0]?.texto || '');
    }

    cargarBanner();

    const refrescarAlVolver = () => cargarBanner();
    window.addEventListener('focus', refrescarAlVolver);

    return () => {
      activo = false;
      window.removeEventListener('focus', refrescarAlVolver);
    };
  }, []);

  if (!texto) return null;

  return (
    <div className="public-banner" role="status" aria-label="Aviso">
      {texto}
    </div>
  );
}
