/**
 * Genera las 78 cartas del tarot en SVG (más los marcadores de fase, el dorso
 * y la portada). Grabado de estilo marsellés: tinta, marfil y colores planos.
 * Todo el texto va convertido a trazados, así que no depende de ninguna fuente.
 * Se pueden sustituir por un tarot ilustrado conservando los nombres de archivo.
 *
 *   npm run tarot
 */
import fs from "node:fs/promises";
import path from "node:path";
import { ARCANOS, MARCADORES, PINTAS, FIGURAS } from "../module/listas.mjs";
import { ANCHO, ALTO, DEFS, INK, MARFIL, MARFIL2, ROJO, AZUL, AMAR, VERDE, CARNE, VIOLETA, NOCHE, ORO, P, C, E, R, L, G, t, titulo, svg, estrella, rayos, cabeza, corona } from "./tarot-base.mjs";
import { MAYORES } from "./tarot-mayores.mjs";

const RAIZ = path.resolve("assets/tarot");
const COLOR_PINTA = { oros: AMAR, copas: ROJO, espadas: AZUL, bastos: VERDE };
const ACENTO_PINTA = { oros: "#9a7413", copas: "#8c2a1f", espadas: "#244a74", bastos: "#3b6130" };

/** Marco común: marfil con grano, doble filete y rombos en las esquinas. */
function marco(acento) {
  const rombo = (x, y) => `<path d="M${x} ${y - 14} L${x + 14} ${y} L${x} ${y + 14} L${x - 14} ${y} Z" fill="${acento}"/>`;
  return `<rect width="${ANCHO}" height="${ALTO}" rx="44" fill="${MARFIL}"/>
  <rect width="${ANCHO}" height="${ALTO}" rx="44" filter="url(#grano)" opacity=".55"/>
  <rect x="14" y="14" width="${ANCHO - 28}" height="${ALTO - 28}" rx="34" fill="none" stroke="${INK}" stroke-width="8"/>
  <rect x="38" y="38" width="${ANCHO - 76}" height="${ALTO - 76}" rx="18" fill="none" stroke="${acento}" stroke-width="4"/>
  ${rombo(38, 38)}${rombo(ANCHO - 38, 38)}${rombo(38, ALTO - 38)}${rombo(ANCHO - 38, ALTO - 38)}`;
}

/** Pequeño remate bajo el nombre. */
const pie = acento => `<path d="M330 1410 H570" stroke="${acento}" stroke-width="3" opacity=".7"/><circle cx="450" cy="1410" r="9" fill="${acento}"/><circle cx="410" cy="1410" r="5" fill="${acento}" opacity=".7"/><circle cx="490" cy="1410" r="5" fill="${acento}" opacity=".7"/>`;

/** Ventana del dibujo con su campo de color y el sombreado de grabado. */
function ventana(campo, contenido) {
  return `<clipPath id="vent"><rect x="86" y="248" width="728" height="884" rx="10"/></clipPath>
  <rect x="86" y="248" width="728" height="884" rx="10" fill="${campo}"/>
  <rect x="86" y="248" width="728" height="884" rx="10" fill="url(#tr)" opacity=".7"/>
  <g clip-path="url(#vent)"><g transform="translate(450 690)">${contenido}</g></g>
  <rect x="86" y="248" width="728" height="884" rx="10" fill="none" stroke="${INK}" stroke-width="10"/>`;
}

const filete = (y, acento) => `${L(150, y, 380, y, 4, acento)}${L(520, y, 750, y, 4, acento)}<path d="M450 ${y - 12} L462 ${y} L450 ${y + 12} L438 ${y} Z" fill="${acento}"/>`;

/** Cara de un arcano mayor (o marcador de fase). */
function mayor(a, marcador) {
  const def = MAYORES[a.romano];
  const acento = VIOLETA;
  const romano = a.romano === "0"
    ? E(ANCHO / 2, 150, 26, 36, "none", 9).replace(INK, acento)
    : t(a.romano, ANCHO / 2, 188, a.romano.length > 4 ? 100 : 124, { f: "display", fill: acento, ls: 0.06 });
  return svg(`${DEFS}${marco(acento)}
  ${romano}
  ${filete(214, acento)}
  ${ventana(def.campo, def.dib())}
  ${filete(1178, acento)}
  ${titulo(a.nombre.toUpperCase(), ANCHO / 2, 1326, 96, 730)}
  ${pie(acento)}`);
}

