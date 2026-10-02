import Link from 'next/link';

export default function About(){
  return (
    <main className="about-story">
      <section className="about-hero">
        <div className="about-hero-copy">
          <div className="page-eyebrow">Asociación Maderas del Mundo / Madrid</div>
          <h1>Coleccionar la madera<br/>para entenderla mejor.</h1>
          <p className="about-lead">
            Somos una asociación dedicada al coleccionismo, la divulgación y el disfrute
            de la diversidad de maderas del mundo. Reunimos pequeñas piezas físicas,
            identificadas y comparables, para que cada especie pueda mirarse de cerca.
          </p>
          <div className="about-hero-actions">
            <Link href="/catalogo" className="button dark">Explorar el catálogo</Link>
            <a href="mailto:contacto@maderasdelmundo.es" className="text-link">Escribir antes de visitarnos →</a>
          </div>
        </div>

        <div className="about-hero-specimen" aria-label="Ejemplo de grabado de una pieza de Palosanto India">
          <div className="about-label-card">
            <div className="about-label-main">Palosanto India</div>
            <div className="about-label-latin">Dalbergia latifolia</div>
            <div className="about-label-data">855–2350</div>
            <div className="about-label-number">#59</div>
          </div>
          <div className="about-hero-caption">Ejemplo de identificación grabada en una pieza</div>
        </div>
      </section>

      <section className="about-band about-association">
        <div className="section-number">01</div>
        <div>
          <div className="page-eyebrow">La asociación</div>
          <h2>Una colección viva,<br/>hecha para aficionados.</h2>
        </div>
        <div className="about-copy">
          <p>
            Maderas del Mundo nace con una idea sencilla: acercar la variedad de la madera
            a cualquiera que tenga curiosidad por ella. No pretendemos sustituir una xiloteca
            científica; queremos crear una colección accesible, agradable de manejar y que
            invite a comparar especies.
          </p>
          <p>
            Nuestro catálogo irá creciendo poco a poco. Algunas especies estarán disponibles
            durante mucho tiempo y otras aparecerán en series pequeñas. Por eso siempre habrá
            novedades.
          </p>
        </div>
      </section>

      <section className="about-market">
        <div>
          <div className="section-number">02</div>
          <div className="page-eyebrow">También en persona</div>
          <h2>Nos puedes visitar<br/>en el mercado.</h2>
        </div>
        <div className="about-market-copy">
          <p>
            Tenemos presencia en el Mercado de Nápoles, en Madrid, y nos encanta enseñar las
            piezas, hablar de especies y conocer a otros aficionados.
          </p>
          <p>
            Como no siempre estamos físicamente en el puesto, lo mejor es escribirnos antes
            de venir. Así podemos confirmarte que habrá alguien y evitarte un viaje en balde.
          </p>
          <a href="mailto:contacto@maderasdelmundo.es" className="button light">contacto@maderasdelmundo.es</a>
        </div>
      </section>

      <section className="about-piece-section">
        <div className="about-section-head">
          <span>03 / La pieza</span>
          <p>Un formato pequeño, pero suficiente para ver, tocar y comparar.</p>
        </div>

        <div className="about-piece-grid">
          <div className="about-piece-copy">
            <h2>10 × 5 × 1,2 cm.<br/><em>Aproximadamente.</em></h2>
            <p>
              Ese es nuestro formato de referencia. Las medidas pueden variar ligeramente
              según la especie y la pieza concreta: la madera es un material natural y no
              buscamos convertirla en un producto industrial idéntico al milímetro.
            </p>
            <p>
              Las piezas se preparan siempre <strong>a veta</strong>, de forma que la cara
              principal muestre de la manera más clara posible el dibujo y la estructura
              característica de la madera.
            </p>
          </div>

          <div className="piece-diagram" aria-label="Diagrama de una pieza de 10 por 5 por 1,2 centímetros">
            <div className="piece-board"></div>
            <div className="dim dim-length"><span>10 cm aprox.</span></div>
            <div className="dim dim-width"><span>5 cm aprox.</span></div>
            <div className="dim dim-thickness"><span>1,2 cm aprox.</span></div>
            <div className="grain-note">dirección de la veta →</div>
          </div>
        </div>
      </section>

      <section className="about-cuts">
        <div className="about-section-head">
          <span>04 / Cómo se corta</span>
          <p>La orientación del corte cambia por completo la apariencia de una misma madera.</p>
        </div>

        <div className="cuts-title-row">
          <h2>Los tres cortes<br/>de la madera.</h2>
          <p>
            Cuando hablamos de testa, radial o tangencial no hablamos de tres maderas distintas:
            son tres planos diferentes respecto al crecimiento del árbol.
          </p>
        </div>

        <div className="about-infographic about-infographic-wide">
          <img src="/images/about-cortes.jpg" alt="Esquema de los cortes transversal, radial y tangencial de la madera" />
        </div>
      </section>

      <section className="about-engraving">
        <div className="section-number">05</div>
        <div className="about-engraving-intro">
          <div className="page-eyebrow">Cada pieza se identifica</div>
          <h2>La información<br/>viaja con la madera.</h2>
          <p>
            El grabado permite reconocer la pieza incluso fuera de la caja o del expositor.
            La información es deliberadamente breve: lo esencial en la madera; el resto,
            en su ficha digital.
          </p>
        </div>

        <div className="engraving-sample">
          <div className="engraving-board">
            <span className="e-common">Palosanto India</span>
            <span className="e-latin">Dalbergia latifolia</span>
            <span className="e-values">855–2350</span>
            <span className="e-number">#59</span>
          </div>
          <div className="engraving-key">
            <div><span>01</span><strong>Nombre común</strong><small>El nombre con el que solemos conocer la especie.</small></div>
            <div><span>02</span><strong>Nombre científico</strong><small>La referencia botánica que evita ambigüedades.</small></div>
            <div><span>03</span><strong>Densidad</strong><small>Indicada en kg/m³.</small></div>
            <div><span>04</span><strong>Dureza Janka</strong><small>Valor comparativo de resistencia a la penetración.</small></div>
            <div><span>05</span><strong>Referencia</strong><small>Número de la especie dentro de nuestra colección.</small></div>
          </div>
        </div>
      </section>

      <section className="about-properties">
        <div className="property-block density-block">
          <div className="property-number">06A</div>
          <div>
            <div className="page-eyebrow">Densidad</div>
            <h2>¿Flota<br/>o se hunde?</h2>
          </div>
          <div className="property-copy">
            <p>
              La densidad indica cuánta masa hay en un determinado volumen de madera y se
              expresa normalmente en <strong>kg/m³</strong>. Como referencia fácil de recordar,
              el agua tiene una densidad aproximada de <strong>1000 kg/m³</strong>.
            </p>
            <p>
              Una madera con densidad inferior a ese valor tiende a flotar; si lo supera,
              puede hundirse. La cifra depende de la humedad y de la pieza concreta, por eso
              debe entenderse como un valor orientativo.
            </p>
          </div>

          <div className="about-infographic">
            <img src="/images/about-densidad.jpg" alt="Comparación de densidad con el agua usando Secuoya roja número 56 y Quebracho rojo número 48" />
          </div>
          <p className="property-footnote">
            Dos ejemplos de nuestra colección: <strong>Secuoya roja (#56)</strong>, con una densidad
            de 415 kg/m³, y <strong>Quebracho rojo (#48)</strong>, con 1235 kg/m³. No existe un único
            valor absoluto: cambia con la especie, la humedad y la muestra medida.
          </p>
        </div>

        <div className="property-block janka-block">
          <div className="property-number">06B</div>
          <div>
            <div className="page-eyebrow">Dureza Janka</div>
            <h2>Cuánta fuerza<br/>resiste.</h2>
          </div>
          <div className="property-copy">
            <p>
              El ensayo Janka compara la resistencia de la madera a la indentación. Se mide la
              fuerza necesaria para introducir una bola de acero de <strong>11,28 mm</strong> de
              diámetro hasta la mitad de su diámetro.
            </p>
            <p>
              El resultado puede expresarse en <strong>newtons (N)</strong> o en libras-fuerza
              (lbf). Cuanto mayor es el valor, mayor es la resistencia a la penetración.
            </p>
          </div>

          <div className="about-infographic">
            <img src="/images/about-janka.jpg" alt="Esquema del ensayo Janka con ejemplos de Abeto blanco número 11, Palosanto India número 59 y Quebracho rojo número 48" />
          </div>
          <p className="property-footnote">
            En nuestra colección, por ejemplo, el <strong>Abeto blanco (#11)</strong> tiene 320 lbf
            (≈ 1423 N), el <strong>Palosanto de la India (#59)</strong> 2350 lbf (≈ 10453 N) y el
            <strong> Quebracho rojo (#48)</strong> 4570 lbf (≈ 20328 N).
          </p>
        </div>
      </section>

      <section className="about-legal">
        <div className="section-number">07</div>
        <div>
          <div className="page-eyebrow">Legalidad · trazabilidad · CITES</div>
          <h2>Conocer el origen<br/>también forma parte<br/>de la colección.</h2>
        </div>
        <div className="about-legal-copy">
          <p>
            Trabajamos exclusivamente con madera de procedencia legal y trazable. Queremos que
            una pieza sea interesante por lo que cuenta de la especie, no por tener un origen dudoso.
          </p>
          <p>
            CITES es la Convención sobre el Comercio Internacional de Especies Amenazadas de Fauna
            y Flora Silvestres. Algunas especies de madera están incluidas en sus apéndices y su
            comercio internacional está sujeto a controles y documentación específicos.
          </p>
          <p>
            Cuando una especie está afectada por CITES, pedimos la documentación de procedencia
            que corresponda antes de incorporarla a la colección. Legalidad y trazabilidad no son
            un añadido: forman parte del criterio con el que seleccionamos la madera.
          </p>
          <p>
            <a href="https://cites.org/esp" target="_blank" rel="noreferrer" className="about-cites-link">
              Más información en la web oficial de CITES →
            </a>
          </p>

          <div className="legal-steps">
            <div><span>01</span><strong>Origen conocido</strong></div>
            <div><span>02</span><strong>Documentación</strong></div>
            <div><span>03</span><strong>Trazabilidad</strong></div>
          </div>
        </div>
      </section>

      <section className="about-closing">
        <div className="page-eyebrow">Una colección que seguirá cambiando</div>
        <h2>Siempre habrá<br/>otra madera por descubrir.</h2>
        <div>
          <p>
            El catálogo no pretende cerrarse nunca. Iremos incorporando especies conforme
            encontremos material adecuado, legal y suficientemente representativo.
          </p>
          <Link href="/catalogo" className="button dark">Ver las especies disponibles</Link>
        </div>
      </section>
    </main>
  );
}
