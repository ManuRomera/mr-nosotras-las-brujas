/**
 * Reglas puras: totales de sospechas, acusaciones por recuento, límites e
 * inversión de conceptos. Sin acceso a Foundry: se prueban con Node.
 */
import { ARCANOS, MAYOR_POR_ROMANO, FIGURAS } from "./listas.mjs";

export const alAzar = lista => lista[Math.floor(Math.random() * lista.length)];

/** Valor de un arcano menor: 1–10 valen su número; las figuras, lo que diga la mesa (R 62). */
export function valorMenor(orden, figuras = [11, 12, 13, 14]) {
  if (orden <= 10) return orden;
  return Number(figuras[orden - 11]) || 0;
}

/** Nombre visible de un arcano menor: «7 de Copas», «Rey de Oros»… */
export function nombreMenor(orden, pinta, pintas) {
  const numero = orden <= 10 ? String(orden) : FIGURAS[orden] ?? String(orden);
  return `${numero} de ${pintas[pinta] ?? pinta}`;
}

/**
 * A quién cuenta una sospecha para el recuento: la destinataria si está
 * entregada boca abajo, o quien la robó si la conserva (R 53–54).
 * @param {{robadaPor:string, modo?:string, destinataria?:string}} m
 * @returns {string}
 */
export function duenaDe(m) {
  return m.modo === "entregar" && m.destinataria ? m.destinataria : m.robadaPor;
}

/**
 * Suma de sospechas por Hermana (R 55–57). Las cartas entregadas cuentan para
 * la destinataria, no para quien las robó (R 53–54); sin destinataria, para quien robó.
 * @param {Array<{robadaPor:string, valor:number, revelada:boolean, modo?:string, destinataria?:string}>} menores
 * @returns {Object<string, number>} uuid de Hermana → total
 */
export function totales(menores) {
  const suma = {};
  for (const m of menores ?? []) {
    if (!m.robadaPor || !m.revelada) continue;
    const duena = duenaDe(m);
    suma[duena] = (suma[duena] ?? 0) + Number(m.valor || 0);
  }
  return suma;
}

/**
 * Nuevas acusadas por el recuento de Laudes (R 58–59): el total más alto,
 * y en empate máximo, todas las empatadas.
 * @param {Object<string, number>} suma
 * @returns {string[]} uuids de Hermanas acusadas (vacío si no hay totals)
 */
export function acusadasPorRecuento(suma) {
  const valores = Object.values(suma);
  if (!valores.length) return [];
  const maximo = Math.max(...valores);
  return Object.entries(suma).filter(([, v]) => v === maximo).map(([uuid]) => uuid);
}

/** Límite de inversiones de La Jueza: una por Hermana, sin recuperarlas (R 66–69). */
export const limiteInversiones = nHermanas => Math.max(1, Number(nHermanas) || 0);

/**
 * Concepto vigente de un arcano de escena: positivo salvo que esté invertida.
 * @param {{arcano:string, invertida:boolean}} mayor
 * @param {boolean} [incluirEjemplo] añade el ejemplo de dirección en la lista
 */
export function conceptoDe(mayor, incluirEjemplo = false) {
  const arcano = MAYOR_POR_ROMANO[mayor.arcano];
  if (!arcano) return "";
  return mayor.invertida
    ? (incluirEjemplo ? `${arcano.neg} · Concepto de dirección (invertida)` : arcano.neg)
    : (incluirEjemplo ? `${arcano.pos} · Concepto de jugadora` : arcano.pos);
}

/** ¿Cuántos robos de menores le quedan a una Hermana? */
export function robosRestantes(menores, uuid, limite) {
  const usados = (menores ?? []).filter(m => m.robadaPor === uuid).length;
  return Math.max(0, limite - usados);
}

/** Orden de mando de una escena compartida: el número más alto domina (R 38–40). */
export function ordenarMayores(mayores) {
  return [...(mayores ?? [])].sort((a, b) => {
    const oa = MAYOR_POR_ROMANO[a.arcano]?.orden ?? -1;
    const ob = MAYOR_POR_ROMANO[b.arcano]?.orden ?? -1;
    return ob - oa;
  });
}

/** Quién inicia la narración con las cartas de preparación (R 27, a verificar). */
export function quienInicia(mayores) {
  const ordenados = ordenarMayores(mayores);
  return ordenados.at(-1)?.hermana ?? ordenados[0]?.hermana ?? "";
}

export { ARCANOS };
