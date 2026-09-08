import Link from 'next/link';
import { maderas } from '../../lib/maderas';
export default function Admin(){const total=maderas.reduce((s,m)=>s+m.stock,0);return <main className="admin-page">
 <aside className="admin-side"><div className="brand-mark admin-logo">MR</div><strong>Administración</strong><nav><span className="active">Inventario</span><span>Catálogo</span><span>Pedidos</span><span>Usuarios</span><span>Códigos</span></nav><Link href="/">← Web pública</Link></aside>
 <section className="admin-main"><div className="admin-top"><div><div className="page-eyebrow">Back office / demo</div><h1>Inventario</h1></div><button className="button dark">+ Nueva madera</button></div>
 <div className="admin-stats"><div><span>Unidades totales</span><strong>{total}</strong></div><div><span>Especies</span><strong>{maderas.length}</strong></div><div><span>Stock bajo</span><strong>2</strong></div></div>
 <div className="table"><div className="tr th"><span>Código</span><span>Especie</span><span>Stock</span><span>Precio</span><span></span></div>{maderas.map(m=><div className="tr" key={m.slug}><span>{m.codigo}</span><span><strong>{m.nombre}</strong><em>{m.botanico}</em></span><span className={m.stock<10?'low':''}>{m.stock}</span><span>{m.precio} €</span><Link href={`/catalogo/${m.slug}`}>Ver ficha ↗</Link></div>)}</div>
 </section>
</main>}
