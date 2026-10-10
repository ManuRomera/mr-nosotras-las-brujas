/**
 * MR- Nosotras, las brujas · punto de entrada.
 * Aquí solo se registran piezas y hooks; la lógica vive en `module/`.
 */
import { ApplicationV2, DocumentSheetConfig, anadirHerramienta, diagnostico, generacion } from "./module/compat.mjs";
import { ID, registrarAjustes, escucharSocket, sesion, cambiarSesion } from "./module/mesa.mjs";
import { MODELOS } from "./module/modelos.mjs";
import { HojaHermana } from "./module/hojas/hermana.mjs";
import { HojaPnj, HojaPueblo } from "./module/hojas/secundarias.mjs";
import { TrackerJueza } from "./module/apps/jueza.mjs";
import { escucharChat, publicar } from "./module/chat.mjs";
import { asegurarMazo } from "./module/tarot.mjs";
import { registrarAccesibilidad } from "./module/accesibilidad.mjs";
import { pintarRetratos, repintarRetratos } from "./module/retrato.mjs";
import { registrarSonido } from "./module/sonido.mjs";
import { PanelSeguridad, registrarSeguridad } from "./module/apps/seguridad.mjs";
import { PanelDiagnostico } from "./module/apps/diagnostico.mjs";
import { registrarLupa } from "./module/lupa.mjs";
import { registrarTutorial, empezarTutorial, ofrecerTutorial } from "./module/tutorial.mjs";
import { activarFondo, elegirFondo } from "./module/escenario.mjs";
import "./module/mr-credits.mjs";

