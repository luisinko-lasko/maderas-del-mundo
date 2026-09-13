'use client';

import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function GuestOrderLinker() {
  useEffect(() => {
    let cancelado = false;

    async function vincularSiProcede() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user || cancelado) return;

      try {
        await supabase.rpc('vincular_pedidos_invitado');
      } catch (error) {
        console.error('No se pudieron vincular compras de invitado:', error);
      }
    }

    vincularSiProcede();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        setTimeout(vincularSiProcede, 0);
      }
    });

    return () => {
      cancelado = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return null;
}
