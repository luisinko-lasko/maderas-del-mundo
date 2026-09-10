import { notFound } from 'next/navigation';

import Link from 'next/link';

import { supabase } from '../../../lib/supabase';


function Fact({ label, value, suffix = '' }) {

  if (value === null || value === undefined || value === '') return null;

  return (

    <div>

      <dt>{label}</dt>

      <dd>{value}{suffix}</dd>

    </div>

  );

}


function formatearFecha(fecha) {

  if (!fecha) return '';

  const d = new Date(fecha + 'T00:00:00');

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);

}


export default async function Ficha({ params }) {

  const { slug } = await params;

  const { data: m, error } = await supabase

    .from('maderas')

    .select('*')

    .eq('slug', slug)

    .eq('publicada', true)

    .single();


  if (error || !m) notFound();


  const tieneProteccion =
    m.cites ||
    m.ue ||
    m.cites_desde;


  return (

    <main className="detail-page">

      <div className="detail-sample">

        <div className="large-wood">

          {m.imagen_url && (

            <img

              src={m.imagen_url}

              alt={`Madera de ${m.nombre}`}

              className="wood-photo"

            />

          )}

        </div>

        <span className="specimen-code">

          #{String(m.xilo_id).padStart(3, '0')}

        </span>

      </div>


      <div className="detail-copy">

        <Link href="/catalogo" className="back">

          ← Catálogo

        </Link>


        <div className="page-eyebrow">

          Ficha de madera / #{m.xilo_id}

        </div>


        <h1>{m.nombre}</h1>


        {m.nombre_cientifico && (

          <p className="detail-latin">{m.nombre_cientifico}</p>

        )}


        <div className="continent-tags">

          {(m.continentes || []).map((c) => (

            <span key={c}>{c}</span>

          ))}

        </div>


        <dl className="facts ficha-identidad">

          <Fact label="Nombre en inglés" value={m.nombre_ingles} />

          <Fact label="Otros nombres" value={m.otros_nombres} />

          <Fact label="Nombre científico" value={m.nombre_cientifico} />

          <Fact label="Familia" value={m.familia} />

          <Fact label="Origen" value={m.origen} />

        </dl>


        <h2 className="facts-title">Propiedades</h2>

        <dl className="facts">

          <Fact
            label="Densidad seco (15%)"
            value={m.densidad_seco_15}
            suffix=" kg/m³"
          />

          <Fact
            label="Janka"
            value={m.janka_lbf}
            suffix=" lbf"
          />

          <Fact
            label="Clasificación de dureza"
            value={m.dureza}
          />

        </dl>


        <h2 className="facts-title">Protección y comercio</h2>

        {tieneProteccion ? (

          <dl className="facts">

            <Fact
              label="CITES"
              value={m.cites ? `Apéndice ${m.cites}` : 'No incluida'}
            />

            <Fact
              label="Unión Europea"
              value={m.ue ? `Anexo ${m.ue}` : 'No incluida'}
            />

            <Fact
              label="CITES desde"
              value={m.cites_desde ? formatearFecha(m.cites_desde) : ''}
            />

          </dl>

        ) : (

          <p className="data-note">
            No incluida actualmente en CITES ni en los anexos de la Unión Europea.
          </p>

        )}


        {m.imagen_verificada && m.imagen_fuente && (

          <p className="data-note">

            Imagen: {m.imagen_fuente}

            {m.imagen_autor ? ` · ${m.imagen_autor}` : ''}

            {m.imagen_licencia ? ` · ${m.imagen_licencia}` : ''}

          </p>

        )}

      </div>

    </main>

  );

}
