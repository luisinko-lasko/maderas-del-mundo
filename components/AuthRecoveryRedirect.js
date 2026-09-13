'use client';

import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthRecoveryRedirect() {
  useEffect(() => {
    function irACambiarPassword() {
      if (window.location.pathname === '/cambiar-password') return;

      // Conserva el fragmento con los tokens si Supabase todavía no lo ha procesado.
      const hash = window.location.hash || '';
      window.location.replace(`/cambiar-password${hash}`);
    }

    // En el flujo implícito, el enlace de recuperación suele volver con type=recovery
    // en el fragmento de la URL. Esto cubre incluso el caso en que Supabase haya
    // usado el Site URL (la portada) en lugar del redirectTo solicitado.
    const hashParams = new URLSearchParams(
      window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash
    );

    if (hashParams.get('type') === 'recovery') {
      irACambiarPassword();
      return;
    }

    // Si supabase-js ya ha procesado el fragmento, emite PASSWORD_RECOVERY.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        irACambiarPassword();
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
