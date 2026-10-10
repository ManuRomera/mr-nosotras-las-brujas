/**
 * La mesa de La Jueza: toda la pantalla es el tracker. Sin ventana, sobre la escena de fondo:
 * arriba la hora y las siete horas, debajo «Ahora» (lo siguiente que conviene hacer), a la izquierda
 * las Hermanas, en el centro las cartas de la escena, a la derecha las sospechas y abajo las herramientas.
 *
 * Solo el cliente GM escribe; el resto de la mesa lo ve para mirar. Cada persona puede ocultarla.
 */
import { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } from "../compat.mjs";
import { ID, RUTA, sesion, cambiarSesion, hermanas, SESION_INICIAL } from "../mesa.mjs";
import { FASES, ORDEN_FASES, MARCADORES, MAYOR_POR_ROMANO, PINTAS } from "../listas.mjs";
import {
  conceptoDe, ordenarMayores, totales, duenaDe, acusadasPorRecuento, limiteInversiones, modoDelRobo,
  destinatariaSugerida, faltanRobos, sortearVinculos, siguientePaso, quienInicia
} from "../reglas.mjs";
import { asegurarMazo, barajar, robarMayor, robarMenor, devolverEscena, recogerTodo, revelarMenores, datoMayor, datoMenor, pila, imgMayor, imgMenor } from "../tarot.mjs";
import { pintarRetratos } from "../retrato.mjs";
import { activarFondo, FONDOS_POR_HORA } from "../escenario.mjs";
import { chatMayor, chatMenor, chatFase, chatLaudes, chatFinal, chatVinculos, publicar, dado } from "../chat.mjs";

const MINUTOS_PRIMA = 10;
const ESCENA_VACIA = () => ({ objetivo: "", lugar: "", participantes: [], pnjs: [], mayores: [] });

