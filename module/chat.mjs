/**
 * Tarjetas de chat. Una sola plantilla para todo: robos de arcanos, fases,
 * sospechas reveladas, el dado opcional de La Jueza y avisos de mesa.
 */
import { ID, RUTA } from "./mesa.mjs";
import { aplicarModo, alRenderizarMensaje, renderTemplate } from "./compat.mjs";
import { D6, FASES, MARCADORES, ORDEN_FASES, MAYOR_POR_ROMANO } from "./listas.mjs";
import { alAzar } from "./reglas.mjs";
import { pintarRetratos } from "./retrato.mjs";

/**
 * @param {object} tarjeta  Datos para templates/chat/tarjeta.hbs
 * @param {object} [op]
 * @param {Actor}  [op.actor]    Quién habla
 * @param {Roll}   [op.tirada]   Tirada incluida (respeta el modo de visibilidad)
 * @param {string[]} [op.susurro] Solo la ven estos usuarios (además de los GM)
 */
export async function publicar(tarjeta, { actor, tirada, susurro } = {}) {
  const conAtributos = b => ({ ...b, attrs: atributosData(b.datos) });
  const vista = {
    ...tarjeta,
    lista: tarjeta.lista && { ...tarjeta.lista, items: tarjeta.lista.items.map(conAtributos) },
    botones: tarjeta.botones?.map(conAtributos)
  };
  const content = await renderTemplate(`${RUTA}/templates/chat/tarjeta.hbs`, vista);
  const datos = {
    content,
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker({ alias: tarjeta.alias ?? "Nosotras, las brujas" }),
    flags: { [ID]: { tipo: tarjeta.tipo ?? "aviso", sonido: tarjeta.sonido } }
  };
  if (tirada) {
    datos.rolls = [tirada];
    datos.sound = CONFIG.sounds.dice;
    aplicarModo(datos);
  }
  if (susurro?.length) {
    const usuarios = new Set(susurro.flatMap(uuid => {
      const a = fromUuidSync(uuid);
      return a ? game.users.filter(u => a.testUserPermission(u, "OWNER")).map(u => u.id) : [];
    }));
    for (const gm of game.users.filter(u => u.isGM)) usuarios.add(gm.id);
    datos.whisper = [...usuarios];
    datos.style = CONST.CHAT_MESSAGE_STYLES.OTHER;
  }
  return ChatMessage.create(datos);
}

/** `datos` → atributos data-* para la plantilla. */
export function atributosData(datos = {}) {
  return Object.entries(datos).map(([k, v]) => `data-${k}="${foundry.utils.escapeHTML(String(v))}"`).join(" ");
}

/** Un arcano mayor robado: se ve en la mesa. */
export async function chatMayor(carta, { concepto, invertida } = {}) {
  return publicar({
    tipo: "mayor", tono: "fase", icono: "fa-solid fa-eye",
    etiqueta: "Arcano mayor",
    carta: { img: carta.faces?.[0]?.img ?? carta.img, nombre: carta.name },
    titulo: concepto || carta.name,
    texto: invertida ? "Invertida por La Jueza: manda el concepto de dirección." : undefined
  });
}

/** Un arcano menor robado: quien lo roba lo ve; la destinataria no (R 53). */
export async function chatMenor(dato, { suya, susurro } = {}) {
  return publicar({
    tipo: "menor", tono: "sospecha", icono: "fa-solid fa-hand",
    etiqueta: suya ? "Has robado una sospecha" : "Sospecha robada",
    carta: { img: `${RUTA}/assets/tarot/menores/${dato.pinta}-${dato.orden}.svg`, nombre: dato.nombre },
    titulo: dato.nombre,
    pie: dato.modo === "entregar" ? "Entregada boca abajo: la destinataria no la mira hasta Laudes (R 53–54)." : undefined
  }, { susurro });
}

/** Cambio de fase con su marcador (R 10–12, R 42). */
export async function chatFase(clave) {
  const fase = FASES[clave];
  if (!fase) return;
  const marcador = fase.marcador ? MARCADORES[fase.marcador] : null;
  return publicar({
    tipo: "fase", tono: "fase", icono: "fa-solid fa-hourglass-half",
    etiqueta: marcador ? `${marcador.nombre} · ${marcador.romano}` : "Fase",
    titulo: fase.nombre,
    texto: fase.desc,
    sonido: { indice: ORDEN_FASES.indexOf(clave) }
  });
}

