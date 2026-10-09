/**
 * Tracker de La Jueza: la escena en marcha, las siete fases con sus marcadores,
 * el robo de arcanos, las inversiones, las sospechas y el recuento de Laudes.
 *
 * Solo el cliente GM escribe; el resto de la mesa puede abrirla para mirar.
 */
import { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } from "../compat.mjs";
import { ConMemoria } from "../memoria.mjs";
import { ID, RUTA, sesion, cambiarSesion, hermanas, SESION_INICIAL } from "../mesa.mjs";
import { FASES, ORDEN_FASES, MARCADORES, MAYOR_POR_ROMANO, PINTAS } from "../listas.mjs";
import { conceptoDe, ordenarMayores, totales, duenaDe, acusadasPorRecuento, limiteInversiones } from "../reglas.mjs";
import { asegurarMazo, barajar, robarMayor, robarMenor, devolverEscena, recogerTodo, revelarMenores, datoMayor, datoMenor, pila, imgMayor, imgMenor } from "../tarot.mjs";
import { chatMayor, chatMenor, chatFase, chatLaudes, dado } from "../chat.mjs";

export class TrackerJueza extends ConMemoria(HandlebarsApplicationMixin(ApplicationV2)) {
  static DEFAULT_OPTIONS = {
    id: "nb-tracker",
    classes: ["mr-nosotras-las-brujas", "nb-tracker"],
    position: { width: 680, height: 780 },
    window: { icon: "fa-solid fa-scale-unbalanced", title: "Tracker de La Jueza" },
    actions: {
      fase: TrackerJueza.#fase,
      dado: TrackerJueza.#dado,
      barajar: TrackerJueza.#barajar,
      nuevaEscena: TrackerJueza.#nuevaEscena,
      participante: TrackerJueza.#participante,
      todas: TrackerJueza.#todas,
      robarMayor: TrackerJueza.#robarMayor,
      quitarMayor: TrackerJueza.#quitarMayor,
      invertir: TrackerJueza.#invertir,
      pnjAnadir: TrackerJueza.#pnjAnadir,
      pnjQuitar: TrackerJueza.#pnjQuitar,
      terminarEscena: TrackerJueza.#terminarEscena,
      revelar: TrackerJueza.#revelar,
      reiniciar: TrackerJueza.#reiniciar,
      abrir: TrackerJueza.#abrir
    }
  };

  static MEMORIA = "tracker-jueza";
  static SCROLL_MEMORIA = [".nb-jz-scroll"];

  static PARTS = {
    tracker: { template: `${RUTA}/templates/apps/tracker.hbs`, scrollable: [".nb-jz-scroll"] }
  };

  static abrir() {
    return (foundry.applications.instances.get("nb-tracker") ?? new TrackerJueza()).render({ force: true });
  }

