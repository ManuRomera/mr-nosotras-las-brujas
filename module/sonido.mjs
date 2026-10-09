/**
 * Sonido sin archivos: campanas de las horas, el roce de una carta y la campanada
 * de Laudes, sintetizados con Web Audio. Suena en todos los clientes cuando La
 * Jueza publica la tarjeta correspondiente. Cada persona lo ajusta en su navegador.
 */
import { ID } from "./mesa.mjs";

let ctx = null;

const activo = () => game.settings.get(ID, "sonido") && game.settings.get(ID, "sonidoVolumen") > 0;
const volumen = () => (game.settings.get(ID, "sonidoVolumen") / 100) * 0.5;

function contexto() {
  const Ctx = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Ctx) return null;
  ctx ??= new Ctx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Una campanada: parciales inarmónicos que decaen. */
function campana(cuando = 0, base = 392, duracion = 2.6, fuerza = 1) {
  const c = contexto();
  if (!c) return;
  const t0 = c.currentTime + cuando;
  const salida = c.createGain();
  salida.gain.value = volumen() * fuerza;
  salida.connect(c.destination);
  [[1, 1], [2.01, 0.5], [2.76, 0.35], [5.4, 0.18], [8.93, 0.08]].forEach(([razon, amp]) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = base * razon;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(amp, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion / razon);
    o.connect(g).connect(salida);
    o.start(t0);
    o.stop(t0 + duracion);
  });
}

/** El roce de una carta: ruido filtrado muy breve. */
function carta() {
  const c = contexto();
  if (!c) return;
  const largo = Math.floor(c.sampleRate * 0.16);
  const buffer = c.createBuffer(1, largo, c.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < largo; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / largo) ** 2;
  const fuente = c.createBufferSource();
  const filtro = c.createBiquadFilter();
  const g = c.createGain();
  fuente.buffer = buffer;
  filtro.type = "bandpass";
  filtro.frequency.value = 2600;
  g.gain.value = volumen() * 1.4;
  fuente.connect(filtro).connect(g).connect(c.destination);
  fuente.start();
}

const SONIDOS = {
  // Prima da una campanada y cada hora siguiente una más, hasta tres.
  fase: tarjeta => { const n = Math.min(3, 1 + (tarjeta?.indice ?? 0) % 3); for (let i = 0; i < n; i++) campana(i * 0.9, 440 - i * 20); },
  mayor: carta,
  menor: carta,
  laudes: () => { campana(0, 196, 4, 1.2); campana(1.4, 196, 4, 1); }
};

export function registrarSonido() {
  game.settings.register(ID, "sonido", {
    name: "Sonido ambiente",
    hint: "Campanas al cambiar de hora, roce de cartas y la campanada de Laudes. Sintetizado, sin archivos. Ajuste de este navegador.",
    scope: "client", config: true, type: Boolean, default: true
  });
  game.settings.register(ID, "sonidoVolumen", {
    name: "Volumen del sonido",
    scope: "client", config: true, type: Number, default: 50, range: { min: 0, max: 100, step: 5 }
  });
  Hooks.on("createChatMessage", mensaje => {
    const tipo = mensaje.getFlag(ID, "tipo");
    if (!tipo || !SONIDOS[tipo] || !activo()) return;
    SONIDOS[tipo](mensaje.getFlag(ID, "sonido"));
  });
  // Los navegadores solo dejan sonar tras un gesto: se reanuda al primer clic.
  document.addEventListener("pointerdown", () => { if (ctx?.state === "suspended") ctx.resume(); }, { passive: true });
}
