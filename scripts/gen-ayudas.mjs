/** Genera _data/ayudas.json a partir de module/listas.mjs (npm run build). */
import fs from "node:fs/promises";
const L = await import("../module/listas.mjs");
const { ARCANOS, MARCADORES, FASES, ORDEN_FASES, PREGUNTAS_VINCULO, PINTAS } = L;

const filas = (cols, rows) =>
  `<table><thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${
    rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")
  }</tbody></table>`;

const romano = a => (a.romano ? `${a.romano} · ` : "") + a.nombre;
const romanoCorto = a => `${a.romano ? `(${a.romano}) ` : ""}${a.nombre}`;

const guia = `<div class="nb-manual">
<p><strong>MR- Nosotras, las brujas</strong> lleva el ritual del juego a Foundry: los mazos de arcanos, la escena con su concepto, las sospechas boca abajo, Laudes y las inversiones de La Jueza. Es una ayuda para la mesa: <em>hace falta el manual del juego</em> para jugarlo.</p>
<ol>
<li><strong>Cread las fichas.</strong> Cada jugadora crea un Actor de tipo <em>Hermana</em>: frases de la hoja, vínculos con arcanos y notas. El Actor <em>Pueblo</em> guarda lo que une al grupo, el refugio y quién acusa a la cautiva. Los <em>PNJ</em> necesitan un arcano, un papel y un descriptor.</li>
<li><strong>La mesa de La Jueza</strong> ocupa toda la pantalla sobre la escena de fondo: arriba la tira de las siete horas y, justo debajo, <em>Ahora</em>, lo siguiente que conviene hacer, con su botón. A la izquierda están las Hermanas, en el centro las cartas de la escena, a la derecha las sospechas y abajo las herramientas. El ojo la oculta y la pastilla «La mesa» la recupera.</li>
<li><strong>Prima:</strong> «Sortear vínculos» reparte arcanos distintos a los vínculos vacíos y dice quién empieza. «Recuerdo» pone una cuenta atrás de diez minutos.</li>
<li><strong>Escena:</strong> abre la escena con objetivo, lugar y PNJ; elige quién actúa; roba el Mayor de cada Hermana. El concepto dominante es el del número más alto y el segundo da el PNJ o la actitud. Al terminar se devuelven los Mayores y se roban las sospechas.</li>
<li><strong>Sospechas:</strong> cada Hermana roba dos en total, con límite ajustable. La primera se conserva y la segunda se entrega boca abajo a otra Hermana, que la mesa propone y tú puedes cambiar.</li>
<li><strong>Laudes</strong> revela las sospechas, suma por Hermana —las entregadas suman a quien las recibe— y acusa al máximo; con empate, a todas. Si falta alguien por robar, la mesa avisa antes.</li>
<li><strong>Final:</strong> «Publicar sentencia» deja en el chat las acusadas y recuerda que salvar a la cautiva no cancela la nueva acusación.</li>
<li><strong>La Jueza</strong> puede invertir un concepto (una vez por carta, tantas veces como Hermanas, sin recuperarlas) y usar el dado de 1 a 6 cuando quiera un giro.</li>
<li><strong>Seguridad:</strong> la partida trata de persecución y ejecución. El botón <em>Seguridad</em> abre Pausa, Velo y Tarjeta X —anónimas, a toda la mesa— y las líneas y velos acordados.</li>
<li><strong>Cada persona, a su gusto:</strong> icono de accesibilidad en la cabecera de las ventanas (texto, contraste, modo oscuro, movimiento) y sonido ambiente en los ajustes. Las ventanas recuerdan su posición; <em>Olvidar posiciones</em> en los ajustes las recoloca.</li>
<li><strong>Tutorial guiado:</strong> Configuración → Tutorial guiado (o Configuración → Tours) te lleva paso a paso por la mesa, las fichas y las cartas. Hay uno para quien dirige y otro para las Hermanas.</li>
<li><strong>Si algo falla:</strong> <em>Comprobar el sistema</em> en los ajustes revisa mazos, imágenes y partida, y deja un informe para copiar.</li>
</ol>
</div>`;

const vin = `<div class="nb-manual">
<p>Rellena el hueco con el nombre de la Hermana a quien corresponda el vínculo. En la ficha, al elegir el arcano en un vínculo, esta pregunta se rellena sola.</p>
${filas(["Arcano", "Vínculos"], ARCANOS.map(a => [romanoCorto(a), PREGUNTAS_VINCULO[a.romano].replace(/____/g, "<em>________</em>")]))}
</div>`;

const pos = `<div class="nb-manual">
<p>Concepto positivo · carta normal (lo que aporta la escena cuando no está invertida).</p>
${filas(["Arcano", "Concepto"], ARCANOS.map(a => [romanoCorto(a), a.pos]))}
</div>`;

const neg = `<div class="nb-manual">
<p>Concepto negativo · carta invertida (concepto de dirección cuando la Jueza la invierte).</p>
${filas(["Arcano", "Concepto"], ARCANOS.map(a => [romanoCorto(a), a.neg]))}
</div>`;

const arq = `<div class="nb-manual">
<p>El arcano escogido para la escena sugiere el arquetipo de los PNJ que aparecen en ella.</p>
${filas(["Arcano", "Arquetipo"], ARCANOS.map(a => [romanoCorto(a), a.arquetipo]))}
</div>`;

const fases = `<div class="nb-manual">
<p>La partida avanza por las fases del día; la Jueza las cambia en la mesa y cada cambio se anuncia en el chat.</p>
${filas(["Fase", "Qué toca"], ORDEN_FASES.map(k => [FASES[k]?.nombre ?? k, FASES[k]?.desc ?? ""]))}
<p>Los marcadores de fase (La Estrella, El Sol y La Luna) no son cartas del mazo: acompañan a las fases desde la mesa.</p>
${filas(["Marcador", "Fases", "Romano"], Object.values(MARCADORES).map(m => [m.nombre, m.fases.join(", "), m.romano]))}
<p>Los arcanos menores se reparten por pintas: ${Object.entries(PINTAS).map(([k, v]) => `${v} (${k})`).join(", ")}.</p>
</div>`;

const d6 = `<div class="nb-manual">
<p>Dado opcional de La Jueza: añade un giro a lo que ocurre. Se tira con <em>1d6</em> desde la mesa.</p>
${filas(["Cara", "Ejemplo"], L.D6.map(d => [d.caras, d.ejemplo]))}
</div>`;

const paginas = [
  ["ayudaPag00000001", "Cómo se usa en Foundry", guia],
  ["ayudaPag00000002", "Tabla de vínculos", vin],
  ["ayudaPag00000003", "Conceptos · jugadoras", pos],
  ["ayudaPag00000004", "Conceptos · directora", neg],
  ["ayudaPag00000005", "Arquetipos para PNJ", arq],
  ["ayudaPag00000006", "Fases del día y marcadores", fases],
  ["ayudaPag00000007", "Dado de 1 a 6", d6]
];

const doc = {
  _id: "ayudasJuego00000",
  name: "Ayudas de juego",
  pages: paginas.map(([id, name, content], i) => ({
    _id: id,
    name,
    type: "text",
    title: { show: true, level: 1 },
    text: { format: 1, content },
    sort: (i + 1) * 1000,
    ownership: { default: -1 }
  }))
};

await fs.writeFile(
  new URL("../_data/ayudas.json", import.meta.url),
  JSON.stringify([doc], null, 1) + "\n"
);
console.log("ayudas.json:", paginas.length, "páginas");
