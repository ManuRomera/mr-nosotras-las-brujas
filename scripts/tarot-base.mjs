/**
 * Utilidades del generador de tarot: paleta, texto convertido a trazados (las
 * cartas no dependen de ninguna fuente instalada) y las piezas de dibujo.
 */
import fs from "node:fs";
import opentype from "opentype.js";

export const ANCHO = 900;
export const ALTO = 1500;

export const INK = "#1d1612";
export const MARFIL = "#f3e8cc";
export const MARFIL2 = "#e6d6ae";
export const ROJO = "#b73a2b";
export const AZUL = "#2f5f94";
export const AMAR = "#e2a92c";
export const VERDE = "#4e7d40";
export const CARNE = "#efc197";
export const VIOLETA = "#5b2a6e";
export const NOCHE = "#2a1c3a";
export const AGUA = "#8fb7c4";
export const ORO = "#c9a227";

const abrir = ruta => {
  const b = fs.readFileSync(ruta);
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const FUENTES = {
  display: abrir("fonts/imfe-dprm.otf"),
  sc: abrir("fonts/imfe-dwpscr.ttf"),
  texto: abrir("fonts/imfe-gprm.otf"),
  cursiva: abrir("fonts/imfe-gpit.otf")
};

/** Anchura de un texto en la fuente dada. */
export const ancho = (str, size, f = "sc", ls = 0.04) => FUENTES[f].getAdvanceWidth(str, size, { letterSpacing: ls });

/** Algunos glifos CFF de las fuentes Fell traen NaN; se sustituyen por el último punto válido. */
function sanear(path) {
  let x = 0, y = 0;
  for (const c of path.commands) {
    for (const k of ["x1", "x2", "x"]) if (k in c && !Number.isFinite(c[k])) c[k] = x;
    for (const k of ["y1", "y2", "y"]) if (k in c && !Number.isFinite(c[k])) c[k] = y;
    if ("x" in c) { x = c.x; y = c.y; }
  }
  return path;
}

/** Último recurso: un NaN que sobreviva toma el valor de dos números atrás (mismo eje). */
function quitarNaN(d) {
  if (!d.includes("NaN")) return d;
  const nums = [];
  return d.replace(/NaN|-?\d+(?:\.\d+)?/g, m => { const v = m === "NaN" ? (nums.at(-2) ?? "0") : m; nums.push(v); return v; });
}

/** Texto como trazado vectorial centrado (o alineado) en x. */
export function t(str, x, y, size, { f = "sc", a = "middle", fill = INK, ls = 0.04, op = 1 } = {}) {
  const w = ancho(str, size, f, ls);
  const x0 = a === "middle" ? x - w / 2 : a === "end" ? x - w : x;
  // El texto pequeño se traza más grande y se reduce: coordenadas enteras sin perder detalle.
  const k = size < 70 ? Math.ceil(70 / size) : 1;
  const d = quitarNaN(sanear(FUENTES[f].getPath(str, x0 * k, y * k, size * k, { letterSpacing: ls })).toPathData(0));
  return `<path d="${d}" fill="${fill}"${k > 1 ? ` transform="scale(${(1 / k).toFixed(4)})"` : ""}${op < 1 ? ` opacity="${op}"` : ""}/>`;
}

/** Como `t`, pero reduce el tamaño (y, si hace falta, parte en dos líneas) hasta caber. */
export function titulo(str, x, y, size, maxW, opts = {}) {
  let s = size;
  while (s > 50 && ancho(str, s, opts.f ?? "sc", opts.ls ?? 0.04) > maxW) s -= 2;
  if (ancho(str, s, opts.f ?? "sc", opts.ls ?? 0.04) <= maxW) return t(str, x, y, s, opts);
  const palabras = str.split(" ");
  let mejor = [str, ""];
  let dif = Infinity;
  for (let i = 1; i < palabras.length; i++) {
    const a = palabras.slice(0, i).join(" ");
    const b = palabras.slice(i).join(" ");
    const d = Math.abs(ancho(a, size) - ancho(b, size));
    if (d < dif) { dif = d; mejor = [a, b]; }
  }
  const s2 = Math.min(size * 0.82, 76);
  return t(mejor[0], x, y - s2 * 0.55, s2, opts) + t(mejor[1], x, y + s2 * 0.55, s2, opts);
}

// ─── Primitivas de dibujo (trazo de tinta, esquinas redondas) ────────────────
export const P = (d, fill = "none", sw = 8, extra = "") =>
  `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
export const C = (cx, cy, r, fill = "none", sw = 8) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
export const E = (cx, cy, rx, ry, fill = "none", sw = 8) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
export const R = (x, y, w, h, fill = "none", rx = 0, sw = 8) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
export const L = (x1, y1, x2, y2, sw = 8, color = INK) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
export const G = (inner, transform = "", extra = "") => `<g transform="${transform}" ${extra}>${inner}</g>`;

/** Polígono regular o estrellado. */
export function estrella(cx, cy, R1, r1, n = 5, fill = AMAR, rot = -90, sw = 7) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const ang = ((rot + (i * 180) / n) * Math.PI) / 180;
    const r = i % 2 ? r1 : R1;
    pts.push(`${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

/** Rayos rectos alrededor de un centro. */
export function rayos(cx, cy, r1, r2, n, sw = 8, color = INK) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI) / n;
    s += L((cx + r1 * Math.cos(a)).toFixed(1), (cy + r1 * Math.sin(a)).toFixed(1), (cx + r2 * Math.cos(a)).toFixed(1), (cy + r2 * Math.sin(a)).toFixed(1), sw, color);
  }
  return s;
}

