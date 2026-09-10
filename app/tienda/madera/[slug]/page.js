'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabase';
import { añadirAlCarrito } from '../../../../lib/carrito';

export default function MaderaTiendaPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [madera, setMadera] = useState(null);
  const [piezas, setPiezas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    async function cargar() {
      const [maderaRes, piezasRes] = await Promise.all([
        supabase
          .from('maderas')
          .select(`
            id,
            xilo_id,
            nombre,
            nombre_cientifico,
            familia,
            origen,
            imagen_url,
            precio,
            slug
          `)
          .eq('slug', slug)
          .eq('publicada', true)
          .single(),

        supabase
          .from('piezas')
          .select('id, madera_id')
          .eq('estado', 'disponible')
      ]);

      if (maderaRes.error) {
        setError(maderaRes.error.message);
        setCargando(false);
        return;
      }

      if (piezasRes.error) {
        setError(piezasRes.error.message);
        setCargando(false);
        return;
      }

      setMadera(maderaRes.data);
      setPiezas(piezasRes.data || []);
      setCargando(false);
    }

    cargar();
  }, [slug]);

  const stock = useMemo(() => {
    if (!madera) return 0;

    return piezas.filter(
      p => p.madera_id === madera.id
    ).length;
  }, [piezas, madera]);

  if (cargando) {
    return (
      <main className="page-shell">
        <h1>Cargando pieza…</h1>
      </main>
    );
  }

  if (error || !madera) {
    return (
      <main className="page-shell">
        <Link href="/tienda">← Tienda</Link>
        <h1>No se pudo cargar la madera</h1>
        {error && <p>{error}</p>}
      </main>
    );
  }

  const agotada = stock === 0;

  return (
    <main className="wood-shop-detail">

      <div className="wood-shop-back">
        <Link href="/tienda">
          ← Tienda
        </Link>
      </div>

      <section className="wood-shop-layout">

        <div className="wood-shop-image">
          {madera.imagen_url ? (
            <img
              src={madera.imagen_url}
              alt={madera.nombre}
            />
          ) : (
            <div className="shop-individual-placeholder" />
          )}
        </div>

        <div className="wood-shop-info">

          <div className="page-eyebrow">
            Pieza individual · #{String(madera.xilo_id).padStart(3, '0')}
          </div>

          <h1>{madera.nombre}</h1>

          <em>{madera.nombre_cientifico}</em>

          <div className="wood-shop-meta">
            {madera.familia && (
              <div>
                <span>Familia</span>
                <strong>{madera.familia}</strong>
              </div>
            )}

            {madera.origen && (
              <div>
                <span>Origen</span>
                <strong>{madera.origen}</strong>
              </div>
            )}
          </div>

          <div className="wood-shop-purchase">

            <div>
              <span>Precio</span>
              <strong>
                {madera.precio != null
                  ? `${Number(madera.precio).toFixed(2)} €`
                  : 'Precio pendiente'}
              </strong>
            </div>

            <div>
              <span>Disponibilidad</span>
              <strong>
                {agotada
                  ? 'Agotada'
                  : `${stock} ${stock === 1 ? 'pieza' : 'piezas'}`}
              </strong>
            </div>

          </div>

          <button
            className="button dark"
            disabled={agotada || madera.precio == null}
            onClick={() => {
              añadirAlCarrito({
                clave: `madera-${madera.id}`,
                tipo: 'madera',
                id: madera.id,
                nombre: madera.nombre,
                nombre_cientifico: madera.nombre_cientifico,
                precio: Number(madera.precio),
                imagen_url: madera.imagen_url,
                slug: madera.slug
              });

              router.push('/carrito');
            }}
          >
            Añadir al carrito
          </button>

          <Link
            href={`/catalogo/${madera.slug}`}
            className="wood-shop-catalog-link"
          >
            Ver ficha completa en Catálogo →
          </Link>

        </div>

      </section>

    </main>
  );
}
