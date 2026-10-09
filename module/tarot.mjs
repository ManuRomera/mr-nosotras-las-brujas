/**
 * Los mazos. Cuatro pilas de cartas creadas solas en el mundo:
 *
 * - `mayores` (mazo de 19): conceptos de escena. Estrella, Sol y Luna no se
 *   incluyen: son marcadores de fase (R 10–13).
 * - `menores` (mazo de 56): sospechas, se roban boca abajo (R 52–54).
 * - `escena` (montón): los mayores robados que se devuelven al cerrar escena (R 36).
 * - `sospechas` (montón): los menores robados, boca abajo hasta Laudes (R 54).
 *
 * El motor de Foundry lleva la trazabilidad: al robar, el original queda marcado
 * en el mazo y la copia guarda su origen, así que «devolver» es un pass de vuelta.
 */
import { ID, RUTA, sesion } from "./mesa.mjs";
import { ARCANOS, PINTAS } from "./listas.mjs";
import { valorMenor, nombreMenor } from "./reglas.mjs";

export const PILAS = {
  mayores: { nombre: "Tarot · Arcanos Mayores", tipo: "deck", img: `${RUTA}/assets/tarot/mayores/XV.svg` },
  menores: { nombre: "Tarot · Arcanos Menores", tipo: "deck", img: `${RUTA}/assets/tarot/menores/copas-7.svg` },
  escena: { nombre: "Escena · Arcanos mayores", tipo: "pile", img: `${RUTA}/assets/tarot/mayores/XXI.svg` },
  sospechas: { nombre: "Sospechas · Arcanos menores", tipo: "pile", img: `${RUTA}/assets/tarot/dorso.svg` }
};

export const DORSO = `${RUTA}/assets/tarot/dorso.svg`;
export const imgMayor = romano => `${RUTA}/assets/tarot/mayores/${romano}.svg`;
export const imgMenor = (pinta, orden) => `${RUTA}/assets/tarot/menores/${pinta}-${orden}.svg`;

/** La pila con este identificador, si ya existe. */
export const pila = clave => game.cards.find(c => c.flags?.[ID]?.pila === clave) ?? null;

const tras = { chatNotification: false };

/**
 * Crea las cuatro pilas y, si faltan cartas, las 78. Solo el GM al arrancar.
 */
export async function asegurarMazo() {
  const creadas = [];
  for (const [clave, def] of Object.entries(PILAS)) {
    if (pila(clave)) continue;
    const [creada] = await Cards.create([{
      name: def.nombre, type: def.tipo, img: def.img,
      width: 90, height: 150, displayCount: true,
      flags: { [ID]: { pila: clave } }
    }]);
    creadas.push(creada);
    console.info(`mr-nosotras-las-brujas | pila creada: ${def.nombre}`);
  }

  const mayores = pila("mayores");
  if (mayores && !mayores.cards.size) {
    const cartas = ARCANOS.map((a, orden) => ({
      name: `${a.romano} · ${a.nombre}`,
      suit: "mayor",
      value: a.orden,
      description: `<p><strong>${a.pos}</strong> · concepto de jugadora.</p><p><strong>${a.neg}</strong> · concepto de dirección (invertida).</p><p>Arquetipo de PNJ: ${a.arquetipo}.</p>`,
      faces: [{ name: a.nombre, img: imgMayor(a.romano) }],
      face: 0,
      back: { name: "Dorso", img: DORSO },
      width: 90, height: 150, sort: orden * 1000,
      flags: { [ID]: { clase: "mayor", romano: a.romano } }
    }));
    await mayores.createEmbeddedDocuments("Card", cartas);
    await mayores.shuffle({ ...tras });
    console.info(`mr-nosotras-las-brujas | ${cartas.length} arcanos mayores`);
  }

  const menores = pila("menores");
  if (menores && !menores.cards.size) {
    const cartas = [];
    let orden = 0;
    for (const pinta of Object.keys(PINTAS)) {
      for (let numero = 1; numero <= 14; numero++) {
        cartas.push({
          name: nombreMenor(numero, pinta, PINTAS),
          suit: pinta,
          value: numero,
          description: "<p>Arcano menor: rumor, sospecha o acusación.</p>",
          faces: [{ name: nombreMenor(numero, pinta, PINTAS), img: imgMenor(pinta, numero) }],
          face: 0,
          back: { name: "Dorso", img: DORSO },
          width: 90, height: 150, sort: (orden++) * 1000,
          flags: { [ID]: { clase: "menor", pinta, orden: numero } }
        });
      }
    }
    await menores.createEmbeddedDocuments("Card", cartas);
    await menores.shuffle({ ...tras });
    console.info(`mr-nosotras-las-brujas | ${cartas.length} arcanos menores`);
  }
  return creadas;
}

