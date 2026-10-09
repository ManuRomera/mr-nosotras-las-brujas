/**
 * Base de todas las hojas: V2 + Handlebars + memoria de ventana.
 * Comportamiento común: candado de edición, secciones plegables, imagen,
 * arrastrar un Actor sobre una casilla de vínculo y listas editables.
 */
import { ActorSheetV2, HandlebarsApplicationMixin, enriquecer } from "../compat.mjs";
import { ConMemoria } from "../memoria.mjs";
import { ID } from "../mesa.mjs";
import { EditorRetrato, pintarRetratos } from "../retrato.mjs";

export class HojaNB extends ConMemoria(HandlebarsApplicationMixin(ActorSheetV2)) {
  static DEFAULT_OPTIONS = {
    classes: ["mr-nosotras-las-brujas", "nb-hoja"],
    form: { submitOnChange: true },
    window: { resizable: true },
    actions: {
      editar: HojaNB.#editar,
      retrato: HojaNB.#retrato,
      compacto: HojaNB.#compacto,
      cajon: HojaNB.#cajon,
      abrir: HojaNB.#abrir,
      anadirFila: HojaNB.#anadirFila,
      quitarFila: HojaNB.#quitarFila
    }
  };

  static SCROLL_MEMORIA = [".nb-principal"];
  /** Secciones plegables de la hoja y si nacen abiertas. */
  static SECCIONES = {};

  /** Candado: los borrados y el retrato solo se tocan desbloqueando. */
  editando = false;
  /** Cajón desplegado ahora mismo (no se recuerda entre sesiones). */
  cajonAbierto = null;

  get title() {
    return this.document.name;
  }

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const actor = this.document;
    return {
      ...base,
      actor,
      system: actor.system,
      editable: this.isEditable,
      editando: this.isEditable && this.editando,
      compacto: this.compacto,
      cajon: this.cajonAbierto,
      notas: await enriquecer(actor.system.notas, actor),
      secciones: Object.fromEntries(Object.entries(this.constructor.SECCIONES).map(([id, def]) => [id, this.abierto(id, def)]))
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.classList.toggle("compacto", this.compacto);
    this.element.classList.toggle("editando", this.editando);
    pintarRetratos(this.element);
    if (this.cajonAbierto) this.element.querySelector(".nb-cajon")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  /** Si se reescribe a mano el nombre de un vínculo, deja de apuntar al Actor que tenía enlazado. */
  _processFormData(event, form, formData) {
    const datos = super._processFormData(event, form, formData);
    for (const [clave, v] of Object.entries(datos.system?.vinculos ?? {})) {
      const antes = this.document.system.vinculos?.[clave];
      if (antes?.uuid && v.quien !== undefined && v.quien !== antes.quien) v.uuid = "";
    }
    return datos;
  }

  /** Soltar un Actor sobre [data-soltar="system.vinculos.2"] rellena quién es y lo enlaza. */
  async _onDropActor(event, actor) {
    const destino = event.target.closest("[data-soltar]")?.dataset.soltar;
    if (!destino || !this.isEditable || actor.uuid === this.document.uuid) return null;
    await this.document.update({ [`${destino}.quien`]: actor.name, [`${destino}.uuid`]: actor.uuid });
    return actor;
  }

  static #editar() {
    this.editando = !this.editando;
    this.render();
  }

  static #retrato() {
    return EditorRetrato.abrir(this.document);
  }

  static #compacto() {
    this.alternarCompacto();
  }

  static #cajon(event, boton) {
    this.cajonAbierto = this.cajonAbierto === boton.dataset.cajon ? null : boton.dataset.cajon;
    this.render();
  }

  static async #abrir(event, boton) {
    const doc = boton.dataset.uuid ? await fromUuid(boton.dataset.uuid) : null;
    doc?.sheet.render(true);
  }

  /** Añade una fila a una lista del sistema: data-lista="rasgos", data-valores='{"texto":"…"}'. */
  static async #anadirFila(event, boton) {
    const ruta = `system.${boton.dataset.lista}`;
    const lista = foundry.utils.deepClone(foundry.utils.getProperty(this.document, ruta)) ?? [];
    const campo = boton.dataset.campo ?? "texto";
    const valores = boton.dataset.valores ? JSON.parse(boton.dataset.valores) : {};
    const escrito = this.element.querySelector(`[data-nueva="${boton.dataset.lista}"]`);
    valores[campo] ??= boton.dataset.texto ?? escrito?.value?.trim() ?? "";
    lista.push(valores);
    this.cajonAbierto = null;
    await this.document.update({ [ruta]: lista });
    if (escrito) escrito.value = "";
  }

  static async #quitarFila(event, boton) {
    const ruta = `system.${boton.dataset.lista}`;
    const lista = foundry.utils.deepClone(foundry.utils.getProperty(this.document, ruta));
    lista.splice(Number(boton.dataset.indice), 1);
    await this.document.update({ [ruta]: lista });
  }
}
