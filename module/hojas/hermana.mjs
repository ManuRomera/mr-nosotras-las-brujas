/**
 * Hoja de Hermana: la hoja impresa del juego escrita como frases.
 * Frase de amenaza, lugar seguro, los cinco vínculos con su pregunta de arcano,
 * las sospechas que la rodean y notas.
 */
import { HojaNB } from "./base.mjs";
import { ID, RUTA, sesion } from "../mesa.mjs";
import { ARCANOS, PREGUNTAS_VINCULO, PINTAS } from "../listas.mjs";

const ETIQUETAS = {
  acusada: "Mi vínculo con la Hermana acusada",
  acusador: "Mi vínculo con",
  hermana: "Mi vínculo con la Hermana"
};

export class HojaHermana extends HojaNB {
  static DEFAULT_OPTIONS = {
    classes: ["nb-hermana"],
    position: { width: 760, height: 740 },
    window: { icon: "fa-solid fa-hat-wizard" }
  };

  static COMPACTO = { width: 340, height: 740 };
  static SECCIONES = { vinculos: true, sospechas: true, notas: false };

  static PARTS = {
    hoja: { template: `${RUTA}/templates/hojas/hermana.hbs`, scrollable: [".nb-principal"] }
  };

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const actor = this.document;
    const s = actor.system;
    const estado = sesion();

    ctx.vinculos = s.vinculos.map((v, i) => ({
      ...v,
      i,
      etiqueta: ETIQUETAS[v.tipo] ?? ETIQUETAS.hermana,
      pregunta: PREGUNTAS_VINCULO[v.arcano] ?? "",
      enlazado: v.uuid ? fromUuidSync(v.uuid) : null
    }));
    ctx.arcanos = [{ romano: "", nombre: "—" }, ...ARCANOS];

    const nombre = uuid => {
      const otro = uuid ? fromUuidSync(uuid) : null;
      return otro?.name ?? "otra Hermana";
    };
    // R 53: ella conoce las cartas que robó; lo que le entregan llega boca abajo.
    ctx.robadas = estado.menores
      .filter(m => m.robadaPor === actor.uuid)
      .map(m => ({ ...m, destino: m.modo === "entregar" && m.destinataria ? `Entregada a ${nombre(m.destinataria)}` : "Conservada" }));
    ctx.recibidas = estado.menores
      .filter(m => m.destinataria === actor.uuid && m.robadaPor !== actor.uuid)
      .map(m => ({ ...m, de: nombre(m.robadaPor), oculta: !m.revelada }));
    ctx.limite = game.settings.get(ID, "robosPorHermana");
    ctx.puedeRobar = ctx.robadas.length < ctx.limite;
    ctx.pintas = PINTAS;
    return ctx;
  }
}
