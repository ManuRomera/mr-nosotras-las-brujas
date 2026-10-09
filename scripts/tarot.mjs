/**
 * Genera las 78 cartas del tarot en SVG (más los tres marcadores de fase, el
 * dorso y la portada del sistema). Tipográficas, sobre papel viejo: se pueden
 * sustituir por el tarot ilustrado conservando los nombres de archivo.
 *
 *   node scripts/tarot.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { ARCANOS, MARCADORES, PINTAS, FIGURAS } from "../module/listas.mjs";

const RAIZ = path.resolve("assets/tarot");
const ANCHO = 900;
const ALTO = 1500;

const PAPEL = "#efe3c8";
const TINTA = "#2b2118";
const ACCENTO = { oros: "#9a7413", copas: "#7a2f4a", espadas: "#3d5a6c", bastos: "#4a6b3a", mayor: "#5b2a6e" };

/** Divide en líneas de como mucho `max` caracteres, repartiendo por igual. */
function partir(texto, max) {
  const palabras = texto.split(" ");
  const lineas = [];
  let actual = "";
  for (const p of palabras) {
    if (!actual) actual = p;
    else if ((actual + " " + p).length <= max) actual += " " + p;
    else { lineas.push(actual); actual = p; }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

/** Marco doble + fondo de papel, base de todas las caras. */
function base({ borde = TINTA, fondo = PAPEL } = {}) {
  return `
  <rect width="${ANCHO}" height="${ALTO}" rx="40" fill="${fondo}"/>
  <rect x="26" y="26" width="${ANCHO - 52}" height="${ALTO - 52}" rx="26" fill="none" stroke="${borde}" stroke-width="6"/>
  <rect x="48" y="48" width="${ANCHO - 96}" height="${ALTO - 96}" rx="16" fill="none" stroke="${borde}" stroke-width="2"/>`;
}

/** Símbolo grande de pinta en el centro de la carta. */
function simbolo(pinta, x, y, t = 1) {
  const c = ACCENTO[pinta] ?? TINTA;
  if (pinta === "oros") return `<g transform="translate(${x} ${y}) scale(${t})" fill="none" stroke="${c}" stroke-width="14"><circle r="110"/><circle r="70"/></g>`;
  if (pinta === "copas") return `<g transform="translate(${x} ${y}) scale(${t})" fill="none" stroke="${c}" stroke-width="14"><path d="M -95 -70 A 95 95 0 0 0 95 -70 Z"/><path d="M 0 25 v 70"/><path d="M -60 105 h 120"/></g>`;
  if (pinta === "espadas") return `<g transform="translate(${x} ${y}) scale(${t})" fill="none" stroke="${c}" stroke-width="14"><path d="M 0 -120 V 70"/><path d="M -70 70 h 140"/><path d="M -28 105 h 56"/><path d="M -14 105 v 30"/></g>`;
  return `<g transform="translate(${x} ${y}) scale(${t})" fill="none" stroke="${c}" stroke-width="14"><path d="M 0 -110 V 110"/><path d="M -55 -55 l 60 40 M 55 -55 l -60 40"/><path d="M -55 55 l 60 -40 M 55 55 l -60 -40"/></g>`;
}

/** Triple luna (doncella, madre, anciana) del dorso y de la portada. */
function tripleLuna(x, y, r, relleno, brillo) {
  return `
  <g transform="translate(${x} ${y})" fill="${relleno}" stroke="${brillo}" stroke-width="6">
    <path d="M ${-r * 2.6} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r * 0.62} ${r * 0.62} 0 1 1 ${-r * 2} 0" transform="translate(${-r * 0.2} 0)"/>
    <circle r="${r}"/>
    <path d="M ${r * 2.6} 0 a ${r} ${r} 0 1 1 ${-r * 2} 0 a ${r * 0.62} ${r * 0.62} 0 1 0 ${r * 2} 0" transform="translate(${r * 0.2} 0)"/>
  </g>`;
}

function svg(cuerpo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO} ${ALTO}" width="${ANCHO}" height="${ALTO}">${cuerpo}</svg>\n`;
}

/** Cara de un arcano mayor: numeral romano arriba, nombre abajo. */
function mayor(a, marcador) {
  const color = ACCENTO.mayor;
  const lineas = partir(a.nombre.toUpperCase(), 15);
  const nombre = lineas.map((l, i) => `<text x="${ANCHO / 2}" y="${ALTO - 250 + i * 86}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="72" fill="${TINTA}">${l}</text>`).join("\n  ");
  const romano = a.romano.length > 4 ? 150 : 190;
  return svg(`${base({ borde: color })}
  <text x="${ANCHO / 2}" y="330" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${romano}" fill="${color}">${a.romano}</text>
  <path d="M 180 430 H ${ANCHO - 180}" stroke="${color}" stroke-width="4"/>
  ${simbolo("mayor", ANCHO / 2, ALTO / 2 + 40, 1)}
  <text x="${ANCHO / 2}" y="${ALTO - 120}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="40" font-style="italic" fill="${TINTA}" opacity="0.75">${marcador ? "Marcador de fase" : "Arcano mayor"}</text>
  ${nombre}`);
}

/** Cara de un arcano menor: número/figura, símbolo y pinta. */
function menor(orden, pinta) {
  const c = ACCENTO[pinta];
  const titulo = orden <= 10 ? String(orden) : FIGURAS[orden];
  return svg(`${base({ borde: c })}
  <text x="${ANCHO / 2}" y="340" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${titulo.length > 4 ? 120 : 220}" fill="${c}">${titulo}</text>
  <path d="M 180 430 H ${ANCHO - 180}" stroke="${c}" stroke-width="4"/>
  ${simbolo(pinta, ANCHO / 2, ALTO / 2 + 40, 1)}
  <text x="${ANCHO / 2}" y="${ALTO - 160}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="76" fill="${TINTA}">${PINTAS[pinta].toUpperCase()}</text>
  <text x="${ANCHO / 2}" y="${ALTO - 90}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="40" font-style="italic" fill="${TINTA}" opacity="0.75">Arcano menor</text>`);
}

/** Dorso: noche violácea con la triple luna y nudo de bruja. */
function dorso() {
  const oro = "#c9a227";
  const nodos = Array.from({ length: 9 }, (_, i) => {
    const y = 140 + i * 160;
    return `<path d="M 90 ${y} q 45 -40 90 0 q 45 40 90 0" fill="none" stroke="${oro}" stroke-width="6" opacity="0.65"/>`;
  }).join("\n  ");
  const nodosD = nodos.replaceAll("M 90 ", `M ${ANCHO - 90} `).replaceAll(" q 45 ", " q -45 ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO} ${ALTO}" width="${ANCHO}" height="${ALTO}">
  <rect width="${ANCHO}" height="${ALTO}" rx="40" fill="#241433"/>
  <rect x="26" y="26" width="${ANCHO - 52}" height="${ALTO - 52}" rx="26" fill="none" stroke="${oro}" stroke-width="6"/>
  <rect x="48" y="48" width="${ANCHO - 96}" height="${ALTO - 96}" rx="16" fill="none" stroke="${oro}" stroke-width="2"/>
  ${nodos}
  ${nodosD}
  ${tripleLuna(ANCHO / 2, ALTO / 2, 110, "#efe3c8", oro)}
  <text x="${ANCHO / 2}" y="${ALTO - 190}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="54" fill="${oro}" letter-spacing="6">NOSOTRAS, LAS BRUJAS</text>
</svg>\n`;
}

/** Portada del sistema: cielo nocturno y título. */
function portada() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
  <defs><radialGradient id="cielo" cx="50%" cy="38%" r="80%"><stop offset="0%" stop-color="#3d2154"/><stop offset="60%" stop-color="#241433"/><stop offset="100%" stop-color="#150c20"/></radialGradient></defs>
  <rect width="1600" height="900" fill="url(#cielo)"/>
  <g fill="#efe3c8" opacity="0.85">
    ${Array.from({ length: 60 }, (_, i) => {
      const x = (i * 271) % 1600;
      const y = (i * 137) % 900;
      const r = 1 + (i % 3);
      return `<circle cx="${x}" cy="${y}" r="${r}"/>`;
    }).join("\n    ")}
  </g>
  ${tripleLuna(800, 330, 95, "#efe3c8", "#c9a227")}
  <path d="M 460 470 H 1140" stroke="#c9a227" stroke-width="3"/>
  <text x="800" y="580" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="86" fill="#efe3c8" letter-spacing="10">NOSOTRAS, LAS BRUJAS</text>
  <text x="800" y="660" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="40" font-style="italic" fill="#c9a227">Sistema para Foundry VTT</text>
</svg>\n`;
}

await fs.mkdir(path.join(RAIZ, "mayores"), { recursive: true });
await fs.mkdir(path.join(RAIZ, "menores"), { recursive: true });
await fs.mkdir("assets/portadas", { recursive: true });

let n = 0;
for (const a of ARCANOS) {
  await fs.writeFile(path.join(RAIZ, "mayores", `${a.romano}.svg`), mayor(a, false));
  n++;
}
for (const m of Object.values(MARCADORES)) {
  await fs.writeFile(path.join(RAIZ, "mayores", `${m.romano}.svg`), mayor({ romano: m.romano, nombre: m.nombre }, true));
  n++;
}
for (const pinta of Object.keys(PINTAS)) {
  for (let orden = 1; orden <= 14; orden++) {
    await fs.writeFile(path.join(RAIZ, "menores", `${pinta}-${orden}.svg`), menor(orden, pinta));
    n++;
  }
}
await fs.writeFile(path.join(RAIZ, "dorso.svg"), dorso());
await fs.writeFile("assets/portadas/portada.svg", portada());
console.log(`tarot: ${n} caras + dorso + portada`);
