import { maderas } from '../../lib/maderas';
export default function Coleccion(){
 const owned = [maderas[0],maderas[1],maderas[3],maderas[5]];
 return <main className="page-shell dashboard">
   <div className="dashboard-head"><div><div className="page-eyebrow">Área personal / demo</div><h1>Mi colección</h1></div><div className="user-chip">LR</div></div>
   <div className="summary-cards"><div><strong>4</strong><span>maderas</span></div><div><strong>67%</strong><span>serie inicial</span></div><div><strong>2</strong><span>por descubrir</span></div></div>
   <div className="collection-list">
    {owned.map((m,i)=><div className="collection-row" key={m.slug}><span className={`mini-sample wood-${i}`}></span><div><strong>{m.nombre}</strong><em>{m.botanico}</em></div><span>{m.codigo}</span><span className="owned">En colección ✓</span></div>)}
   </div>
   <div className="add-code"><div><span>Añadir una pieza física</span><h2>¿Has comprado una muestra en persona?</h2><p>En una versión posterior podrás introducir o escanear el código de tu pieza y añadirla a tu colección.</p></div><div className="fake-input">MR-____ <button>Validar</button></div></div>
 </main>
}