/** El Final: las acusadas del recuento y lo que el libro deja a la mesa (R 49, R 60–61). */
export async function chatFinal({ acusadas, cautiva }) {
  return publicar({
    tipo: "final", tono: "sospecha", icono: "fa-solid fa-gavel",
    etiqueta: "Final del juego", titulo: acusadas.length ? "El pueblo ha hablado" : "Nadie más ha sido señalada",
    texto: acusadas.length
      ? `Acusadas por el recuento: ${acusadas.join(", ")}. Narrad el juicio y la condena; podéis usar una elipsis para no mostrar la violencia (R 49).`
      : "Narrad el juicio y el epílogo (R 49).",
    pie: `${cautiva ? `La cautiva inicial, ${cautiva}, ` : "La cautiva inicial "}se resuelve según lo que haya pasado en la historia: salvarla no cancela la nueva acusación (R 60).`
  });
}

/** Reparto de arcanos de vínculo y quién abre la narración (R 22–23, R 27). */
export async function chatVinculos({ filas, inicia }) {
  return publicar({
    tipo: "vinculos", tono: "voz", icono: "fa-solid fa-link",
    etiqueta: "Vínculos sorteados", titulo: inicia ? `Empieza ${inicia}` : "Vínculos sorteados",
    texto: filas.map(f => `${f.nombre}: ${f.arcanos.map(r => MAYOR_POR_ROMANO[r]?.nombre ?? r).join(", ")}`).join(" · "),
    pie: "Empieza quien sacó El Loco; si nadie lo sacó, quien tenga el arcano de menor valor (R 27, a verificar)."
  });
}

/** Recuento de Laudes: totales, máximos y nuevas acusadas (R 57–59). */
export async function chatLaudes({ filas, acusadas }) {
  const lista = {
    titulo: "Sospechas reveladas",
    items: filas.map(f => ({ texto: `${f.nombre}: ${f.total}`, accion: "abrir", datos: { uuid: f.uuid } }))
  };
  return publicar({
    tipo: "laudes", tono: "sospecha", icono: "fa-solid fa-scale-unbalanced",
    etiqueta: "Laudes", titulo: "El recuento de las sospechas",
    lista,
    texto: acusadas.length
      ? `Nueva(s) acusada(s): ${acusadas.join(", ")}.`
      : "Nadie supera el recuento: no hay nueva acusación.",
    botones: [{ etiqueta: "Ver en el tracker", icono: "fa-solid fa-scroll", accion: "jueza" }]
  });
}

/** El dado opcional de 1d6 (R 72–73). */
export async function dado() {
  const tirada = await new Roll("1d6").evaluate();
  const fila = D6[tirada.total - 1] ?? D6[0];
  return publicar({
    tipo: "dado", tono: "voz", icono: "fa-solid fa-dice-six",
    etiqueta: "Dado de La Jueza · 1d6",
    titulo: fila.caras,
    texto: fila.ejemplo
  }, { tirada });
}

const ACCIONES = {
  jueza() {
    return game.mrNosotras?.abrirJueza?.();
  },
  async ayudas() {
    const pack = game.packs.get(`${ID}.ayudas`);
    if (pack) return pack.render(true);
    return ui.notifications.warn("Compendio de ayudas no disponible.");
  },
  seguridad() {
    return game.mrNosotras?.abrirSeguridad?.();
  },
  dado() {
    if (!game.settings.get(ID, "dadoJueza")) return ui.notifications.info("El dado opcional está desactivado en Ajustes.");
    if (!game.user.isGM) return ui.notifications.warn("Solo La Jueza tira el dado de consecuencias.");
    return dado();
  },
  async abrir(ds) {
    const doc = ds.uuid ? await fromUuid(ds.uuid) : null;
    doc?.sheet.render(true);
  }
};

export function escucharChat() {
  alRenderizarMensaje((mensaje, html) => {
    if (!mensaje.getFlag(ID, "tipo")) return;
    pintarRetratos(html);
    for (const b of html.querySelectorAll("[data-nb-accion]")) {
      b.addEventListener("click", async ev => {
        ev.preventDefault();
        const lista = b.closest(".nb-lista-opciones");
        if (lista) lista.classList.add("elegida"), b.classList.add("elegido");
        await ACCIONES[b.dataset.nbAccion]?.({ ...b.dataset });
      });
    }
  });
}