  async _prepareContext(options) {
    const estado = sesion();
    const fase = FASES[estado.fase] ?? FASES.prima;
    const marcador = fase.marcador ? MARCADORES[fase.marcador] : null;
    const s = estado.escena;
    const esGM = game.user.isGM;
    const limite = game.settings.get(ID, "robosPorHermana");
    const figuras = game.settings.get(ID, "valoresFiguras");

    const listaHermanas = hermanas().map(h => {
      const robos = estado.menores.filter(m => m.robadaPor === h.uuid);
      return {
        uuid: h.uuid, id: h.id, nombre: h.name, img: h.img,
        enEscena: Boolean(s?.participantes.includes(h.uuid)),
        robos: robos.length, limite,
        enEscenaAhora: Boolean(s?.mayores.some(m => m.hermana === h.uuid)),
        total: estado.menores.reduce((n, m) => duenaDe(m) === h.uuid ? n + Number(m.valor || 0) : n, 0)
      };
    });

    const mayores = s ? ordenarMayores(s.mayores).map((m, i) => {
      const arcano = MAYOR_POR_ROMANO[m.arcano] ?? {};
      return {
        ...m,
        indice: s.mayores.indexOf(m),
        romano: m.arcano,
        nombre: arcano.nombre ?? m.nombre,
        img: imgMayor(m.arcano),
        hermanaNombre: nombreDe(m.hermana),
        conceptoActual: conceptoDe(m),
        dominante: i === 0,
        segundo: i === 1
      };
    }) : [];

    const pnjs = (s?.pnjs ?? []).map((p, i) => ({ ...p, i, actor: p.uuid ? fromUuidSync(p.uuid) : null }));

    const menores = estado.menores.map((m, i) => ({
      ...m, i,
      robadaPorNombre: nombreDe(m.robadaPor),
      destinatariaNombre: m.destinataria ? nombreDe(m.destinataria) : "",
      img: imgMenor(m.pinta, m.orden),
      modos: [
        { v: "conservar", l: "Conservar", elegido: m.modo !== "entregar" },
        { v: "entregar", l: "Entregar", elegido: m.modo === "entregar" }
      ]
    }));

    // Destinataria de cada sospecha: nunca a una misma, y la acusada inicial
    // solo si el ajuste lo admite (R 56).
    const conAcusada = game.settings.get(ID, "destinatarias") === "conAcusada";
    const acusada = estado.acusadaInicial ?? "";
    for (const m of menores) {
      const opciones = [{ uuid: "", nombre: "—" }, ...listaHermanas
        .filter(h => h.uuid !== m.robadaPor && (conAcusada || h.uuid !== acusada))
        .map(h => ({ uuid: h.uuid, nombre: h.nombre }))];
      if (m.destinataria && !opciones.some(o => o.uuid === m.destinataria)) {
        opciones.push({ uuid: m.destinataria, nombre: nombreDe(m.destinataria) || "?" });
      }
      m.destinos = opciones.map(o => ({ ...o, elegido: o.uuid === m.destinataria }));
    }

    return {
      esGM,
      fase: { ...fase, clave: estado.fase, indice: ORDEN_FASES.indexOf(estado.fase) + 1, total: ORDEN_FASES.length },
      marcador: marcador ? { ...marcador, img: imgMayor(marcador.romano) } : null,
      directora: estado.directora,
      escena: s ?? { objetivo: "", lugar: "", participantes: [], pnjs: [], mayores: [] },
      conEscena: Boolean(s),
      mayores,
      hermanas: listaHermanas,
      pnjs,
      pnjsDisponibles: game.actors.filter(a => a.type === "pnj"),
      menores,
      robados: estado.menores.length,
      inversiones: { usadas: estado.inversionesUsadas, limite: limiteInversiones(listaHermanas.length) },
      acusadas: estado.acusadas.map(nombreDe).filter(Boolean),
      acusadaInicial: estado.acusadaInicial ? nombreDe(estado.acusadaInicial) : "",
      opcionesAcusada: [{ uuid: "", nombre: "Sin acusada" },
        ...listaHermanas.map(h => ({ uuid: h.uuid, nombre: h.nombre, elegido: h.uuid === estado.acusadaInicial }))],
      faseIdx: estado.fase,
      pintas: PINTAS,
      figuras,
      totalEscenas: estado.escenas,
      acusadasUuid: estado.acusadas
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    if (!game.user.isGM) return;
    // Campos de texto del tracker: se guardan al salir del campo.
    for (const el of this.element.querySelectorAll("[data-campo]")) {
      el.addEventListener("change", async () => {
        const ruta = el.dataset.campo;
        const cambios = ruta.startsWith("escena.")
          ? { escena: { ...(sesion().escena ?? {}), [ruta.slice(7)]: el.value } }
          : { [ruta]: el.value };
        await cambiarSesion(cambios);
      });
    }
    // Modo y destinataria de cada sospecha.
    for (const el of this.element.querySelectorAll("[data-menor]")) {
      el.addEventListener("change", async () => {
        const estado = sesion();
        const menores = estado.menores.map((m, i) => i === Number(el.dataset.menor)
          ? { ...m, [el.dataset.menorCampo]: el.value, ...(el.dataset.menorCampo === "modo" && el.value !== "entregar" ? { destinataria: "" } : {}) }
          : m);
        await cambiarSesion({ menores });
      });
    }
  }

  // ─────────────────────────────── Fases y preparación

  static async #fase(event, boton) {
    if (!jueza()) return;
    const estado = sesion();
    const i = ORDEN_FASES.indexOf(estado.fase);
    const clave = boton.dataset.dir === "atras" ? ORDEN_FASES[Math.max(0, i - 1)] : ORDEN_FASES[Math.min(ORDEN_FASES.length - 1, i + 1)];
    if (clave === estado.fase) return;
    await cambiarSesion({ fase: clave });
    await chatFase(clave);
    this.render();
  }

