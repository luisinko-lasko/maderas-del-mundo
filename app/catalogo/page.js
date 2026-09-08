import WoodTile from '../../components/WoodTile';
import { maderas } from '../../lib/maderas';

export default function Catalogo() {
  return <main className="page-shell">
    <div className="page-eyebrow">Catálogo / 001—006</div>
    <div className="catalog-title-row"><h1>La colección</h1><p>Una biblioteca tangible de especies, colores, texturas, pesos y procedencias.</p></div>
    <div className="filter-bar"><span>Todas</span><span>Europa</span><span>África</span><span>América</span><span>Asia</span></div>
    <div className="wood-grid catalog-grid">{maderas.map((m,i)=><WoodTile madera={m} index={i} key={m.slug}/>)}</div>
  </main>;
}