Hooks.once("init", () => {
  Object.assign(CONFIG.Actor.dataModels, MODELOS);

  const hojas = { hermana: HojaHermana, pnj: HojaPnj, pueblo: HojaPueblo };
  for (const [tipo, Hoja] of Object.entries(hojas)) {
    DocumentSheetConfig.registerSheet(Actor, ID, Hoja, { types: [tipo], makeDefault: true, label: "MR- Nosotras, las brujas" });
  }

  registrarAjustes();
  registrarAccesibilidad();
  registrarSonido();
  registrarLupa();
  game.settings.register(ID, "mesaOculta", { scope: "client", config: false, type: Boolean, default: false });
  game.settings.registerMenu(ID, "tutorialMenu", {
    name: "Tutorial guiado",
    label: "Empezar el tutorial",
    hint: "Un paseo guiado por la mesa, las fichas y las cartas. También está en Configuración → Tours.",
    icon: "fa-solid fa-graduation-cap",
    type: class extends ApplicationV2 { async render() { empezarTutorial(); return this; } },
    restricted: false
  });
  game.settings.register(ID, "tutorialOfrecido", { scope: "client", config: false, type: Boolean, default: false });
  registrarSeguridad();
  game.settings.registerMenu(ID, "diagnosticoMenu", {
    name: "Diagnóstico",
    label: "Comprobar el sistema",
    hint: "Comprueba mazos, imágenes y la partida guardada, y deja un informe copiable.",
    icon: "fa-solid fa-stethoscope",
    type: class extends ApplicationV2 { async render() { PanelDiagnostico.abrir(); return this; } },
    restricted: false
  });

  game.mrNosotras = {
    abrirJueza: () => TrackerJueza.abrir(),
    abrirSeguridad: () => PanelSeguridad.abrir(),
    elegirFondo,
    tutorial: empezarTutorial,
    activarFondo,
    abrirDiagnostico: () => PanelDiagnostico.abrir(),
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
  PanelSeguridad.iniciar();
  await registrarTutorial();
  // Toda la pantalla es la mesa: se muestra al entrar, salvo que esa persona la haya ocultado.
  if (game.settings.get(ID, "mesaOculta")) TrackerJueza.pastilla();
  else TrackerJueza.abrir();
  console.info(`MR- Nosotras, las brujas ${game.system.version} · Foundry ${game.version} (generación ${generacion()})`);
  if (game.user.isGM) {
    await asegurarMazo();
    await bienvenida();
  }
  // La primera vez, el propio sistema ofrece el tutorial guiado (como hace Foundry con el suyo).
  setTimeout(() => ofrecerTutorial(), 2500);
});

/** Una tarjeta de bienvenida por versión, solo para quien administra el mundo. */
async function bienvenida() {
  if (game.settings.get(ID, "bienvenida") === game.system.version) return;
  await game.settings.set(ID, "bienvenida", game.system.version);
  // Un mundo sin escena activa se queda en gris: ponemos la plaza del pueblo para ambientar.
  if (!game.scenes.active) await activarFondo("plaza-pueblo");
  await publicar({
    banner: `systems/${ID}/assets/portadas/portada.webp`,
    tipo: "bienvenida", tono: "fase", icono: "fa-solid fa-hat-wizard", alias: "La Jueza",
    etiqueta: `MR- Nosotras, las brujas ${game.system.version}`,
    titulo: "El pueblo ya habla: hay una acusada",
    texto: "Los mazos están listos. La mesa de La Jueza ocupa la pantalla: desde ahí diriges las fases y las escenas, crea las Hermanas con sus hojas y separad los roles: una Jueza, las demás Hermanas.",
    botones: [
      { etiqueta: "La mesa de La Jueza", icono: "fa-solid fa-scale-unbalanced", accion: "jueza" },
      { etiqueta: "Ayudas de juego", icono: "fa-solid fa-book-open", accion: "ayudas" },
      { etiqueta: "Tutorial guiado", icono: "fa-solid fa-graduation-cap", accion: "tutorial" },
      { etiqueta: "Seguridad", icono: "fa-solid fa-shield-heart", accion: "seguridad" },
      { etiqueta: "Fondo de la mesa", icono: "fa-solid fa-image", accion: "fondo" },
      { etiqueta: "Dado de 1d6", icono: "fa-solid fa-dice-six", accion: "dado" }
    ]
  });
}

/** Las fichas nuevas estrenan un retrato del sistema en lugar del misterioso de Foundry. */
const RETRATOS = { hermana: ["hermana-1", "hermana-2", "hermana-3", "hermana-4", "hermana-5", "hermana-6"], pnj: ["pnj-1", "pnj-2", "pnj-3"], pueblo: ["pueblo"] };
Hooks.on("preCreateActor", (actor, datos) => {
  const lista = RETRATOS[actor.type];
  if (!lista || (datos.img && datos.img !== Actor.DEFAULT_ICON)) return;
  const img = `systems/${ID}/assets/retratos/${lista[Math.floor(Math.random() * lista.length)]}.webp`;
  actor.updateSource({ img, "prototypeToken.texture.src": img });
});

/** El estado de la partida cambia: se repinta la mesa y las hojas de Hermana. */
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
  boton.innerHTML = `<i class="fa-solid fa-scale-unbalanced" inert></i><span>La mesa de La Jueza</span>`;
  boton.addEventListener("click", () => TrackerJueza.abrir());
  acciones.append(boton);
});

/** Herramientas en la barra de tokens: la mesa de La Jueza y la seguridad en mesa, a un clic. */
Hooks.on("getSceneControlButtons", controles => {
  anadirHerramienta(controles, "tokens", {
    name: "nbSeguridad",
    title: "Seguridad en mesa",
    icon: "fa-solid fa-shield-heart",
    onChange: () => PanelSeguridad.abrir()
  });
  anadirHerramienta(controles, "tokens", {
    name: "nbJueza",
    title: "La mesa de La Jueza",
    icon: "fa-solid fa-scale-unbalanced",
    onChange: () => (foundry.applications.instances.get("nb-tracker")?.rendered ? TrackerJueza.ocultar() : TrackerJueza.abrir())
  });
});
