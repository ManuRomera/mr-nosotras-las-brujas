/**
 * Diagnóstico legible y copiable: lo que hay que enviar cuando algo falla.
 * Comprueba los mazos, el compendio, los recursos y que la partida guardada
 * apunte a cartas que existen.
 */
import { ID, RUTA, sesion, hermanas } from "../mesa.mjs";
import { ApplicationV2 } from "../compat.mjs";
import { ConMemoria } from "../memoria.mjs";
import { diagnostico } from "../compat.mjs";
import { ARCANOS, MARCADORES, PINTAS } from "../listas.mjs";
import { asegurarMazo, pila } from "../tarot.mjs";

const existe = async src => {
  try { return (await fetch(src, { method: "HEAD", cache: "no-store" })).ok; } catch { return false; }
};

/** Rutas de las 78 caras, los marcadores, el dorso y la portada. */
const recursos = () => [
  ...ARCANOS.map(a => `${RUTA}/assets/tarot/mayores/${a.romano}.svg`),
  ...Object.values(MARCADORES).map(m => `${RUTA}/assets/tarot/mayores/${m.romano}.svg`),
  ...Object.keys(PINTAS).flatMap(p => Array.from({ length: 14 }, (_, i) => `${RUTA}/assets/tarot/menores/${p}-${i + 1}.svg`)),
  `${RUTA}/assets/tarot/dorso.svg`, `${RUTA}/assets/portadas/portada.svg`
];

export async function informe() {
  const estado = sesion();
  const faltan = (await Promise.all(recursos().map(async r => [r, await existe(r)]))).filter(([, ok]) => !ok).map(([r]) => r);
  const mayores = pila("mayores"), menores = pila("menores"), escena = pila("escena"), sospechas = pila("sospechas");
  const huerfanos = [
    ...estado.menores.filter(m => m.id && !sospechas?.cards.has(m.id)).map(m => `sospecha ${m.nombre}`),
    ...(estado.escena?.mayores ?? []).filter(m => m.id && !escena?.cards.has(m.id)).map(m => `mayor ${m.nombre}`)
  ];
  const comprobaciones = [
    // Al robar, el original sigue en el mazo (marcado como robado): el mazo siempre tiene todas las cartas.
    { ok: mayores?.cards.size === ARCANOS.length, texto: `Arcanos mayores: ${mayores?.cards.size ?? 0}/${ARCANOS.length}` },
    { ok: menores?.cards.size === 56, texto: `Arcanos menores: ${menores?.cards.size ?? 0}/56` },
    { ok: !faltan.length, texto: faltan.length ? `Faltan ${faltan.length} imágenes: ${faltan.slice(0, 3).join(", ")}…` : `Imágenes del tarot: ${recursos().length}/${recursos().length}` },
    { ok: huerfanos.length === 0, texto: huerfanos.length ? `La partida cita cartas que ya no están: ${huerfanos.join(", ")}` : "La partida apunta a cartas que existen" },
    { ok: game.packs.get(`${ID}.ayudas`)?.index.size > 0, texto: `Ayudas de juego: ${game.packs.get(`${ID}.ayudas`)?.index.size ?? 0} diarios` },
    { ok: hermanas().length > 0, texto: `Hermanas en el mundo: ${hermanas().length}`, aviso: true }
  ];
  const datos = {
    ...diagnostico(),
    mundo: game.world.id,
    usuario: { gm: game.user.isGM, idioma: game.i18n.lang },
    partida: { fase: estado.fase, escenas: estado.escenas, menores: estado.menores.length, acusadas: estado.acusadas.length },
    mazos: Object.fromEntries(["mayores", "menores", "escena", "sospechas"].map(c => [c, pila(c)?.cards.size ?? null])),
    imagenesQueFaltan: faltan,
    dado3d: Boolean(game.dice3d),
    ajustes: Object.fromEntries(["valoresFiguras", "robosPorHermana", "destinatarias", "dadoJueza", "sonido", "a11yOscuro"].map(k => [k, game.settings.get(ID, k)]))
  };
  return { comprobaciones, datos };
}

export class PanelDiagnostico extends ConMemoria(ApplicationV2) {
  static MEMORIA = "diagnostico";
  static DEFAULT_OPTIONS = {
    id: "nb-diagnostico", classes: ["mr-nosotras-las-brujas", "nb-dialogo", "nb-diagnostico"],
    position: { width: 560, height: "auto" },
    window: { title: "Diagnóstico", icon: "fa-solid fa-stethoscope" }
  };

  #json = "";

  static abrir() {
    return (foundry.applications.instances.get("nb-diagnostico") ?? new PanelDiagnostico()).render({ force: true });
  }

  async _renderHTML() {
    const { comprobaciones, datos } = await informe();
    this.#json = JSON.stringify(datos, null, 2);
    const todoBien = comprobaciones.every(c => c.ok || c.aviso);
    const filas = comprobaciones.map(c => `<li class="${c.ok ? "ok" : c.aviso ? "aviso" : "mal"}"><i class="fa-solid ${c.ok ? "fa-circle-check" : c.aviso ? "fa-circle-info" : "fa-triangle-exclamation"}"></i> ${foundry.utils.escapeHTML(c.texto)}</li>`).join("");
    return `<div class="nb-dialogo-cuerpo">
      <p class="nb-diag-resumen ${todoBien ? "ok" : "mal"}">${todoBien ? "Todo en orden." : "Hay cosas que revisar."}</p>
      <ul class="nb-diag-lista">${filas}</ul>
      <label class="nb-campo"><span>Para copiar cuando haya que contar un fallo</span><textarea readonly rows="8">${foundry.utils.escapeHTML(this.#json)}</textarea></label>
      <div class="nb-pie-formulario">
        <button type="button" class="nb-boton nb-boton-suave" data-diag="reparar" data-tooltip="Vuelve a crear los mazos que falten"><i class="fa-solid fa-wrench"></i> Reparar mazos</button>
        <span><button type="button" class="nb-boton" data-diag="actualizar"><i class="fa-solid fa-rotate"></i> Actualizar</button>
        <button type="button" class="nb-boton nb-boton-principal" data-diag="copiar"><i class="fa-solid fa-copy"></i> Copiar</button></span>
      </div>
    </div>`;
  }

  _replaceHTML(html, contenido) {
    contenido.innerHTML = html;
    contenido.querySelector("[data-diag=actualizar]")?.addEventListener("click", () => this.render());
    contenido.querySelector("[data-diag=reparar]")?.addEventListener("click", async () => {
      if (!game.user.isGM) return ui.notifications.warn("Solo quien dirige puede reparar los mazos.");
      await asegurarMazo();
      this.render();
    });
    contenido.querySelector("[data-diag=copiar]")?.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(this.#json); ui.notifications.info("Diagnóstico copiado."); }
      catch { contenido.querySelector("textarea")?.select(); }
    });
  }
}
