/**
 * Estado de la partida: fase, escena en marcha, arcanos robados, sospechas,
 * acusaciones y las facultades de La Jueza.
 *
 * La Jueza actúa desde el cliente GM: los ajustes de mundo solo los escribe un
 * GM, así que cualquier otra persona que pida un cambio lo manda por socket.
 */
import { olvidarTodo } from "./memoria.mjs";
import { ApplicationV2 } from "./compat.mjs";
import { ORDEN_FASES } from "./listas.mjs";

export const ID = "mr-nosotras-las-brujas";
export const SOCKET = `system.${ID}`;
export const RUTA = `systems/${ID}`;

export const SESION_INICIAL = {
  fase: "prima",
  directora: "",
  acusadaInicial: "",
  acusadas: [],
  inversionesUsadas: 0,
  escenas: 0,
  escena: null,
  menores: [],
  reloj: 0
};

/** Abrir el ajuste desde el menú borra la memoria de ventanas sin abrir nada. */
class RestablecerVentanas extends ApplicationV2 {
  async render() {
    olvidarTodo();
    ui.notifications.info("Posiciones, tamaños y pestañas olvidadas en este navegador.");
    return this;
  }
}

export function registrarAjustes() {
  game.settings.register(ID, "sesion", {
    scope: "world", config: false, type: Object, default: SESION_INICIAL,
    onChange: () => Hooks.callAll("nlb.sesion", sesion())
  });
  game.settings.register(ID, "bienvenida", { scope: "world", config: false, type: String, default: "" });
  game.settings.register(ID, "valoresFiguras", {
    name: "Valores de las figuras",
    hint: "Sota, Caballero, Dama y Rey. En la baraja de Marsella los números son 11, 12, 13 y 14; ajústalos a la tabla exacta de tu baraja.",
    scope: "world", config: true, type: Array, default: [11, 12, 13, 14]
  });
  game.settings.register(ID, "robosPorHermana", {
    name: "Robos de menores por Hermana",
    hint: "Cada Hermana debe terminar con este número de cartas menores robadas. Dos es lo habitual: una para conservar y otra para entregar.",
    scope: "world", config: true, type: Number, default: 2, range: { min: 1, max: 6, step: 1 }
  });
  game.settings.register(ID, "destinatarias", {
    name: "Destinatarias de las cartas entregadas",
    hint: "A quién se puede entregar boca abajo un arcano menor (según la edición, también puede ser la acusada inicial).",
    scope: "world", config: true, type: String, default: "hermanas",
    choices: {
      hermanas: "Otras Hermanas",
      conAcusada: "Otras Hermanas o la acusada inicial"
    }
  });
  game.settings.register(ID, "fondoPorHoras", {
    name: "Cambiar el fondo con cada hora",
    hint: "Al cambiar de hora en la mesa se activa una escena de fondo distinta del compendio «Escenarios».",
    scope: "world", config: true, type: Boolean, default: false
  });
  game.settings.register(ID, "dadoJueza", {
    name: "Dado opcional de 1d6",
    hint: "Ofrece la tabla de consecuencias (Sí, pero… / No, y además…) como tarjeta de chat.",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.registerMenu(ID, "ventanas", {
    name: "Memoria de ventanas",
    label: "Olvidar posiciones",
    hint: "Las ventanas del sistema recuerdan posición, tamaño, pestaña y secciones plegadas en este navegador.",
    icon: "fa-solid fa-window-restore",
    type: RestablecerVentanas,
    restricted: false
  });
}

/** Estado actual de la partida, con los campos por defecto rellenados. */
export function sesion() {
  return { ...SESION_INICIAL, ...game.settings.get(ID, "sesion") };
}

/** Fase actual según el orden Prima → Final (R 42). */
export function fase() {
  const s = sesion();
  return ORDEN_FASES.includes(s.fase) ? s.fase : "prima";
}

/** Hermanas creadas en el mundo. */
export function hermanas() {
  return game.actors.filter(a => a.type === "hermana");
}

/** Actor de una Hermana por su uuid, si existe. */
export const hermana = uuid => game.actors.get(uuid?.split(".").pop()) ?? null;

/**
 * Cambia el estado de la partida. Los cambios van de arriba abajo: `escena` y
 * `menores` se sustituyen enteros; se recomienda partir de `sesion()`.
 */
export async function cambiarSesion(cambios) {
  if (game.user.isGM) {
    await game.settings.set(ID, "sesion", { ...sesion(), ...cambios });
    return;
  }
  return pedir("sesion", { cambios });
}

const OPERACIONES = {
  // Lo que llega por socket se filtra: solo claves conocidas de la sesión.
  async sesion({ cambios }) {
    const validos = Object.fromEntries(Object.entries(cambios ?? {}).filter(([k]) => k in SESION_INICIAL));
    await game.settings.set(ID, "sesion", { ...sesion(), ...validos });
  }
};

/** Ejecuta la operación aquí si se puede; si no, se la pide al GM activo. */
export async function pedir(op, datos) {
  if (game.user.isGM) return OPERACIONES[op](datos);
  if (!game.users.activeGM) {
    ui.notifications.warn("Hace falta un GM conectado para cambiar el estado de la partida.");
    return;
  }
  game.socket.emit(SOCKET, { op, datos, de: game.userId });
}

export function escucharSocket() {
  game.socket.on(SOCKET, ({ op, datos, de } = {}) => {
    // Solo el GM activo aplica operaciones, y solo si las manda otro GM.
    const quien = de ? game.users.get(de) : null;
    if (game.users.activeGM?.isSelf && OPERACIONES[op] && quien?.isGM) OPERACIONES[op](datos);
  });
}