export class TrackerJueza extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "nb-tracker",
    tag: "div",
    classes: ["mr-nosotras-las-brujas", "nb-tracker"],
    window: { frame: false },
    actions: {
      fase: TrackerJueza.#fase,
      irFase: TrackerJueza.#irFase,
      paso: TrackerJueza.#paso,
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
      abrir: TrackerJueza.#abrir,
      vinculos: TrackerJueza.#vinculos,
      reloj: TrackerJueza.#reloj,
      sentencia: TrackerJueza.#sentencia,
      crearHermana: TrackerJueza.#crearHermana,
      fondo: () => game.mrNosotras.elegirFondo(),
      seguridad: () => game.mrNosotras.abrirSeguridad(),
      ayudas: () => game.packs.get(`${ID}.ayudas`)?.render(true),
      ocultar: () => TrackerJueza.ocultar()
    }
  };

  static PARTS = {
    tracker: { template: `${RUTA}/templates/apps/tracker.hbs` }
  };

  /** Secciones desplegables que la persona ha abierto o cerrado (sobreviven a los repintados). */
  #abiertos = new Map();

  /** Cuenta atrás de Prima: se repinta cada segundo sin tocar el resto. */
  #pulso = null;
  #avisado = 0;

  /** Muestra la mesa (y la recuerda como visible para esta persona). */
  static async abrir() {
    await game.settings.set(ID, "mesaOculta", false);
    document.getElementById("nb-pastilla")?.remove();
    return (foundry.applications.instances.get("nb-tracker") ?? new TrackerJueza()).render({ force: true });
  }

  /** Oculta la mesa para esta persona: queda solo la escena de fondo y una pastilla para recuperarla. */
  static async ocultar() {
    await game.settings.set(ID, "mesaOculta", true);
    await foundry.applications.instances.get("nb-tracker")?.close();
    TrackerJueza.pastilla();
  }

  static pastilla() {
    if (document.getElementById("nb-pastilla")) return;
    const boton = document.createElement("button");
    boton.type = "button";
    boton.id = "nb-pastilla";
    boton.className = "mr-nosotras-las-brujas nb-pastilla";
    boton.dataset.tooltip = "Mostrar la mesa de La Jueza";
    boton.innerHTML = `<i class="fa-solid fa-scale-unbalanced"></i><span>La mesa</span>`;
    boton.addEventListener("click", () => TrackerJueza.abrir());
    document.body.append(boton);
  }

  /** La mesa ocupa la pantalla salvo los controles de Foundry: se ajusta a la barra lateral. */
  static margenes() {
    const lateral = document.getElementById("sidebar")?.getBoundingClientRect().width ?? 48;
    const raiz = document.getElementById("nb-tracker");
    raiz?.style.setProperty("--nb-der", `${Math.round(lateral + 12)}px`);
  }

  /** La mesa se coloca solo con CSS: Foundry no debe fijarle posición ni tamaño. */
  setPosition() { return this.position; }
  _updatePosition(position) { return position; }

  _insertElement(element) {
    super._insertElement(element);
    if (!TrackerJueza.vigilante) {
      TrackerJueza.vigilante = new ResizeObserver(() => TrackerJueza.margenes());
      const lateral = document.getElementById("sidebar");
      if (lateral) TrackerJueza.vigilante.observe(lateral);
    }
  }

  async _prepareContext(options) {
    const estado = sesion();
    const fase = FASES[estado.fase] ?? FASES.prima;
    const marcador = fase.marcador ? MARCADORES[fase.marcador] : null;
    const s = estado.escena;
    const esGM = game.user.isGM;
    const limite = game.settings.get(ID, "robosPorHermana");
    const figuras = game.settings.get(ID, "valoresFiguras");
    const todas = hermanas();

    const listaHermanas = todas.map(h => {
      const robos = estado.menores.filter(m => m.robadaPor === h.uuid);
      return {
        uuid: h.uuid, id: h.id, nombre: h.name, img: h.img,
        enEscena: Boolean(s?.participantes.includes(h.uuid)),
        robos: robos.length, limite,
        completa: robos.length >= limite,
        enEscenaAhora: Boolean(s?.mayores.some(m => m.hermana === h.uuid)),
        acusada: estado.acusadas.includes(h.uuid),
        cautiva: estado.acusadaInicial === h.uuid,
        total: estado.menores.reduce((n, m) => duenaDe(m) === h.uuid ? n + Number(m.valor || 0) : n, 0)
      };
    });
    const maximo = Math.max(0, ...listaHermanas.map(h => h.total));
    for (const h of listaHermanas) h.maximo = estado.menores.some(m => m.revelada) && h.total === maximo && maximo > 0;

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
        pos: arcano.pos, neg: arcano.neg, arquetipo: arcano.arquetipo,
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

    const indice = ORDEN_FASES.indexOf(estado.fase);
    const horas = ORDEN_FASES.map((clave, i) => {
      const f = FASES[clave];
      const mk = f.marcador ? MARCADORES[f.marcador] : null;
      return { clave, nombre: f.nombre.replace(" del juego", ""), simbolo: mk ? SIMBOLO[f.marcador] : "fa-circle", actual: i === indice, pasada: i < indice, marcador: mk?.nombre ?? "" };
    });

    const reloj = relojRestante(estado.reloj);
    const limiteInv = limiteInversiones(listaHermanas.length);

    return {
      esGM,
      fase: { ...fase, clave: estado.fase, nombre: fase.nombre, indice: indice + 1, total: ORDEN_FASES.length },
      esPrima: estado.fase === "prima",
      mostrarEscena: Boolean(s) || estado.fase === "sexta" || estado.fase === "completas",
      mostrarSospechas: estado.menores.length > 0,
      marcador: marcador ? { ...marcador, img: imgMayor(marcador.romano) } : null,
      horas,
      siguienteFase: FASES[ORDEN_FASES[Math.min(ORDEN_FASES.length - 1, indice + 1)]]?.nombre ?? "",
      paso: pasoParaPintar(estado, todas, limite, esGM),
      directora: estado.directora,
      usuarios: game.users.map(u => u.name),
      escena: s ?? ESCENA_VACIA(),
      conEscena: Boolean(s),
      mayores,
      hermanas: listaHermanas,
      sinHermanas: !listaHermanas.length,
      pnjs,
      pnjsDisponibles: game.actors.filter(a => a.type === "pnj"),
      menores,
      robados: estado.menores.length,
      revelado: estado.menores.length > 0 && estado.menores.every(m => m.revelada),
      inversiones: {
        usadas: estado.inversionesUsadas, limite: limiteInv,
        pips: Array.from({ length: limiteInv }, (_, i) => ({ usada: i < estado.inversionesUsadas }))
      },
      reloj,
      acusadas: estado.acusadas.map(nombreDe).filter(Boolean),
      acusadaInicial: estado.acusadaInicial ? nombreDe(estado.acusadaInicial) : "",
      opcionesAcusada: [{ uuid: "", nombre: "Sin acusada" },
        ...listaHermanas.map(h => ({ uuid: h.uuid, nombre: h.nombre, elegido: h.uuid === estado.acusadaInicial }))],
      pintas: PINTAS,
      figuras,
      totalEscenas: estado.escenas
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    pintarRetratos(this.element);
    TrackerJueza.margenes();
    for (const d of this.element.querySelectorAll("details[data-recuerda]")) {
      const clave = d.dataset.recuerda;
      if (this.#abiertos.has(clave)) d.open = this.#abiertos.get(clave);
      d.addEventListener("toggle", () => this.#abiertos.set(clave, d.open));
    }
    this.#armarReloj();
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

  async _onClose(options) {
    clearInterval(this.#pulso);
    return super._onClose?.(options);
  }

  /** Mientras corre la cuenta atrás de Prima, actualiza el reloj y avisa al terminar. */
  #armarReloj() {
    clearInterval(this.#pulso);
    const fin = sesion().reloj;
    if (!fin) return;
    const pintar = () => {
      const r = relojRestante(fin);
      for (const el of this.element?.querySelectorAll("[data-reloj]") ?? []) el.textContent = r.texto;
      if (r.restante > 0 || this.#avisado === fin) return;
      this.#avisado = fin;
      clearInterval(this.#pulso);
      if (game.user.isGM) TrackerJueza.#finReloj();
    };
    pintar();
    this.#pulso = setInterval(pintar, 1000);
  }

  static async #finReloj() {
    await cambiarSesion({ reloj: 0 });
    await publicar({
      tipo: "aviso", tono: "fase", icono: "fa-solid fa-hourglass-end", alias: "La Jueza",
      etiqueta: "Prima", titulo: "Se acaba el recuerdo",
      texto: `Han pasado unos ${MINUTOS_PRIMA} minutos: volved al presente, contad cómo supisteis del arresto y acordad un plan.`
    });
  }

  // ─────────────────────────────── Siguiente paso, fases y preparación

  /** Lo que sugiere la barra «Ahora»: ejecuta la acción que corresponda a la fase y la escena. */
  static async #paso(event, boton) {
    if (!jueza()) return;
    const { clave, hermana } = JSON.parse(boton.dataset.datos ?? "{}");
    const acciones = {
      avanzar: () => TrackerJueza.#cambiarFase(this, +1),
      nuevaEscena: () => TrackerJueza.#nuevaEscena.call(this),
      participantes: () => TrackerJueza.#todas.call(this),
      robarMayor: () => TrackerJueza.#robarMayor.call(this, event, { dataset: { uuid: hermana } }),
      terminarEscena: () => TrackerJueza.#terminarEscena.call(this),
      revelar: () => TrackerJueza.#revelar.call(this),
      sentencia: () => TrackerJueza.#sentencia.call(this),
      crear: () => TrackerJueza.#crearHermana.call(this)
    };
    await acciones[clave]?.();
  }

  static async #fase(event, boton) {
    if (!jueza()) return;
    await TrackerJueza.#cambiarFase(this, boton.dataset.dir === "atras" ? -1 : +1);
  }

  /** Salta a una hora concreta desde la tira de horas. */
  static async #irFase(event, boton) {
    if (!jueza()) return;
    const clave = boton.dataset.fase;
    if (!ORDEN_FASES.includes(clave) || clave === sesion().fase) return;
    await TrackerJueza.#poner(this, clave);
  }

  static async #cambiarFase(app, paso) {
    const i = ORDEN_FASES.indexOf(sesion().fase);
    const clave = ORDEN_FASES[Math.min(ORDEN_FASES.length - 1, Math.max(0, i + paso))];
    if (clave !== sesion().fase) await TrackerJueza.#poner(app, clave);
  }

  static async #poner(app, clave) {
    await cambiarSesion({ fase: clave, reloj: clave === "prima" ? sesion().reloj : 0 });
    await chatFase(clave);
    if (game.settings.get(ID, "fondoPorHoras")) await activarFondo(FONDOS_POR_HORA[clave]);
    app.render();
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

  static async #crearHermana() {
    if (!jueza()) return;
    const actor = await Actor.create({ name: "Hermana nueva", type: "hermana" });
    actor?.sheet.render(true);
  }

  /** Reparte arcanos de vínculo a los huecos de todas las Hermanas y dice quién empieza (R 22–23, R 27). */
  static async #vinculos() {
    if (!jueza()) return;
    const hs = hermanas();
    if (!hs.length) return ui.notifications.warn("Crea primero las fichas de Hermana.");
    const filas = hs.map(h => {
      const v = h.system.vinculos;
      return { uuid: h.uuid, usados: v.map(x => x.arcano).filter(Boolean), huecos: v.flatMap((x, i) => (x.arcano ? [] : [i])) };
    });
    const reparto = sortearVinculos(filas);
    if (!reparto.length) return ui.notifications.info("Todos los vínculos ya tienen arcano.");
    for (const h of hs) {
      const suyos = reparto.filter(r => r.hermana === h.uuid);
      if (!suyos.length) continue;
      const vinculos = h.toObject().system.vinculos;
      for (const r of suyos) vinculos[r.indice].arcano = r.arcano;
      await h.update({ "system.vinculos": vinculos });
    }
    const inicia = fromUuidSync(quienInicia(reparto))?.name ?? "";
    await chatVinculos({
      inicia,
      filas: hs.map(h => ({ nombre: h.name, arcanos: reparto.filter(r => r.hermana === h.uuid).map(r => r.arcano) })).filter(f => f.arcanos.length)
    });
    this.render();
  }

  /** Cuenta atrás de unos diez minutos para el recuerdo de Prima (R 43). */
  static async #reloj() {
    if (!jueza()) return;
    await cambiarSesion({ reloj: sesion().reloj ? 0 : Date.now() + MINUTOS_PRIMA * 60_000 });
    this.render();
  }

  /** La sentencia del Final en el chat (R 49, R 60–61). */
  static async #sentencia() {
    if (!jueza()) return;
    const estado = sesion();
    await chatFinal({ acusadas: estado.acusadas.map(nombreDe).filter(Boolean), cautiva: nombreDe(estado.acusadaInicial) });
  }

  // ─────────────────────────────── Escena

  static async #nuevaEscena() {
    if (!jueza()) return;
    await cambiarSesion({ escena: ESCENA_VACIA() });
    this.render();
  }

  static async #participante(event, boton) {
    if (!jueza()) return;
    const estado = sesion();
    const s = estado.escena ?? ESCENA_VACIA();
    const uuid = boton.dataset.uuid;
    const participantes = s.participantes.includes(uuid) ? s.participantes.filter(u => u !== uuid) : [...s.participantes, uuid];
    await cambiarSesion({ escena: { ...s, participantes } });
    this.render();
  }

  static async #todas() {
    if (!jueza()) return;
    const estado = sesion();
    const s = estado.escena ?? ESCENA_VACIA();
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
   * cada participante que aún tenga robos (R 35, límite R 55). El primero de cada
   * Hermana se conserva y el segundo se entrega, con destinataria propuesta (R 55).
   */
  static async #terminarEscena() {
    if (!jueza()) return;
    const estado = sesion();
    const s = estado.escena;
    if (!s) return;
    const limite = game.settings.get(ID, "robosPorHermana");
    const conAcusada = game.settings.get(ID, "destinatarias") === "conAcusada";
    const todas = hermanas().map(h => h.uuid);
    const menores = [...estado.menores];
    let robos = 0;
    await devolverEscena();
    for (const uuid of s.participantes) {
      const previos = menores.filter(m => m.robadaPor === uuid).length;
      if (previos >= limite) continue;
      const carta = await robarMenor();
      const dato = datoMenor(carta, uuid);
      dato.modo = modoDelRobo(previos, limite);
      if (dato.modo === "entregar") {
        dato.destinataria = destinatariaSugerida({ de: uuid, hermanas: todas, acusada: estado.acusadaInicial, conAcusada, menores });
      }
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
    if (estado.menores.every(m => m.revelada)) return ui.notifications.info("Las sospechas ya están reveladas.");
    const limite = game.settings.get(ID, "robosPorHermana");
    const faltan = faltanRobos(hermanas().map(h => h.uuid), estado.menores, limite);
    if (faltan.length) {
      const quienes = faltan.map(f => `${nombreDe(f.uuid)} (${f.faltan})`).join(", ");
      const seguir = await DialogV2.confirm({
        window: { title: "Faltan sospechas por robar", icon: "fa-solid fa-hand" },
        content: `<p>Aún deberían robar: ${quienes}. ¿Revelar de todos modos?</p>`,
        rejectClose: false
      });
      if (!seguir) return;
    }
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
          label: "Reiniciar",
          icon: "fa-solid fa-rotate-left",
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

/** Símbolo de cada marcador de fase. */
const SIMBOLO = { estrella: "fa-star", sol: "fa-sun", luna: "fa-moon" };

/** Tiempo que queda de la cuenta atrás, ya formateado. */
function relojRestante(fin) {
  if (!fin) return { activo: false, restante: 0, texto: `${MINUTOS_PRIMA}:00`, minutos: MINUTOS_PRIMA };
  const restante = Math.max(0, fin - Date.now());
  const seg = Math.ceil(restante / 1000);
  return { activo: true, restante, texto: `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, "0")}`, minutos: MINUTOS_PRIMA };
}

const AVANCE = {
  prima: "Recordad a la cautiva en libertad (unos diez minutos) y acordad un plan. Después, a Sexta.",
  sexta: "Primera ronda de actuaciones cumplida: pasad a Vísperas.",
  visperas: "Compartid lo averiguado y revisad el plan. Después, a Completas.",
  completas: "La noche ha pasado: pasad a Maitines.",
  maitines: "El refugio ya no es seguro. Cuando lo narréis, a Laudes.",
  laudes: "Recuento hecho: pasad al Final."
};

/** El «siguiente paso» con su texto y su botón, listo para la plantilla. */
function pasoParaPintar(estado, todas, limite, esGM) {
  if (!todas.length) {
    return { clave: "crear", icono: "fa-solid fa-hat-wizard", texto: "Aún no hay Hermanas: crea una ficha por jugadora.", boton: "Crear Hermana", datos: JSON.stringify({ clave: "crear" }), esGM };
  }
  const paso = siguientePaso({
    fase: estado.fase, escena: estado.escena, hermanas: todas.map(h => h.uuid), menores: estado.menores, limite, acusadas: estado.acusadas
  });
  const i = ORDEN_FASES.indexOf(estado.fase);
  const siguiente = FASES[ORDEN_FASES[Math.min(ORDEN_FASES.length - 1, i + 1)]].nombre.replace(" del juego", "");
  const nombre = uuid => todas.find(h => h.uuid === uuid)?.name ?? "";
  const textos = {
    avanzar: { icono: "fa-solid fa-forward", texto: AVANCE[estado.fase] ?? `Pasad a ${siguiente}.`, boton: `Pasar a ${siguiente}` },
    nuevaEscena: { icono: "fa-solid fa-theater-masks", texto: "Una Hermana anuncia su objetivo, el lugar y los PNJ.", boton: "Abrir escena" },
    participantes: { icono: "fa-solid fa-users", texto: "Elige quién actúa en la escena.", boton: "Todas las Hermanas" },
    robarMayor: { icono: "fa-solid fa-hand-sparkles", texto: `Roba el arcano mayor de ${nombre(paso.hermana)} y elegid el concepto.`, boton: `Robar para ${nombre(paso.hermana)}` },
    terminarEscena: { icono: "fa-solid fa-hourglass-end", texto: "Narrad y arbitrad. Al terminar se devuelven los mayores y se roban las sospechas.", boton: "Terminar escena" },
    revelar: { icono: "fa-solid fa-eye", texto: "Laudes: revelad las sospechas, sumad y que el máximo sea acusada.", boton: "Revelar sospechas" },
    sentencia: { icono: "fa-solid fa-gavel", texto: paso.hay ? "Narrad el juicio y la condena; vale una elipsis." : "Narrad el juicio y el epílogo.", boton: "Publicar sentencia" }
  };
  return { clave: paso.clave, ...textos[paso.clave], datos: JSON.stringify(paso), esGM };
}

/** Solo La Jueza (cliente GM) mueve fichas del tracker. */
const jueza = () => {
  if (game.user.isGM) return true;
  ui.notifications.warn("La Jueza mueve la mesa: hazlo desde el cliente del GM.");
  return false;
};

const nombreDe = uuid => (uuid ? fromUuidSync(uuid)?.name ?? "" : "");

/** Abre el tracker desde accesos directos. */
export const abrirJueza = () => TrackerJueza.abrir();
