/**
 * El tapiz: escenas de fondo para ambientar. Las ocho viven en el compendio
 * «Escenarios»; al elegir una se importa al mundo (una sola vez) y se activa.
 */
import { ID } from "./mesa.mjs";
import { DialogV2 } from "./compat.mjs";

/** Fondo que acompaña a cada hora si la mesa lo activa. */
export const FONDOS_POR_HORA = {
  prima: "ermita-sierra", sexta: "plaza-pueblo", visperas: "ermita-sierra", completas: "bosque-noche",
  maitines: "molino-viejo", laudes: "iglesia-nave", final: "calabozo"
};

/** [clave, nombre] de las ocho escenas, leídas del compendio. */
export async function listaFondos() {
  const pack = game.packs.get(`${ID}.escenarios`);
  if (!pack) return [];
  const indice = await pack.getIndex({ fields: ["flags"] });
  return indice.contents.filter(e => e.flags?.[ID]?.escenario).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)).map(e => ({ clave: e.flags[ID].escenario, nombre: e.name, id: e._id }));
}

/** Importa (si falta) y activa la escena de fondo `clave`. Solo el GM. */
export async function activarFondo(clave) {
  if (!game.user.isGM) return null;
  let escena = game.scenes.find(s => s.getFlag(ID, "escenario") === clave);
  if (!escena) {
    const fondo = (await listaFondos()).find(f => f.clave === clave);
    if (!fondo) return ui.notifications.warn("No encuentro esa escena en el compendio «Escenarios».");
    escena = await game.scenes.importFromCompendium(game.packs.get(`${ID}.escenarios`), fondo.id, {}, { keepId: false });
  }
  if (escena && !escena.active) await escena.activate();
  return escena;
}

/** Diálogo para elegir el fondo de la mesa. */
export async function elegirFondo() {
  if (!game.user.isGM) return ui.notifications.warn("Solo quien dirige cambia el fondo.");
  const fondos = await listaFondos();
  if (!fondos.length) return ui.notifications.warn("El compendio «Escenarios» no está disponible.");
  const actual = game.scenes.active?.getFlag(ID, "escenario");
  const opciones = fondos.map(f => `<option value="${f.clave}" ${f.clave === actual ? "selected" : ""}>${foundry.utils.escapeHTML(f.nombre)}</option>`).join("");
  const clave = await DialogV2.prompt({
    window: { title: "Fondo de la mesa", icon: "fa-solid fa-image" },
    content: `<label class="nb-campo"><span>Escena de fondo</span><select name="fondo" style="width:100%">${opciones}</select></label><p class="nb-nota">Se activa para toda la mesa. Las ocho están en el compendio «Escenarios».</p>`,
    ok: { label: "Poner fondo", icon: "fa-solid fa-image", callback: (ev, boton) => boton.form.elements.fondo.value },
    rejectClose: false
  });
  if (clave) await activarFondo(clave);
}
