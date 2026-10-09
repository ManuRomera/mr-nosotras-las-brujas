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
<p><strong>MR- Nosotras, las brujas</strong> lleva el ritual del juego a Foundry: mazos de arcanos, escena con concepto, sospechas boca abajo, Laudes y las inversiones de La Jueza.</p>
<ol>
<li><strong>Cread las Hermanas.</strong> Cada jugadora crea un Actor de tipo <em>Hermana</em> (o se lo asigna la Jueza). En la ficha se responden las frases de la hoja, los vínculos con los diecinueve arcanos y la relación con la acusada.</li>
<li><strong>Preparad el pueblo.</strong> El Actor <em>Pueblo</em> guarda lo que une al grupo, el refugio y quién acusa a la cautiva. Los PNJ se crean con tipo <em>PNJ</em>: basta un arcano, un papel y un descriptor.</li>
<li><strong>La Jueza abre el tracker</strong> (botón en el directorio de Actores o en la barra de herramientas de la escena). Ahí están la fase, la escena en marcha, las inversiones, los robos y el recuento.</li>
<li><strong>Mazo y robo:</strong> al entrar en la partida se crean solos los mazos de Arcanos Mayores y Menores. La Jueza define el <em>objetivo, el lugar y los PNJ</em> de la escena, roba un Mayor para el concepto y, al terminar, roba dos Menores a cada Hermana <em>con límite de robos</em> (por defecto dos).</li>
<li><strong>Escena compartida:</strong> cada Hermana roba su Mayor. El número más alto es el concepto dominante; el segundo, el PNJ. En empate de máximo mandan todas las empatadas.</li>
<li><strong>Laudes</strong> revela las sospechas boca abajo, suma por Hermana —las entregadas suman a quien las recibe— y acusa al máximo (con empate, a todas). Las acusadas quedan anotadas en la partida y se ven en el tracker.</li>
<li><strong>La Jueza</strong> puede invertir un concepto (una vez por carta y por partida, sin recuperar), echar mano del dado de 1 a 6 y leer el dado de las ayudas en el chat.</li>
<li><strong>Ajustes del sistema:</strong> valores de las figuras (sota, caballero, dama y rey), quién recibe los menores robados, robos por Hermana y tamaño de letra. Los cambios los hace el GM.</li>
<li><strong>Memoria de ventanas:</strong> las fichas recuerdan posición, tamaño y secciones plegadas. <em>Configuración → Memoria de ventanas → Olvidar posiciones</em> si algo queda fuera de sitio.</li>
</ol>
<p>Todo el sistema está en español y las tiradas de dados y demás usos del dado son <em>tu partido, tus reglas</em>: pregúntalo si dudas de algo marcado a verificar.</p>
</div>`;

const vin = `<div class="nb-manual">
<p>Rellena el hueco con el nombre de la Hermana a quien corresponda el vínculo (R 22). En la ficha, al elegir el arcano en un vínculo, esta pregunta se rellena sola.</p>
${filas(["Arcano", "Vínculos"], ARCANOS.map(a => [romanoCorto(a), PREGUNTAS_VINCULO[a.romano].replace(/____/g, "<em>________</em>")]))}
</div>`;

const pos = `<div class="nb-manual">
<p>Concepto positivo · carta normal (lo que aporta la escena cuando no está invertida).</p>
${filas(["Arcano", "Concepto"], ARCANOS.map(a => [romanoCorto(a), a.pos]))}
</div>`;

const neg = `<div class="nb-manual">
<p>Concepto negativo · carta invertida (concepto de dirección cuando la Jueza la invierte, R 66–69).</p>
${filas(["Arcano", "Concepto"], ARCANOS.map(a => [romanoCorto(a), a.neg]))}
</div>`;

const arq = `<div class="nb-manual">
<p>El arcano escogido para la escena sugiere el arquetipo de los PNJ que aparecen en ella (R 24).</p>
${filas(["Arcano", "Arquetipo"], ARCANOS.map(a => [romanoCorto(a), a.arquetipo]))}
</div>`;

const fases = `<div class="nb-manual">
<p>La partida avanza por las fases del día; la Jueza las cambia en el tracker y cada cambio se anuncia en el chat.</p>
${filas(["Fase", "Qué toca"], ORDEN_FASES.map(k => [FASES[k]?.nombre ?? k, FASES[k]?.desc ?? ""]))}
<p>Los marcadores de fase (La Estrella, El Sol y La Luna) no son cartas del mazo: acompañan a las fases desde el tracker.</p>
${filas(["Marcador", "Fases", "Romano"], Object.values(MARCADORES).map(m => [m.nombre, m.fases.join(", "), m.romano]))}
<p>Los arcanos menores se reparten por pintas: ${Object.entries(PINTAS).map(([k, v]) => `${v} (${k})`).join(", ")}.</p>
</div>`;

const d6 = `<div class="nb-manual">
<p>Dado opcional de La Jueza (R 72–73): añade un giro a lo que ocurre. Se tira con <em>1d6</em> desde el tracker.</p>
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
  name: "NB · Ayudas de juego",
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
