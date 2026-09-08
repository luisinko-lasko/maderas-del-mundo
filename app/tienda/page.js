import { maderas } from '../../lib/maderas';
export default function Tienda(){return <main className="page-shell">
 <div className="shop-head"><div><div className="page-eyebrow">Tienda / Draft</div><h1>Piezas para empezar,<br/>continuar o regalar.</h1></div><div className="draft-badge">DRAFT · SIN PAGO REAL</div></div>
 <div className="products">
   <div className="product-card pack"><div className="pack-visual"><i></i><i></i><i></i><i></i><i></i></div><h2>Serie inicial · 6 especies</h2><p>La primera selección completa en un único conjunto.</p><div><strong>89 €</strong><button>Próximamente</button></div></div>
   {maderas.slice(0,3).map((m,i)=><div className="product-card" key={m.slug}><div className={`product-wood wood-${i}`}></div><h2>{m.nombre}</h2><p>{m.codigo} · muestra individual</p><div><strong>{m.precio} €</strong><button>Próximamente</button></div></div>)}
 </div>
</main>}
