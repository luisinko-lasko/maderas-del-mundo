import { notFound } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { numeroEspecie } from '../../../../lib/coleccion-retorno';
import IncorporarMadera from '../../../../components/IncorporarMadera';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Añadir a mi colección · Maderas del Mundo' };

export default async function PaginaIncorporacion({ params }) {
  const { xilo } = await params;
  const numero = numeroEspecie(xilo);
  if (!numero) notFound();
  const { data, error } = await supabase.from('maderas')
    .select('id,xilo_id,nombre,nombre_cientifico,imagen_url,slug')
    .eq('xilo_id', numero).eq('publicada', true).maybeSingle();
  if (error) throw new Error('No se pudo consultar la madera. Inténtalo de nuevo.');
  if (!data) notFound();
  return <IncorporarMadera madera={data} />;
}