// ─── Palos ───────────────────────────────────────────────────────────────────
/** Un símbolo de palo centrado en (0,0), de unos 170 de alto. */
function glifo(pinta) {
  if (pinta === "oros") {
    return C(0, 0, 84, AMAR, 9) + C(0, 0, 58, "none", 5) + C(0, 0, 24, ROJO, 6) +
      Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return C(Math.cos(a) * 42, Math.sin(a) * 42, 8, INK, 0); }).join("");
  }
  if (pinta === "copas") {
    return P("M-78 -70 Q-78 30 0 40 Q78 30 78 -70 Z", ROJO, 9) + E(0, -70, 78, 16, "#d4584a", 7) +
      P("M-14 38 L-10 78 L10 78 L14 38", AMAR, 7) + P("M-52 92 Q0 70 52 92 L52 104 H-52 Z", AMAR, 8) + P("M-50 -30 Q-40 20 -10 28", "none", 5);
  }
  if (pinta === "espadas") {
    return P("M0 -92 Q32 -60 24 30 L0 54 L-24 30 Q-32 -60 0 -92 Z", "#cfd8dc", 8) + L(0, -80, 0, 40, 4) +
      P("M-60 54 Q0 38 60 54 L60 70 Q0 56 -60 70 Z", AMAR, 8) + P("M-9 70 H9 V110 H-9 Z", ROJO, 6) + C(0, 120, 12, AMAR, 6);
  }
  return P("M-20 90 L-26 -40 Q-60 -52 -42 -82 Q-12 -104 0 -86 Q12 -104 42 -82 Q60 -52 26 -40 L20 90 Q0 100 -20 90 Z", VERDE, 8) +
    L(-12, -20, 12, -20, 4) + L(-13, 12, 13, 12, 4) + L(-14, 44, 14, 44, 4) + P("M-9 -86 q9 -18 18 0", "none", 5);
}

const POS = {
  1: [[0, 0]],
  2: [[0, -230], [0, 230]],
  3: [[0, -270], [0, 0], [0, 270]],
  4: [[-130, -230], [130, -230], [-130, 230], [130, 230]],
  5: [[-130, -230], [130, -230], [0, 0], [-130, 230], [130, 230]],
  6: [[-130, -270], [130, -270], [-130, 0], [130, 0], [-130, 270], [130, 270]],
  7: [[-130, -270], [130, -270], [0, -135], [-130, 0], [130, 0], [-130, 270], [130, 270]],
  8: [[-130, -270], [130, -270], [0, -135], [-130, 0], [130, 0], [0, 135], [-130, 270], [130, 270]],
  9: [[-130, -310], [130, -310], [-130, -105], [130, -105], [0, 0], [-130, 105], [130, 105], [-130, 310], [130, 310]],
  10: [[-130, -310], [130, -310], [0, -205], [-130, -105], [130, -105], [-130, 105], [130, 105], [0, 205], [-130, 310], [130, 310]]
};

/** Cuerpo y atributo de una figura de la corte. */
function corte(rango, pinta) {
  const c = COLOR_PINTA[pinta];
  const ropa = pinta === "copas" ? AZUL : pinta === "espadas" ? ROJO : pinta === "bastos" ? ROJO : AZUL;
  const cuerpo = P("M-250 410 Q-230 80 -110 40 L110 40 Q230 80 250 410 Z", ropa) + P("M-96 40 L0 150 L96 40", MARFIL, 8) + P("M-250 410 L-250 300 M250 410 L250 300", "none", 8);
  const item = scale => G(`<use href="#g"/>`, `translate(${rango === 14 ? -190 : 190} 170) scale(${scale})`);
  const dibujo = {
    11: () => cuerpo + cabeza(0, -70, 70) + P("M-76 -92 Q0 -160 76 -92 L66 -130 Q0 -170 -66 -130 Z", c, 7) + P("M30 -150 q40 -90 90 -80 q-30 30 -50 90", ROJO, 7),
    12: () => cuerpo + cabeza(0, -70, 68) + P("M-74 -62 Q-80 -190 0 -200 Q80 -190 74 -62 L50 -70 Q0 -126 -50 -70 Z", "#b9c2c7", 8) + P("M0 -200 q60 -70 110 -20 q-60 -10 -90 50", ROJO, 7) + L(-52, -66, 52, -66, 6),
    13: () => cuerpo + P("M-120 -60 Q-130 130 -96 200 M120 -60 Q130 130 96 200", "#7a4b25", 22) + cabeza(0, -70, 68) + corona(0, -138, 62, c) + P("M-90 -100 Q-120 60 -92 120 L-60 40 Z M90 -100 Q120 60 92 120 L60 40 Z", MARFIL, 7),
    14: () => cuerpo + P("M-96 40 Q-120 -30 -90 -60 L90 -60 Q120 -30 96 40 Z", MARFIL2, 7) + cabeza(0, -80, 70) + P("M-62 -66 Q-70 80 0 90 Q70 80 62 -66 Q0 -20 -62 -66 Z", MARFIL, 7) + corona(0, -142, 76, c)
  }[rango]();
  return dibujo + item(rango === 14 ? 1.0 : 0.9);
}

