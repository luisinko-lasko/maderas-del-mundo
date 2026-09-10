const slugify = (text) => text
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

export function inferContinentes(origen = '') {
  const s = origen.toLowerCase();
  const out = new Set();

  if (/(europa|españa|portugal|francia|italia|grecia|alemania|polonia|balcan|alpes|pirine|cárpat|carpat|reino unido)/i.test(s)) out.add('Europa');
  if (/(áfrica|africa|marruecos|ghana|costa de marfil|nigeria|camerún|camerun|gabón|gabon|congo|uganda|tanzania|angola|guinea ecuatorial|kenia|zambia|malawi|mozambique)/i.test(s)) out.add('África');
  if (/(américa|america|ee\. ?uu\.|estados unidos|canadá|canada|brasil|paraguay|argentina|venezuela|colombia|guayana|california|norteamérica|norteamerica|sudamérica|sudamerica|amazon)/i.test(s)) out.add('América');
  if (/(asia|china|turquía|turquia|líbano|libano|siria|india|indonesia)/i.test(s)) out.add('Asia');
  if (/(oceanía|oceania|australia|nueva zelanda|papúa|papua)/i.test(s)) out.add('Oceanía');

  return [...out];
}

const raw = [
  {xilo:1,nombre:'Nogal americano',eng:'Black walnut',otros:null,botanico:'Juglans nigra',familia:'Juglandaceae',densidad:610,grano:null,monnin:null,brinell:null,jankaLbf:1010,jankaN:4490,dureza:'Semidura',chalais:null,precioM3:5000,origen:'Este de EE. UU.; algo de sur de Canadá.'},
  {xilo:2,nombre:'Pino marítimo',eng:'Maritime Pine',otros:'Pino gallego, pino pinaster, pino landas',botanico:'Pinus pinaster',familia:'Pinaceae',densidad:530,grano:null,monnin:2.45,brinell:null,jankaLbf:390,jankaN:1740,dureza:'Muy blanda',chalais:null,precioM3:null,origen:'Suroeste de Europa: Portugal, España, Francia atlántica/Landas; también Marruecos.'},
  {xilo:3,nombre:'Iroko',eng:'Iroko',otros:'Abang, kambala',botanico:'Milicia excelsa, Milicia regia',familia:'Moraceae',densidad:650,grano:'F',monnin:4,brinell:'60',jankaLbf:1260,jankaN:5610,dureza:'Semidura',chalais:4,precioM3:1500,origen:'África tropical occidental, central y parte oriental: Ghana, Costa de Marfil, Nigeria, Camerún, Gabón, Congo, RDC, Uganda y Tanzania.'},
  {xilo:4,nombre:'Mongoy',eng:'Ovangkol',otros:null,botanico:'Guibourtia ehie',familia:'Fabaceae',densidad:820,grano:'F',monnin:7.6,brinell:'28–35',jankaLbf:1330,jankaN:null,dureza:'Dura',chalais:7.6,precioM3:null,origen:'África occidental y central: Ghana, Costa de Marfil, Nigeria, Camerún, Gabón, Guinea Ecuatorial.'},
  {xilo:5,nombre:'Palo rojo',eng:'African Padauk, Vermillion',otros:null,botanico:'Pterocarpus soyauxii',familia:'Fabaceae',densidad:745,grano:null,monnin:null,brinell:null,jankaLbf:1970,jankaN:8760,dureza:'Dura',chalais:null,precioM3:null,origen:'África occidental y central tropical: Camerún, Gabón, Congo, RDC, Nigeria, Angola.'},
  {xilo:6,nombre:'Sucupira',eng:'Sucupira',otros:null,botanico:'Diplotropis purpurea',familia:'Fabaceae',densidad:910,grano:null,monnin:9.4,brinell:'60',jankaLbf:2140,jankaN:null,dureza:'Muy dura',chalais:null,precioM3:2500,origen:'Norte de Sudamérica/Amazonia: Guayanas, Venezuela, Brasil amazónico, Colombia.'},
  {xilo:7,nombre:'Guatambú',eng:'yvyra ñeti',otros:'vorywood, Marfim, Pau liso, Pau marfim, palo marfil',botanico:'Balfourodendron riedelianum',familia:'Rutaceae',densidad:840,grano:null,monnin:7.3,brinell:'8.1',jankaLbf:2240,jankaN:10000,dureza:'Muy dura',chalais:null,precioM3:null,origen:'Sur de Brasil, Paraguay, noreste de Argentina.'},
  {xilo:8,nombre:'Almendro',eng:'almond tree',otros:null,botanico:'Prunus dulcis, Prunus amygdalus',familia:'Rosaceae',densidad:795,grano:null,monnin:null,brinell:null,jankaLbf:1700,jankaN:null,dureza:'Dura',chalais:null,precioM3:null,origen:'Mediterráneo, España, Italia, Grecia, norte de África; también California. Madera de frutal, no gran comercio forestal.'},
  {xilo:9,nombre:'Olmo',eng:'English Elm, Carpathian Elm',otros:'Olmo europeo',botanico:'Ulmus minor, Ulmus procera',familia:'Ulmaceae',densidad:565,grano:null,monnin:null,brinell:null,jankaLbf:810,jankaN:3620,dureza:'Blanda',chalais:null,precioM3:null,origen:'Europa occidental, central y mediterránea; mucha procedencia de árboles urbanos o derribos por grafiosis.'},
  {xilo:10,nombre:'Manzano',eng:'Apple, Crab Apple, Wild Apple',otros:null,botanico:'Malus spp.',familia:'Rosaceae',densidad:830,grano:null,monnin:null,brinell:null,jankaLbf:1730,jankaN:7700,dureza:'Dura',chalais:null,precioM3:null,origen:'Zonas templadas de Europa, Asia central, China, Norteamérica. Madera de frutal o de huertos.'},
  {xilo:11,nombre:'Abeto blanco',eng:'European silver fir',otros:'Abeto común',botanico:'Abies alba',familia:'Pinaceae',densidad:450,grano:null,monnin:2.5,brinell:null,jankaLbf:320,jankaN:1420,dureza:'Muy blanda',chalais:null,precioM3:null,origen:'Montañas de Europa central y meridional: Alpes, Pirineos, Cárpatos, Balcanes.'},
  {xilo:12,nombre:'Cedro del Líbano',eng:'Cedar of Lebanon',otros:'Cedro de Salomón',botanico:'Cedrus libani',familia:'Pinaceae',densidad:520,grano:null,monnin:null,brinell:null,jankaLbf:820,jankaN:3670,dureza:'Blanda',chalais:null,precioM3:null,origen:'Mediterráneo oriental: Turquía, Líbano, Siria; hoy procedencia muy limitada, más ornamental o de plantaciones.'}
];

export const maderas = raw.map((m) => ({
  ...m,
  slug: slugify(m.nombre),
  codigo: `XILO-${String(m.xilo).padStart(4, '0')}`,
  continentes: inferContinentes(m.origen)
}));

export const bySlug = (slug) => maderas.find((m) => m.slug === slug);