/** Mezcla los dos mazos (R 13, R 26). */
export async function barajar() {
  for (const clave of ["mayores", "menores"]) {
    const mazo = pila(clave);
    if (mazo) await mazo.shuffle({ ...tras });
  }
}

/**
 * Roba un arcano mayor al montón de la escena, boca arriba (R 30).
 * @returns {Card} la copia robada
 */
export async function robarMayor() {
  const deck = pila("mayores");
  const escena = pila("escena");
  if (!deck || !escena) throw new Error("Faltan los mazos: ejecuta game.mrNosotras.asegurarMazo().");
  const robadas = await escena.draw(deck, 1, { ...tras, how: CONST.CARD_DRAW_MODES.RANDOM, updateData: { face: 0 } });
  return robadas[0];
}

/**
 * Roba un arcano menor al montón de sospechas, boca abajo (R 35, R 54).
 * @returns {Card} la copia robada (sin mirar si es de entrega)
 */
export async function robarMenor() {
  const deck = pila("menores");
  const sospechas = pila("sospechas");
  if (!deck || !sospechas) throw new Error("Faltan los mazos: ejecuta game.mrNosotras.asegurarMazo().");
  const robadas = await sospechas.draw(deck, 1, { ...tras, how: CONST.CARD_DRAW_MODES.RANDOM, updateData: { face: null } });
  return robadas[0];
}

/** Devuelve al mazo los mayores de la escena cerrada (R 36). */
export async function devolverEscena() {
  const deck = pila("mayores");
  const escena = pila("escena");
  if (!deck || !escena || !escena.cards.size) return [];
  return escena.pass(deck, escena.cards.map(c => c.id), { ...tras, action: "discard" });
}

/** Vuelca al mazo todo lo robado (al preparar la partida, R 09–13). */
export async function recogerTodo() {
  for (const [monton, mazo] of [["escena", "mayores"], ["sospechas", "menores"]]) {
    const origen = pila(monton);
    const deck = pila(mazo);
    if (origen?.cards.size && deck) await origen.pass(deck, origen.cards.map(c => c.id), { ...tras, action: "recall" });
  }
}

/** Descubre de golpe los menores robados (Laudes, R 57). */
export async function revelarMenores() {
  const sospechas = pila("sospechas");
  if (!sospechas?.cards.size) return;
  await sospechas.updateEmbeddedDocuments("Card", sospechas.cards.contents.map(c => ({ _id: c.id, face: 0 })));
}

/**
 * Datos de un arcano robado para guardar en la sesión y para el chat.
 * @param {Card} carta
 */
export function datoMayor(carta) {
  const flags = carta.flags?.[ID] ?? {};
  const arcano = flags.romano ?? "";
  return { id: carta.id, arcano, nombre: carta.name };
}

/**
 * Datos de un menor robado: nombre, valor según la mesa y a quién robó (R 62).
 * @param {Card} carta
 * @param {string} robadaPor uuid de la Hermana que roba
 */
export function datoMenor(carta, robadaPor) {
  const flags = carta.flags?.[ID] ?? {};
  const pinta = flags.pinta ?? carta.suit;
  const orden = Number(flags.orden ?? carta.value);
  const figuras = game.settings.get(ID, "valoresFiguras");
  return {
    id: carta.id,
    pinta,
    orden,
    nombre: nombreMenor(orden, pinta, PINTAS),
    valor: valorMenor(orden, figuras),
    robadaPor,
    modo: "",
    destinataria: "",
    revelada: false
  };
}
