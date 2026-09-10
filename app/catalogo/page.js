'use client';

import { useEffect, useMemo, useState } from 'react';

import WoodTile from '../../components/WoodTile';
import { supabase } from '../../lib/supabase';

const categorias = ['Todas', 'Europa', 'África', 'América', 'Asia', 'Oceanía'];

export default function Catalogo() {
  const [categoria, setCategoria] = useState('Todas');
  const [vista, setVista] = useState('mosaico');
  const [orden, setOrden] = useState('xilo');
  const [maderas, setMaderas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargarMaderas() {
      const { data: maderasData, error: maderasError } = await supabase
        .from('maderas')
        .select('*')
        .eq('publicada', true)
        .order('xilo_id');

      if (maderasError) {
        console.error(maderasError);
        setError(maderasError.message);
        setCargando(false);
        return;
      }

      const { data: piezasData, error: piezasError } = await supabase
        .from('piezas')
        .select('madera_id')
        .eq('estado', 'disponible');

      if (piezasError) {
        console.error(piezasError);
        setError(piezasError.message);
        setCargando(false);
        return;
      }

      const stockPorMadera = {};

      for (const pieza of piezasData || []) {
        stockPorMadera[pieza.madera_id] =
          (stockPorMadera[pieza.madera_id] || 0) + 1;
      }

      const adaptadas = (maderasData || []).map((m) => ({
        id: m.id,
        xiloId: m.xilo_id,
        nombre: m.nombre,
        nombreIngles: m.nombre_ingles,
        otros: m.otros_nombres,
        nombreCientifico: m.nombre_cientifico,
        familia: m.familia,
        densidad: m.densidad_seco_15,
        janka: m.janka_lbf,
        dureza: m.dureza,
        origen: m.origen,
        slug: m.slug,
        continentes: m.continentes || [],
        imagenUrl: m.imagen_url,
        imagenFuente: m.imagen_fuente,
        imagenAutor: m.imagen_autor,
        imagenLicencia: m.imagen_licencia,
        imagenCommonsPage: m.imagen_commons_page,
        imagenVerificada: m.imagen_verificada,
        stock: stockPorMadera[m.id] || 0,
      }));

      setMaderas(adaptadas);
      setCargando(false);
    }

    cargarMaderas();
  }, []);

  const visibles = useMemo(() => {
    const filtradas =
      categoria === 'Todas'
        ? [...maderas]
        : maderas.filter((m) => m.continentes.includes(categoria));

    filtradas.sort((a, b) => {
      switch (orden) {
        case 'nombre-az':
          return (a.nombre || '').localeCompare(b.nombre || '', 'es');

        case 'nombre-za':
          return (b.nombre || '').localeCompare(a.nombre || '', 'es');

        case 'densidad-asc':
          return (a.densidad ?? Infinity) - (b.densidad ?? Infinity);

        case 'densidad-desc':
          return (b.densidad ?? -Infinity) - (a.densidad ?? -Infinity);

        case 'janka-asc':
          return (a.janka ?? Infinity) - (b.janka ?? Infinity);

        case 'janka-desc':
          return (b.janka ?? -Infinity) - (a.janka ?? -Infinity);

        case 'xilo':
        default:
          return (a.xiloId ?? Infinity) - (b.xiloId ?? Infinity);
      }
    });

    return filtradas;
  }, [categoria, orden, maderas]);

  if (cargando) {
    return (
      <main className="page-shell">
        <div className="page-eyebrow">Catálogo</div>
        <h1>Cargando maderas…</h1>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell">
        <div className="page-eyebrow">Catálogo</div>
        <h1>No se pudo cargar el catálogo</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-eyebrow">
        Catálogo / {String(visibles.length).padStart(3, '0')} especies
      </div>

      <div className="catalog-title-row">
        <h1>Catálogo de maderas</h1>
        <p>
          Una biblioteca tangible de especies, colores, texturas, pesos y procedencias.
        </p>
      </div>

      <div
        className="filter-bar"
        role="group"
        aria-label="Filtrar por continente"
      >
        {categorias.map((cat) => (
          <button
            type="button"
            key={cat}
            className={categoria === cat ? 'active' : ''}
            onClick={() => setCategoria(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="catalog-toolbar">
        <div className="catalog-controls">
          <label>
            Ordenar por{' '}
            <select value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="xilo">Nº Xilo</option>
              <option value="nombre-az">Nombre A–Z</option>
              <option value="nombre-za">Nombre Z–A</option>
              <option value="densidad-asc">Densidad: menor a mayor</option>
              <option value="densidad-desc">Densidad: mayor a menor</option>
              <option value="janka-asc">Dureza: menor a mayor</option>
              <option value="janka-desc">Dureza: mayor a menor</option>
            </select>
          </label>

          <div className="view-switch" aria-label="Cambiar vista">
            <button
              type="button"
              className={vista === 'mosaico' ? 'active' : ''}
              onClick={() => setVista('mosaico')}
            >
              Mosaico
            </button>

            <button
              type="button"
              className={vista === 'lista' ? 'active' : ''}
              onClick={() => setVista('lista')}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      {vista === 'mosaico' ? (
        <div className="wood-grid catalog-grid">
          {visibles.map((m) => (
            <WoodTile madera={m} key={m.slug} />
          ))}
        </div>
      ) : (
        <div className="catalog-list">
          <div className="catalog-list-head">
            <span>#</span>
            <span>Madera</span>
            <span>Nombre científico</span>
            <span>Familia</span>
            <span>Densidad</span>
            <span>Janka</span>
            <span>Stock</span>
          </div>

          {visibles.map((m) => (
            <a
              href={`/catalogo/${m.slug}`}
              className="catalog-list-row"
              key={m.slug}
            >
              <span>{String(m.xiloId).padStart(3, '0')}</span>
              <strong>{m.nombre}</strong>
              <em>{m.nombreCientifico}</em>
              <span>{m.familia || '—'}</span>
              <span>{m.densidad ? `${m.densidad} kg/m³` : '—'}</span>
              <span>{m.janka ? `${m.janka} lbf` : '—'}</span>
              <span>{m.stock > 0 ? m.stock : '—'}</span>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
