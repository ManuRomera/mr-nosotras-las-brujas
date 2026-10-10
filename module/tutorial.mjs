/**
 * Tutorial guiado con los «tours» de Foundry (foundry.nue.Tour), como los que
 * trae el propio Foundry. Los pasos viven en `tours/*.json`; lo que hay que
 * preparar antes de cada paso (abrir una ventana, activar una pestaña) se
 * declara aquí en `ANTES`. Si un elemento de un paso no existe, el paso se
 * muestra centrado en lugar de romper el tour.
 *
 * Pieza reutilizable: para otro sistema basta cambiar ID, TOURS y ANTES.
 */
import { ID } from "./mesa.mjs";
import { DialogV2 } from "./compat.mjs";
import { TrackerJueza } from "./apps/jueza.mjs";

const TOURS = [
  { clave: "intro", ruta: `systems/${ID}/tours/intro.json` },
  { clave: "hermana", ruta: `systems/${ID}/tours/hermana.json` }
];

const esperar = ms => new Promise(r => setTimeout(r, ms));
const unaHermana = () => game.actors.find(a => a.type === "hermana" && a.isOwner) ?? game.actors.find(a => a.type === "hermana");

/** Preparación de cada paso: `<tour>.<paso>` → función. */
const ANTES = {
  "intro.fichas": async () => ui.actors?.activate?.(),
  "intro.boton-jueza": async () => ui.actors?.activate?.(),
  "intro.tracker": async () => { await TrackerJueza.abrir(); await esperar(500); },
  "intro.hoja": async () => { await abrirHoja(); },
  "intro.vinculos": async () => { await abrirHoja(); },
  "intro.seguridad": async () => { await TrackerJueza.abrir(); await esperar(300); },
  "intro.ajustes": async () => ui.settings?.activate?.(),
  "intro.fin": async () => { for (const app of foundry.applications.instances.values()) if (app.options?.classes?.includes("nb-tracker") || app.options?.classes?.includes("nb-hermana")) await app.close(); },
  "hermana.fichas": async () => ui.actors?.activate?.(),
  "hermana.hoja": async () => { await abrirHoja(); },
  "hermana.vinculos": async () => { await abrirHoja(); },
  "hermana.sospechas": async () => { await abrirHoja(); },
  "hermana.chat": async () => ui.chat?.activate?.(),
  "hermana.fin": async () => { for (const app of foundry.applications.instances.values()) if (app.options?.classes?.includes("nb-hermana")) await app.close(); }
};

async function abrirHoja() {
  const actor = unaHermana();
  if (!actor) return;
  if (!actor.sheet.rendered) await actor.sheet.render(true);
  await esperar(500);
  actor.sheet.setPosition({ left: Math.max(20, window.innerWidth - 820 - 340), top: 20 });
}

class TourSistema extends foundry.nue.Tour {
  async _preStep() {
    await super._preStep();
    const paso = this.currentStep;
    try { await ANTES[`${this.id}.${paso.id}`]?.(); } catch (error) { console.warn(`${ID} | tutorial: no se pudo preparar «${paso.id}»`, error); }
    // Un elemento que no existe (p. ej. aún no hay Hermanas) no debe romper el tour.
    if (paso.selector && !document.querySelector(paso.selector)) paso.selector = "";
  }
}

export async function registrarTutorial() {
  for (const { clave, ruta } of TOURS) {
    try { game.tours.register(ID, clave, await TourSistema.fromJSON(ruta)); }
    catch (error) { console.error(`${ID} | no se pudo registrar el tour «${clave}»`, error); }
  }
}

/** Arranca un tour del sistema; si ya hay otro en marcha, Foundry avisa. */
export function empezarTutorial(clave = game.user.isGM ? "intro" : "hermana") {
  return game.tours.get(`${ID}.${clave}`)?.start();
}

/** La primera vez que entra alguien, se le ofrece el tutorial (una sola vez por navegador y mundo). */
export async function ofrecerTutorial() {
  if (game.settings.get(ID, "tutorialOfrecido")) return;
  await game.settings.set(ID, "tutorialOfrecido", true);
  const quiere = await DialogV2.confirm({
    window: { title: "¿Te enseño cómo se juega?", icon: "fa-solid fa-graduation-cap" },
    content: "<p>Hay un tutorial guiado de unos tres minutos que te lleva por el tracker, las fichas y las cartas. Puedes repetirlo cuando quieras desde el botón del tracker o desde Configuración → Tours.</p>",
    yes: { label: "Empezar el tutorial", icon: "fa-solid fa-graduation-cap" },
    no: { label: "Ahora no" },
    rejectClose: false
  });
  if (quiere) empezarTutorial();
}
