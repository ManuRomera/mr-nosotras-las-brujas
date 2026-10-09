/**
 * Seguridad en mesa. El juego trata de persecución, misoginia y ejecución:
 * Pausa, Velo y Tarjeta X llegan a toda la mesa al instante y sin decir quién
 * las activó, y las líneas y velos acordados viven a la vista.
 *
 * Las señales viajan por socket y no se guardan en ningún sitio.
 */
import { ID, SOCKET } from "../mesa.mjs";
import { ApplicationV2, HandlebarsApplicationMixin } from "../compat.mjs";
import { ConMemoria } from "../memoria.mjs";

const SENALES = {
  pausa: { icono: "fa-pause", titulo: "Pausa", texto: "Alguien necesita parar un momento. Respirad, y retomad cuando todas estéis bien.", pantalla: true },
  velo: { icono: "fa-eye-slash", titulo: "Velo", texto: "Pasad por esta parte sin detalles: una elipsis, un corte de escena, y seguid.", pantalla: false },
  x: { icono: "fa-xmark", titulo: "Tarjeta X", texto: "Se quita este contenido de la partida, sin explicaciones ni preguntas. Reconducid la historia.", pantalla: true }
};

const aLista = texto => String(texto ?? "").split("\n").map(l => l.trim()).filter(Boolean);

export class PanelSeguridad extends ConMemoria(HandlebarsApplicationMixin(ApplicationV2)) {
  static MEMORIA = "seguridad";
  static CAMPOS_MEMORIA = ["left", "top"];
  static DEFAULT_OPTIONS = {
    id: "nb-seguridad",
    classes: ["mr-nosotras-las-brujas", "nb-dialogo", "nb-seguridad"],
    position: { width: 460, height: "auto" },
    window: { title: "Seguridad en mesa", icon: "fa-solid fa-shield-heart" },
    actions: { senal: PanelSeguridad.#senal, guardar: PanelSeguridad.#guardar }
  };
  static PARTS = { cuerpo: { template: "systems/mr-nosotras-las-brujas/templates/apps/seguridad.hbs" } };

  static abrir() {
    return (foundry.applications.instances.get("nb-seguridad") ?? new PanelSeguridad()).render({ force: true });
  }

  /** Escucha las señales de otras personas y repinta el panel si cambian las líneas. */
  static iniciar() {
    game.socket.on(SOCKET, datos => {
      if (datos?.tipo === "seguridad") PanelSeguridad.mostrar(datos.senal);
      if (datos?.tipo === "seguridad-fin") PanelSeguridad.limpiar();
    });
  }

  async _prepareContext() {
    const { lineas, velos } = game.settings.get(ID, "seguridad");
    return {
      esGM: game.user.isGM,
      lineas, velos,
      lineasTexto: lineas.join("\n"), velosTexto: velos.join("\n"),
      senales: Object.entries(SENALES).map(([clave, s]) => ({ clave, ...s }))
    };
  }

  static #senal(event, boton) {
    const senal = boton.dataset.senal;
    if (!SENALES[senal]) return;
    game.socket.emit(SOCKET, { tipo: "seguridad", senal });
    PanelSeguridad.mostrar(senal);
  }

  static async #guardar() {
    if (!game.user.isGM) return;
    const raiz = this.element;
    await game.settings.set(ID, "seguridad", {
      lineas: aLista(raiz.querySelector("[name=lineas]")?.value),
      velos: aLista(raiz.querySelector("[name=velos]")?.value)
    });
    ui.notifications.info("Líneas y velos guardados.");
    this.render();
  }

  static limpiar() {
    document.querySelector(".nb-seguridad-senal")?.remove();
  }

  /** Aviso a pantalla completa (Pausa, X) o en una cinta (Velo). */
  static mostrar(clave) {
    const s = SENALES[clave];
    if (!s) return;
    PanelSeguridad.limpiar();
    const el = document.createElement("div");
    el.className = `mr-nosotras-las-brujas nb-seguridad-senal ${clave} ${s.pantalla ? "pantalla" : "cinta"}`;
    el.setAttribute("role", "alertdialog");
    el.setAttribute("aria-label", s.titulo);
    el.innerHTML = `<div class="nb-seguridad-caja"><i class="fa-solid ${s.icono}" aria-hidden="true"></i>
      <h2>${s.titulo}</h2><p>${s.texto}</p><button type="button" class="nb-boton nb-boton-principal">Seguimos</button></div>`;
    document.body.append(el);
    const boton = el.querySelector("button");
    boton.addEventListener("click", () => { game.socket.emit(SOCKET, { tipo: "seguridad-fin" }); PanelSeguridad.limpiar(); });
    boton.focus();
  }
}

export function registrarSeguridad() {
  game.settings.register(ID, "seguridad", {
    scope: "world", config: false, type: Object, default: { lineas: [], velos: [] },
    onChange: () => foundry.applications.instances.get("nb-seguridad")?.render()
  });
  game.settings.registerMenu(ID, "seguridadMenu", {
    name: "Seguridad en mesa",
    label: "Líneas, velos y pausa",
    hint: "Líneas y velos acordados, y las señales de Pausa, Velo y Tarjeta X (anónimas).",
    icon: "fa-solid fa-shield-heart",
    type: class extends ApplicationV2 { async render() { PanelSeguridad.abrir(); return this; } },
    restricted: false
  });
}