/** Rayos ondulados del sol (triángulos alternos). */
export function solRayos(cx, cy, r1, r2, n, fill = AMAR) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI) / n;
    const b = a + Math.PI / n;
    const p = (r, ang) => `${(cx + r * Math.cos(ang)).toFixed(1)} ${(cy + r * Math.sin(ang)).toFixed(1)}`;
    s += P(`M${p(r1, a - 0.12)} L${p(r2, b)} L${p(r1, a + 0.12 + 0.12)} Z`, fill, 6);
  }
  return s;
}

/** Cabeza con ojos y boca. */
export function cabeza(x, y, r = 52, fill = CARNE, boca = true) {
  return C(x, y, r, fill) +
    `<circle cx="${x - r * 0.36}" cy="${y - r * 0.08}" r="${r * 0.07}" fill="${INK}"/><circle cx="${x + r * 0.36}" cy="${y - r * 0.08}" r="${r * 0.07}" fill="${INK}"/>` +
    (boca ? P(`M${x - r * 0.28} ${y + r * 0.42} Q${x} ${y + r * 0.58} ${x + r * 0.28} ${y + r * 0.42}`, "none", 5) : "") +
    P(`M${x} ${y - r * 0.05} v${r * 0.22}`, "none", 4);
}

/** Corona de picos. */
export function corona(x, y, w, fill = AMAR) {
  return P(`M${x - w} ${y} L${x - w * 0.92} ${y - w * 0.8} L${x - w * 0.46} ${y - w * 0.36} L${x} ${y - w} L${x + w * 0.46} ${y - w * 0.36} L${x + w * 0.92} ${y - w * 0.8} L${x + w} ${y} Z`, fill, 7) +
    C(x, y - w * 1.06, w * 0.1, ROJO, 5) + C(x - w * 0.92, y - w * 0.86, w * 0.08, ROJO, 5) + C(x + w * 0.92, y - w * 0.86, w * 0.08, ROJO, 5);
}

/** Nube de líneas finas (sombreado de grabado) dentro de una forma ya dibujada. */
export const trama = (id, color = INK, sep = 14, op = 0.22) =>
  `<pattern id="${id}" width="${sep}" height="${sep}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${sep}" stroke="${color}" stroke-width="3" opacity="${op}"/></pattern>`;

export const svg = (cuerpo, w = ANCHO, h = ALTO) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${cuerpo}</svg>\n`;

/** Papel de marfil con grano, base de las caras. */
export const DEFS = `<defs>
  <filter id="grano" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .1  0 0 0 .5 0"/></filter>
  ${trama("tr")}
</defs>`;