  static async #dado() {
    if (!jueza()) return;
    return dado();
  }

  static async #barajar() {
    if (!jueza()) return;
    await barajar();
    ui.notifications.info("Mazos mezclados.");
  }

  // ─────────────────────────────── Escena

  static async #nuevaEscena() {
    if (!jueza()) return;
    await cambiarSesion({ escena: { objetivo: "", lugar: "", participantes: [], pnjs: [], mayores: [] } });
    this.render();
  }

  static async #participante(event, boton) {
    if (!jueza()) return;
    const estado = sesion();
    const s = estado.escena ?? { objetivo: "", lugar: "", participantes: [], pnjs: [], mayores: [] };
    const uuid = boton.dataset.uuid;
    const participantes = s.participantes.includes(uuid) ? s.participantes.filter(u => u !== uuid) : [...s.participantes, uuid];
    await cambiarSesion({ escena: { ...s, participantes } });
    this.render();
  }

  static async #todas() {
    if (!jueza()) return;
    const estado = sesion();
    const s = estado.escena ?? { objetivo: "", lugar: "", participantes: [], pnjs: [], mayores: [] };
    const todas = s.participantes.length === hermanas().length ? [] : hermanas().map(h => h.uuid);
    await cambiarSesion({ escena: { ...s, participantes: todas } });
    this.render();
  }

  /** Roba un arcano mayor para una Hermana en escena (R 30). */
  static async #robarMayor(event, boton) {
    if (!jueza()) return;
    const estado = sesion();
    const s = estado.escena;
    if (!s || s.mayores.some(m => m.hermana === boton.dataset.uuid)) return;
    const carta = await robarMayor();
    const dato = datoMayor(carta);
    const arcano = MAYOR_POR_ROMANO[dato.arcano];
    const mayor = { ...dato, hermana: boton.dataset.uuid, concepto: arcano?.pos ?? "", invertida: false };
    await cambiarSesion({ escena: { ...s, mayores: [...s.mayores, mayor] } });
    await chatMayor(carta, { concepto: mayor.concepto });
    this.render();
  }

  static async #quitarMayor(event, boton) {
    if (!jueza()) return;
    const estado = sesion();
    const s = estado.escena;
    const indice = Number(boton.dataset.indice);
    const mayor = s?.mayores[indice];
    if (!mayor) return;
    const escenaPila = pila("escena");
    const deck = pila("mayores");
    if (mayor.id && escenaPila?.cards.has(mayor.id) && deck) {
      await escenaPila.pass(deck, [mayor.id], { chatNotification: false, action: "discard" });
    }
    const mayores = s.mayores.filter((_, i) => i !== indice);
    const usadas = Math.max(0, sesion().inversionesUsadas - (mayor.invertida ? 1 : 0));
    await cambiarSesion({ escena: { ...s, mayores }, inversionesUsadas: usadas });
    this.render();
  }

  /** Invertir el arcano: concepto de dirección, un uso por carta (R 65–69). */
  static async #invertir(event, boton) {
    if (!jueza()) return;
    const estado = sesion();
    const s = estado.escena;
    const indice = Number(boton.dataset.indice);
    const mayor = s?.mayores[indice];
    if (!mayor) return;
    const arcano = MAYOR_POR_ROMANO[mayor.arcano];
    const invertida = !mayor.invertida;
    if (invertida && estado.inversionesUsadas >= limiteInversiones(hermanas().length)) {
      return ui.notifications.warn(`Sin inversiones: el límite es uno por Hermana (${hermanas().length}).`);
    }
    const mayores = s.mayores.map((m, i) => i === indice
      ? { ...m, invertida, concepto: arcano ? (invertida ? arcano.neg : arcano.pos) : m.concepto }
      : m);
    await cambiarSesion({
      escena: { ...s, mayores },
      inversionesUsadas: estado.inversionesUsadas + (invertida ? 1 : -1)
    });
    this.render();
  }

  static async #pnjAnadir(event, boton) {
    if (!jueza()) return;
    const select = this.element.querySelector("#nb-pnj-select");
    const uuid = select?.value;
    if (!uuid) return;
    const estado = sesion();
    const s = estado.escena;
    if (!s || s.pnjs.some(p => p.uuid === uuid)) return;
    const actor = fromUuidSync(uuid);
    await cambiarSesion({ escena: { ...s, pnjs: [...s.pnjs, { uuid, nombre: actor?.name ?? "" }] } });
    this.render();
  }

  static async #pnjQuitar(event, boton) {
    if (!jueza()) return;
    const estado = sesion();
    const s = estado.escena;
    if (!s) return;
    await cambiarSesion({ escena: { ...s, pnjs: s.pnjs.filter((_, i) => i !== Number(boton.dataset.indice)) } });
    this.render();
  }

  /**
   * Cierra la escena: devuelve los mayores al mazo (R 36) y roba un menor a
   * cada participante que aún tenga robos (R 35, límite R 55).
   */
  static async #terminarEscena() {
    if (!jueza()) return;
    const estado = sesion();
    const s = estado.escena;
    if (!s) return;
    const limite = game.settings.get(ID, "robosPorHermana");
    const menores = [...estado.menores];
    let robos = 0;
    await devolverEscena();
    for (const uuid of s.participantes) {
      if (menores.filter(m => m.robadaPor === uuid).length >= limite) continue;
      const carta = await robarMenor();
      const dato = datoMenor(carta, uuid);
      dato.modo = "conservar";
      menores.push(dato);
      await chatMenor(dato, { suya: true, susurro: [uuid] });
      robos++;
    }
    await cambiarSesion({ escena: null, menores, escenas: estado.escenas + 1 });
    ui.notifications.info(robos
      ? `Escena cerrada: ${robos} sospecha${robos > 1 ? "s" : ""} robada${robos > 1 ? "s" : ""}.`
      : "Escena cerrada. Nadie robó: o no participaron o ya llegaron a su límite.");
    this.render();
  }

  // ─────────────────────────────── Laudes y cierre

  /** Revela los menores, suma y acusa al máximo (o a todos los empatados). */
  static async #revelar() {
    if (!jueza()) return;
    const estado = sesion();
    if (!estado.menores.length) return ui.notifications.warn("No hay sospechas que revelar.");
    const menores = estado.menores.map(m => ({ ...m, revelada: true }));
    await revelarMenores();
    const suma = totales(menores);
    const acusadas = acusadasPorRecuento(suma);
    const filas = hermanas().map(h => ({ uuid: h.uuid, nombre: h.name, total: suma[h.uuid] ?? 0 }));
    await chatLaudes({
      filas,
      acusadas: acusadas.map(u => fromUuidSync(u)?.name ?? "Hermana")
    });
    await cambiarSesion({ menores, acusadas });
    ui.notifications.info(acusadas.length ? "Sospechas reveladas: hay nuevas acusadas." : "Sospechas reveladas.");
    this.render();
  }

  static async #reiniciar() {
    if (!jueza()) return;
    new DialogV2({
      window: { title: "Reiniciar la partida", icon: "fa-solid fa-rotate-left" },
      content: "<p>Se devuelven todas las cartas al mazo, se borran escenas, sospechas y acusaciones, y la fase vuelve a Prima. ¿Segura?</p>",
      buttons: [
        {
          action: "si",
          label: "<i class='fa-solid fa-rotate-left'></i> Reiniciar",
          callback: async () => {
            await recogerTodo();
            await barajar();
            await cambiarSesion({ ...SESION_INICIAL });
            ui.notifications.info("Partida reiniciada: los mazos están listos en Prima.");
            this.render();
          }
        },
        { action: "no", label: "Cancelar", icon: "fa-solid fa-xmark", default: true }
      ],
      rejectClose: false
    }).render(true);
  }

  static #abrir(event, boton) {
    const doc = fromUuidSync(boton.dataset.uuid);
    doc?.sheet.render(true);
  }
}

/** Solo La Jueza (cliente GM) mueve fichas del tracker. */
const jueza = () => {
  if (game.user.isGM) return true;
  ui.notifications.warn("La Jueza mueve el tracker: abre este panel desde el cliente del GM.");
  return false;
};

const nombreDe = uuid => (uuid ? fromUuidSync(uuid)?.name ?? "" : "");

/** Abre el tracker desde accesos directos. */
export const abrirJueza = () => TrackerJueza.abrir();
