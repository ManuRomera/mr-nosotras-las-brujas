/**
 * Genera los retratos por defecto (grabado a color, como las cartas): seis
 * Hermanas, tres PNJ y el pueblo. Cada ficha nueva estrena uno al azar.
 *
 *   npm run retratos
 */
import fs from "node:fs/promises";
import { P, C, E, R, L, G, INK, MARFIL, MARFIL2, ROJO, AZUL, AMAR, VERDE, CARNE, VIOLETA, NOCHE, AGUA, estrella, svg } from "./tarot-base.mjs";

const PELO = ["#5a3920", "#2a1a12", "#8a5a2b", "#b9824a", "#3a2a2a", "#6b4a35"];

/** Marco común: campo de color con trama y filete interior. */
const marco = (campo, dibujo) => svg(`<defs><pattern id="tr" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke="${INK}" stroke-width="3" opacity=".16"/></pattern></defs>
  <rect width="400" height="500" fill="${campo}"/><rect width="400" height="500" fill="url(#tr)"/>
  ${dibujo}
  <rect x="6" y="6" width="388" height="488" fill="none" stroke="${INK}" stroke-width="10"/>`, 400, 500);

const ojos = (x, y, d) => `<circle cx="${x - d}" cy="${y}" r="5" fill="${INK}"/><circle cx="${x + d}" cy="${y}" r="5" fill="${INK}"/>`;
const rostro = (x, y, r, boca = true) => C(x, y, r, CARNE) + ojos(x, y - 4, r * 0.36) + P(`M${x} ${y} v${r * 0.2}`, "none", 4) + (boca ? P(`M${x - r * 0.26} ${y + r * 0.45} q${r * 0.26} ${r * 0.16} ${r * 0.52} 0`, "none", 5) : "");

/** Hermana: busto con pañuelo o cofia, y vestido de color. */
function hermana(i) {
  const campos = [AZUL, VERDE, ROJO, AMAR, VIOLETA, "#6b8f8a"];
  const vestidos = [ROJO, AMAR, AZUL, VERDE, AMAR, ROJO];
  const panuelos = [MARFIL, ROJO, MARFIL2, AZUL, VERDE, AMAR];
  const pelo = PELO[i % PELO.length];
  const cuerpo = P("M20 500 Q40 340 150 320 L250 320 Q360 340 380 500 Z", vestidos[i]) + P("M150 320 L200 400 L250 320", MARFIL, 8) + P("M20 500 Q40 340 150 320", "none", 8);
  const cabello = i % 2 ? P("M110 220 Q100 330 140 350 L140 250 Z M290 220 Q300 330 260 350 L260 250 Z", pelo) : P("M112 200 Q70 300 120 345 L150 260 Z M288 200 Q330 300 280 345 L250 260 Z", pelo);
  const pano = i % 3 === 0
    ? P("M95 220 Q95 90 200 85 Q305 90 305 220 Q300 150 200 140 Q100 150 95 220 Z", panuelos[i]) + P("M95 220 Q80 300 115 330 L150 250 Z M305 220 Q320 300 285 330 L250 250 Z", panuelos[i])
    : P("M110 215 Q110 95 200 90 Q290 95 290 215 Q290 150 200 140 Q110 150 110 215 Z", pelo);
  return marco(campos[i], `${cuerpo}${cabello}${rostro(200, 235, 72)}${pano}${estrella(70, 70, 22, 10, 5, AMAR, -90, 5)}`);
}

/** PNJ: 0 labrador con sombrero, 1 cura, 2 anciana con chal. */
function pnj(i) {
  const campos = [AMAR, NOCHE, "#8d8f8a"];
  const dib = [
    // labrador
    P("M20 500 Q40 340 150 320 L250 320 Q360 340 380 500 Z", VERDE) + P("M150 320 L200 380 L250 320", MARFIL, 8) + rostro(200, 240, 70) +
      P("M148 290 Q200 340 252 290 Q250 340 200 360 Q150 340 148 290 Z", "#8a5a2b", 6) + E(200, 178, 150, 26, AMAR) + P("M120 178 Q200 70 280 178 Z", AMAR),
    // cura
    P("M20 500 Q40 340 150 320 L250 320 Q360 340 380 500 Z", INK) + P("M165 320 L200 370 L235 320 Z", MARFIL, 6) + rostro(200, 235, 70) + P("M130 215 Q140 130 200 125 Q260 130 270 215 Q260 170 200 165 Q140 170 130 215 Z", "#8d8f8a") + L(200, 410, 200, 480, 10, MARFIL) + L(175, 435, 225, 435, 10, MARFIL),
    // anciana
    P("M20 500 Q40 340 150 320 L250 320 Q360 340 380 500 Z", "#6b4a35") + rostro(200, 240, 66) + P("M100 260 Q90 100 200 90 Q310 100 300 260 Q290 330 230 340 L170 340 Q110 330 100 260 Z M135 250 Q135 150 200 145 Q265 150 265 250 Q265 190 200 185 Q135 190 135 250 Z", "#9a6a8a", 8, 'fill-rule="evenodd"') + rostro(200, 245, 62, true)
  ][i];
  return marco(campos[i], dib);
}

/** Pueblo: tejados, iglesia en la colina y luna. */
function pueblo() {
  const casa = (x, y, w, h, tejado) => R(x, y, w, h, MARFIL2) + P(`M${x - 10} ${y} L${x + w / 2} ${y - h * 0.6} L${x + w + 10} ${y} Z`, tejado) + R(x + w * 0.35, y + h * 0.4, w * 0.3, h * 0.6, NOCHE, 0, 5);
  return marco(NOCHE, `${C(300, 110, 44, MARFIL)}<path d="M312 70 A44 44 0 1 0 312 150 A34 34 0 0 1 312 70Z" fill="${NOCHE}"/>
    ${P("M0 330 Q120 240 240 300 T400 270 V500 H0 Z", VERDE)}
    ${R(150, 190, 70, 90, MARFIL, 0, 8)}${P("M140 190 L185 130 L230 190 Z", ROJO)}${L(185, 130, 185, 90, 8)}${L(168, 106, 202, 106, 8)}${R(172, 225, 26, 55, NOCHE, 0, 5)}
    ${casa(30, 380, 100, 80, ROJO)}${casa(150, 400, 110, 90, AMAR)}${casa(280, 370, 90, 90, ROJO)}
    ${estrella(70, 90, 18, 8, 5, AMAR, -90, 4)}${estrella(110, 150, 12, 5, 5, AMAR, -90, 3)}`);
}

await fs.mkdir("assets/retratos", { recursive: true });
for (let i = 0; i < 6; i++) await fs.writeFile(`assets/retratos/hermana-${i + 1}.svg`, hermana(i));
for (let i = 0; i < 3; i++) await fs.writeFile(`assets/retratos/pnj-${i + 1}.svg`, pnj(i));
await fs.writeFile("assets/retratos/pueblo.svg", pueblo());
console.log("retratos: 6 Hermanas, 3 PNJ, 1 pueblo");
