'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { destinoColeccion } from '../lib/coleccion-retorno';

export default function RetornoColeccionRegistro() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    // Si Auth usa su Site URL como retorno, recuperamos la especie del nuevo registro.
    if (pathname !== '/' || new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery') return;
    let activo = true;
    supabase.auth.getUser().then(({ data }) => {
      const destino = destinoColeccion(data?.user?.user_metadata?.mdm_madera_pendiente);
      if (activo && destino && data.user.email_confirmed_at) router.replace(destino);
    });
    const { data } = supabase.auth.onAuthStateChange((evento, session) => {
      const destino = destinoColeccion(session?.user?.user_metadata?.mdm_madera_pendiente);
      if (evento === 'SIGNED_IN' && destino && session.user.email_confirmed_at) router.replace(destino);
    });
    return () => { activo = false; data.subscription.unsubscribe(); };
  }, [pathname, router]);
  return null;
}
