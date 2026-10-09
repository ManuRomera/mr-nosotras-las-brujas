/**
 * Hojas secundarias: PNJ (R 24: identidad, papel, descriptor e impulso,
 * con el arquetipo que trae su arcano) y Pueblo (R 17–18, 25).
 */
import { HojaNB } from "./base.mjs";
import { RUTA } from "../mesa.mjs";
import { ARCANOS } from "../listas.mjs";

export class HojaPnj extends HojaNB {
  static DEFAULT_OPTIONS = {
    classes: ["nb-pnj"],
    position: { width: 520, height: "auto" },
    window: { icon: "fa-solid fa-masks-theater" }
  };

  static PARTS = {
    hoja: { template: `${RUTA}/templates/hojas/pnj.hbs`, scrollable: [".nb-principal"] }
  };

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    ctx.opcionesArcano = [{ romano: "", nombre: "Sin arcano" }, ...ARCANOS]
      .map(a => ({ ...a, elegido: a.romano === this.document.system.arcano }));
    return ctx;
  }
}

export class HojaPueblo extends HojaNB {
  static DEFAULT_OPTIONS = {
    classes: ["nb-pueblo"],
    position: { width: 640, height: 720 },
    window: { icon: "fa-solid fa-house-chimney" }
  };

  static COMPACTO = { width: 340, height: 720 };
  static SECCIONES = { rasgos: true, notas: false };

  static PARTS = {
    hoja: { template: `${RUTA}/templates/hojas/pueblo.hbs`, scrollable: [".nb-principal"] }
  };

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    ctx.rasgos = (this.document.system.rasgos ?? []).map((r, i) => ({ ...r, i }));
    return ctx;
  }
}
