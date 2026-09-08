export const maderas = [
  {
    slug: 'nogal-europeo', codigo: 'MR-001', nombre: 'Nogal europeo', botanico: 'Juglans regia', origen: 'Europa y Asia occidental',
    tono: 'Chocolate profundo', densidad: '640 kg/m³', dureza: 'Media', stock: 23, precio: 14,
    descripcion: 'Una madera sobria y cálida, apreciada por el contraste entre albura y duramen y por una veta que puede pasar de serena a extraordinariamente expresiva.',
    curiosidad: 'Durante siglos fue una de las maderas predilectas para mobiliario fino, culatas e interiores de calidad.',
    featured: true
  },
  {
    slug: 'olivo', codigo: 'MR-002', nombre: 'Olivo', botanico: 'Olea europaea', origen: 'Cuenca mediterránea',
    tono: 'Miel y veta oscura', densidad: '850 kg/m³', dureza: 'Alta', stock: 31, precio: 12,
    descripcion: 'Compacta, aromática y de dibujo intenso. Cada muestra tiene un carácter distinto, con líneas oscuras sobre una base dorada.',
    curiosidad: 'El árbol puede vivir siglos; su madera suele proceder de podas, renovaciones o ejemplares improductivos.',
    featured: true
  },
  {
    slug: 'zebrano', codigo: 'MR-003', nombre: 'Zebrano', botanico: 'Microberlinia bisulcata', origen: 'África occidental',
    tono: 'Crema con líneas negras', densidad: '790 kg/m³', dureza: 'Alta', stock: 12, precio: 18,
    descripcion: 'Una de las maderas más gráficas de la colección. Su veta longitudinal crea bandas oscuras que recuerdan al patrón de una cebra.',
    curiosidad: 'Su apariencia cambia mucho según el corte, por lo que dos muestras próximas pueden parecer piezas distintas.',
    featured: true
  },
  {
    slug: 'arce-rizado', codigo: 'MR-004', nombre: 'Arce rizado', botanico: 'Acer saccharum', origen: 'Norteamérica',
    tono: 'Marfil luminoso', densidad: '705 kg/m³', dureza: 'Media-alta', stock: 18, precio: 16,
    descripcion: 'El dibujo rizado no es una especie, sino una figura de la fibra que refracta la luz y parece moverse al inclinar la pieza.',
    curiosidad: 'Muy buscado en instrumentos musicales por su efecto visual tridimensional.',
    featured: false
  },
  {
    slug: 'padouk', codigo: 'MR-005', nombre: 'Padouk africano', botanico: 'Pterocarpus soyauxii', origen: 'África central y occidental',
    tono: 'Rojo coral', densidad: '745 kg/m³', dureza: 'Alta', stock: 9, precio: 17,
    descripcion: 'Recién cortado puede mostrar un rojo casi eléctrico que con el tiempo evoluciona hacia tonos más oscuros y terrosos.',
    curiosidad: 'Su oxidación natural permite observar cómo el color de una madera continúa cambiando después de trabajada.',
    featured: false
  },
  {
    slug: 'ebano-macassar', codigo: 'MR-006', nombre: 'Ébano de Macassar', botanico: 'Diospyros celebica', origen: 'Indonesia',
    tono: 'Negro y marrón', densidad: '1100 kg/m³', dureza: 'Muy alta', stock: 5, precio: 28,
    descripcion: 'Densa, fina y espectacular. Alterna franjas oscuras casi negras con marrones profundos, creando una superficie de gran presencia.',
    curiosidad: 'Su elevada densidad permite que una muestra pequeña tenga un peso sorprendente en la mano.',
    featured: true
  }
];

export const bySlug = (slug) => maderas.find(m => m.slug === slug);