function menor(orden, pinta) {
  const acento = ACENTO_PINTA[pinta];
  let contenido;
  if (orden <= 10) {
    const escala = orden === 1 ? 2.3 : orden <= 3 ? 1.2 : orden <= 6 ? 1.1 : orden <= 8 ? 1.0 : 0.92;
    contenido = POS[orden].map(([x, y]) => `<use href="#g" transform="translate(${x} ${y}) scale(${escala})${y > 0 && orden > 1 && pinta !== "oros" ? " rotate(180)" : ""}"/>`).join("");
    if (orden === 1) contenido += t(PINTAS[pinta].toUpperCase(), 0, 380, 56, { f: "sc", fill: acento, ls: 0.12 });
  } else {
    contenido = corte(orden, pinta);
  }
  const marca = orden <= 10 ? ROMANOS[orden] : FIGURAS[orden].slice(0, 1).toUpperCase();
  const nombre = `${orden === 1 ? "AS" : orden <= 10 ? NUMEROS[orden] : FIGURAS[orden].toUpperCase()} DE ${PINTAS[pinta].toUpperCase()}`;
  return svg(`${DEFS}<defs><g id="g">${glifo(pinta)}</g></defs>${marco(acento)}
  ${t(marca, ANCHO / 2, 188, marca.length > 3 ? 100 : 124, { f: "display", fill: acento, ls: 0.06 })}
  ${filete(214, acento)}
  ${ventana(MARFIL2, contenido)}
  ${filete(1178, acento)}
  ${titulo(nombre, ANCHO / 2, 1326, 88, 730)}
  ${pie(acento)}`);
}
const ROMANOS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const NUMEROS = ["", "AS", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE", "DIEZ"];

/** Dorso: noche violeta con malla dorada y la triple luna. */
function dorso() {
  return svg(`<defs>
    <pattern id="malla" width="90" height="90" patternUnits="userSpaceOnUse">
      <path d="M45 8 L82 45 L45 82 L8 45 Z" fill="none" stroke="${ORO}" stroke-width="3" opacity=".55"/>
      <circle cx="45" cy="45" r="5" fill="${ORO}" opacity=".7"/><circle cx="0" cy="0" r="4" fill="${ORO}" opacity=".4"/><circle cx="90" cy="0" r="4" fill="${ORO}" opacity=".4"/>
    </pattern>
    <radialGradient id="fondo" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#3d2556"/><stop offset="1" stop-color="#1f132e"/></radialGradient>
  </defs>
  <rect width="${ANCHO}" height="${ALTO}" rx="44" fill="url(#fondo)"/>
  <rect x="14" y="14" width="${ANCHO - 28}" height="${ALTO - 28}" rx="34" fill="none" stroke="${ORO}" stroke-width="8"/>
  <rect x="62" y="62" width="${ANCHO - 124}" height="${ALTO - 124}" rx="14" fill="url(#malla)" stroke="${ORO}" stroke-width="4"/>
  <rect x="38" y="38" width="${ANCHO - 76}" height="${ALTO - 76}" rx="18" fill="none" stroke="${ORO}" stroke-width="3" opacity=".6"/>
  <ellipse cx="450" cy="750" rx="300" ry="430" fill="#241433" stroke="${ORO}" stroke-width="6"/>
  <ellipse cx="450" cy="750" rx="270" ry="400" fill="none" stroke="${ORO}" stroke-width="2.5" opacity=".7"/>
  ${tripleLuna(450, 700, 70)}
  ${estrella(450, 470, 34, 14, 8, ORO, -90, 3)}${estrella(450, 1030, 34, 14, 8, ORO, -90, 3)}
  ${t("NOSOTRAS", 450, 1000, 62, { f: "sc", fill: ORO, ls: 0.22 })}${t("LAS BRUJAS", 450, 1068, 62, { f: "sc", fill: ORO, ls: 0.22 })}`);
}

/** Doncella, madre y anciana: creciente, llena y menguante. */
function tripleLuna(x, y, r) {
  const luna = `<circle r="${r}" fill="${MARFIL}" stroke="${ORO}" stroke-width="5"/>`;
  const cre = s => `<path d="M0 ${-r} A${r} ${r} 0 1 ${s > 0 ? 1 : 0} 0 ${r} A${r * 0.62} ${r} 0 1 ${s > 0 ? 0 : 1} 0 ${-r} Z" fill="${MARFIL}" stroke="${ORO}" stroke-width="5"/>`;
  return `<g transform="translate(${x} ${y})">
    <g transform="translate(${-r * 2.5} 0)">${cre(-1)}</g>${luna}<g transform="translate(${r * 2.5} 0)">${cre(1)}</g>
  </g>`;
}

/** Portada del sistema (1600×900): noche, abanico de tres arcanos y título. */
function portada() {
  const carta = (romano, rot, dx, dy) => {
    const a = ARCANOS.find(m => m.romano === romano) ?? Object.values(MARCADORES).find(m => m.romano === romano);
    const def = MAYORES[romano];
    const cuerpo = `${marco(VIOLETA)}${t(romano, ANCHO / 2, 188, romano.length > 4 ? 100 : 124, { f: "display", fill: VIOLETA, ls: 0.06 })}${filete(214, VIOLETA)}${ventana(def.campo, def.dib())}${filete(1178, VIOLETA)}${titulo(a.nombre.toUpperCase(), ANCHO / 2, 1302, 96, 730)}`;
    return `<g transform="translate(${dx} ${dy}) rotate(${rot}) scale(.32) translate(-450 -750)" filter="url(#sombra)">${cuerpo}</g>`;
  };
  const estrellas = Array.from({ length: 90 }, (_, i) => {
    const x = (i * 271) % 1600, y = (i * 137) % 900, r = 1 + (i % 3) * 0.7;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${MARFIL}" opacity="${0.35 + (i % 5) * 0.12}"/>`;
  }).join("");
  return svg(`${DEFS}<defs>
    <radialGradient id="cielo" cx="62%" cy="40%" r="85%"><stop offset="0" stop-color="#4a2a63"/><stop offset=".55" stop-color="#2a1740"/><stop offset="1" stop-color="#150b21"/></radialGradient>
    <filter id="sombra" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#000" flood-opacity=".7"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#cielo)"/>${estrellas}
  ${carta("XIII", -12, 1140, 500)}${carta("VIII", 0, 1290, 460)}${carta("XVIII", 12, 1440, 500)}
  <g transform="translate(70 40)">
    ${t("MR-", 120, 200, 70, { f: "sc", a: "start", fill: ORO, ls: 0.3 })}
    ${t("NOSOTRAS,", 106, 340, 118, { f: "display", a: "start", fill: MARFIL, ls: 0.02 })}
    ${t("LAS BRUJAS", 106, 460, 118, { f: "display", a: "start", fill: MARFIL, ls: 0.02 })}
    <path d="M110 510 H690" stroke="${ORO}" stroke-width="3"/><path d="M400 496 L414 510 L400 524 L386 510 Z" fill="${ORO}"/>
    ${t("Una acusada, siete horas y un pueblo que sospecha.", 110, 580, 36, { f: "cursiva", a: "start", fill: "#e6d9b6", ls: 0.01 })}
    ${t("SISTEMA PARA FOUNDRY VTT", 110, 660, 34, { f: "sc", a: "start", fill: ORO, ls: 0.2 })}
  </g>`, 1600, 900);
}

await fs.mkdir(path.join(RAIZ, "mayores"), { recursive: true });
await fs.mkdir(path.join(RAIZ, "menores"), { recursive: true });
await fs.mkdir("assets/portadas", { recursive: true });

let n = 0;
for (const a of ARCANOS) { await fs.writeFile(path.join(RAIZ, "mayores", `${a.romano}.svg`), mayor(a, false)); n++; }
for (const m of Object.values(MARCADORES)) { await fs.writeFile(path.join(RAIZ, "mayores", `${m.romano}.svg`), mayor({ romano: m.romano, nombre: m.nombre }, true)); n++; }
for (const pinta of Object.keys(PINTAS)) {
  for (let orden = 1; orden <= 14; orden++) { await fs.writeFile(path.join(RAIZ, "menores", `${pinta}-${orden}.svg`), menor(orden, pinta)); n++; }
}
await fs.writeFile(path.join(RAIZ, "dorso.svg"), dorso());
await fs.writeFile("assets/portadas/portada.svg", portada());
console.log(`tarot: ${n} caras + dorso + portada`);
