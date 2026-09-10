import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function limpiarNombreCientifico(nombre = '') {
  return nombre
    .split(',')[0]
    .replace(/\bspp\.?\b/gi, '')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

function sqlEscape(valor) {
  if (valor === null || valor === undefined) return 'NULL';
  return `'${String(valor).replaceAll("'", "''")}'`;
}

function limpiarHtml(valor = '') {
  return valor
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function buscarEnCommons(madera) {
  const cientifico = limpiarNombreCientifico(madera.nombre_cientifico);

  const otros = (madera.otros_nombres || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
    .slice(0, 3);

  const ingleses = (madera.nombre_ingles || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
    .slice(0, 3);

  const consultas = [
    `${cientifico} wood`,
    `${cientifico} timber`,
    `${cientifico} lumber`,
    `${cientifico} xylotheque`,
    `${cientifico} bois`,
    `${cientifico}`,
    `${madera.nombre} wood`,
    `${madera.nombre}`,
    ...ingleses.map(x => `${x} wood`),
    ...ingleses,
    ...otros.map(x => `${x} wood`),
    ...otros
  ].filter(Boolean);

  const vistas = new Set();

  for (const consulta of consultas) {
    if (vistas.has(consulta.toLowerCase())) continue;
    vistas.add(consulta.toLowerCase());

    await new Promise(resolve => setTimeout(resolve, 650));

    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: consulta,
      gsrnamespace: '6',
      gsrlimit: '10',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '1200',
      format: 'json',
      origin: '*'
    });

    let respuesta = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params}`,
      { headers: { 'User-Agent': 'MaderasDelMundo/0.1' } }
    );

    if (respuesta.status === 429) {
      console.log(' [esperando]');
      await new Promise(resolve => setTimeout(resolve, 12000));

      respuesta = await fetch(
        `https://commons.wikimedia.org/w/api.php?${params}`,
        { headers: { 'User-Agent': 'MaderasDelMundo/0.1' } }
      );
    }

    if (!respuesta.ok) continue;

    const json = await respuesta.json();
    const paginas = Object.values(json.query?.pages || {});

    if (!paginas.length) continue;

    const palabrasMadera =
      /wood|timber|bois|holz|legno|madeira|madera|xyloth|lumber|grain|veneer|plank|board/i;

    const ordenadas = [...paginas].sort((a, b) => {
      const aScore = palabrasMadera.test(a.title) ? 1 : 0;
      const bScore = palabrasMadera.test(b.title) ? 1 : 0;
      return bScore - aScore;
    });

    const pagina = ordenadas.find(
      p => p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url
    );

    if (!pagina) continue;

    const info = pagina.imageinfo[0];
    const meta = info.extmetadata || {};

    return {
      imagen_url: info.thumburl || info.url,
      imagen_commons_page:
        `https://commons.wikimedia.org/wiki/${encodeURIComponent(
          pagina.title.replaceAll(' ', '_')
        )}`,
      imagen_fuente:
        limpiarHtml(meta.Credit?.value || '') || 'Wikimedia Commons',
      imagen_autor:
        limpiarHtml(meta.Artist?.value || ''),
      imagen_licencia:
        meta.LicenseShortName?.value ||
        meta.License?.value ||
        ''
    };
  }

  return null;
}

const { data: maderas, error } = await supabase
  .from('maderas')
  .select(`
    xilo_id,
    nombre,
    nombre_ingles,
    otros_nombres,
    nombre_cientifico,
    imagen_url
  `)
  .eq('publicada', true)
  .is('imagen_url', null)
  .order('xilo_id');

if (error) {
  console.error(error);
  process.exit(1);
}

console.log(`Pendientes sin imagen: ${maderas.length}`);
console.log('');

const resultados = [];
const fallidas = [];

for (let i = 0; i < maderas.length; i++) {
  const madera = maderas[i];

  process.stdout.write(
    `[${i + 1}/${maderas.length}] #${madera.xilo_id} ${madera.nombre}... `
  );

  try {
    const imagen = await buscarEnCommons(madera);

    if (imagen) {
      resultados.push({
        xilo_id: madera.xilo_id,
        nombre: madera.nombre,
        ...imagen
      });
      console.log('OK');
    } else {
      fallidas.push(madera);
      console.log('SIN RESULTADO');
    }
  } catch (e) {
    fallidas.push(madera);
    console.log('ERROR');
  }
}

let sql = `-- Segunda pasada automática de imágenes Wikimedia Commons\n\n`;

for (const r of resultados) {
  sql += `
-- ${r.xilo_id} · ${r.nombre}
update public.maderas
set
  imagen_url = ${sqlEscape(r.imagen_url)},
  imagen_commons_page = ${sqlEscape(r.imagen_commons_page)},
  imagen_fuente = ${sqlEscape(r.imagen_fuente)},
  imagen_autor = ${sqlEscape(r.imagen_autor)},
  imagen_licencia = ${sqlEscape(r.imagen_licencia)},
  imagen_verificada = false
where xilo_id = ${r.xilo_id}
  and imagen_url is null;
`;
}

fs.writeFileSync('imagenes-commons.sql', sql);

fs.writeFileSync(
  'imagenes-sin-encontrar.txt',
  fallidas
    .map(m => `${m.xilo_id}\t${m.nombre}\t${m.nombre_cientifico || ''}`)
    .join('\n')
);

console.log('');
console.log(`Encontradas nuevas: ${resultados.length}`);
console.log(`Siguen sin imagen: ${fallidas.length}`);
console.log('');
console.log('Creado: imagenes-commons.sql');
console.log('Creado: imagenes-sin-encontrar.txt');
