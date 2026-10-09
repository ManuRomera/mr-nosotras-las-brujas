/**
 * MR- Nosotras, las brujas · punto de entrada.
 * Aquí solo se registran piezas y hooks; la lógica vive en `module/`.
 */
import { DocumentSheetConfig, anadirHerramienta, diagnostico, generacion } from "./module/compat.mjs";
import { ID, registrarAjustes, escucharSocket, sesion, cambiarSesion } from "./module/mesa.mjs";
import { MODELOS } from "./module/modelos.mjs";
import { HojaHermana } from "./module/hojas/hermana.mjs";
import { HojaPnj, HojaPueblo } from "./module/hojas/secundarias.mjs";
import { TrackerJueza } from "./module/apps/jueza.mjs";
import { escucharChat, publicar } from "./module/chat.mjs";
import { asegurarMazo } from "./module/tarot.mjs";
import { registrarAccesibilidad } from "./module/accesibilidad.mjs";
import { pintarRetratos, repintarRetratos } from "./module/retrato.mjs";

Hooks.once("init", () => {
  Object.assign(CONFIG.Actor.dataModels, MODELOS);

  const hojas = { hermana: HojaHermana, pnj: HojaPnj, pueblo: HojaPueblo };
  for (const [tipo, Hoja] of Object.entries(hojas)) {
    DocumentSheetConfig.registerSheet(Actor, ID, Hoja, { types: [tipo], makeDefault: true, label: "MR- Nosotras, las brujas" });
  }

  registrarAjustes();
  registrarAccesibilidad();

  game.mrNosotras = {
    abrirJueza: () => TrackerJueza.abrir(),
    asegurarMazo,
    cambiarSesion,
    diagnostico,
    publicar,
    sesion
  };
});

Hooks.once("ready", async () => {
  escucharSocket();
  escucharChat();
  console.info(`MR- Nosotras, las brujas ${game.system.version} · Foundry ${game.version} (generación ${generacion()})`);
  if (game.user.isGM) {
    await asegurarMazo();
    await bienvenida();
  }
});

/** Una tarjeta de bienvenida por versión, solo para quien administra el mundo. */
async function bienvenida() {
  if (game.settings.get(ID, "bienvenida") === game.system.version) return;
  await game.settings.set(ID, "bienvenida", game.system.version);
  await publicar({
    tipo: "bienvenida", tono: "fase", icono: "fa-solid fa-hat-wizard", alias: "La Jueza",
    etiqueta: `MR- Nosotras, las brujas ${game.system.version}`,
    titulo: "El pueblo ya habla: hay una acusada",
    texto: "Los mazos están listos. Abre el tracker para dirigir las fases y las escenas, crea las Hermanas con sus hojas y separad los roles: una Jueza, las demás Hermanas.",
    botones: [
      { etiqueta: "Tracker de La Jueza", icono: "fa-solid fa-scale-unbalanced", accion: "jueza" },
      { etiqueta: "Ayudas de juego", icono: "fa-solid fa-book-open", accion: "ayudas" },
      { etiqueta: "Dado de 1d6", icono: "fa-solid fa-dice-six", accion: "dado" }
    ]
  });
}

/** El estado de la partida cambia: se repinta el tracker y las hojas de Hermana. */
Hooks.on("nlb.sesion", () => {
  for (const app of foundry.applications.instances.values()) {
    if (app instanceof TrackerJueza || app instanceof HojaHermana) app.render();
  }
});

/** Retratos: al cambiar la imagen o su encuadre se repinta lo que ya está en pantalla. */
Hooks.on("updateActor", (actor, cambios) => {
  const flags = cambios.flags?.[ID];
  if ("img" in cambios || (flags && ("retrato" in flags || "-=retrato" in flags))) repintarRetratos();
});

/** Acceso directo en el directorio de Actores. */
Hooks.on("renderActorDirectory", (app, html) => {
  const raiz = html instanceof HTMLElement ? html : html[0];
  pintarRetratos(raiz);
  const acciones = raiz?.querySelector(".header-actions");
  if (!acciones || acciones.querySelector(".nb-boton-jueza")) return;
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "nb-boton-jueza";
  boton.innerHTML = `<i class="fa-solid fa-scale-unbalanced" inert></i><span>Tracker de La Jueza</span>`;
  boton.addEventListener("click", () => TrackerJueza.abrir());
  acciones.append(boton);
});

/** Herramienta en la barra de tokens: el tracker de La Jueza a un clic. */
Hooks.on("getSceneControlButtons", controles => {
  anadirHerramienta(controles, "tokens", {
    name: "nbJueza",
    title: "Tracker de La Jueza",
    icon: "fa-solid fa-scale-unbalanced",
    onChange: () => TrackerJueza.abrir()
  });
});
