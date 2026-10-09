/**
 * Listas de reglas: arcanos mayores con sus tres tablas (conceptos de jugadora,
 * conceptos de dirección y arquetipos), marcadores de fase, fases, pintas,
 * figuras y la tabla opcional de 1d6 de La Jueza.
 *
 * Los arcanos menores son una baraja de 56 (1–10 y cuatro figuras por pinta):
 * sus valores se configuran en Ajustes → «Valores de las figuras».
 */

/** Los 19 arcanos del mazo (XVII, XVIII y XIX son marcadores de fase, R 10–13). */
export const ARCANOS = [
  { romano: "0", orden: 0, nombre: "El Loco", pos: "Inicio, Espontaneidad", neg: "Inocencia, Vanidad", arquetipo: "El niño" },
  { romano: "I", orden: 1, nombre: "El Mago", pos: "Diplomacia, Autoconfianza", neg: "Evasión, Avaricia", arquetipo: "El hombre de ciencias" },
  { romano: "II", orden: 2, nombre: "La Sacerdotisa", pos: "Misterio, Cautela", neg: "Soberbia, Paranoia", arquetipo: "La madre superiora" },
  { romano: "III", orden: 3, nombre: "La Emperatriz", pos: "Naturaleza, Belleza", neg: "Vagancia, Inacción", arquetipo: "La madre" },
  { romano: "IV", orden: 4, nombre: "El Emperador", pos: "Liderazgo, Estabilidad", neg: "Poder, Estancamiento", arquetipo: "El padre" },
  { romano: "V", orden: 5, nombre: "El Papa", pos: "Sabiduría, Inspiración", neg: "Servidumbre, Obligación", arquetipo: "La autoridad" },
  { romano: "VI", orden: 6, nombre: "Los Enamorados", pos: "Toma de decisiones, Amor", neg: "Placer, Indecisión", arquetipo: "El pretendiente" },
  { romano: "VII", orden: 7, nombre: "El Carro", pos: "Éxito, Triunfo", neg: "Conformismo, Retroceso", arquetipo: "El soldado" },
  { romano: "VIII", orden: 8, nombre: "La Jueza", pos: "Justicia, Equidad", neg: "Severidad, Violencia", arquetipo: "La institutriz" },
  { romano: "IX", orden: 9, nombre: "El Ermitaño", pos: "Prudencia, Autoconocimiento", neg: "Introspección, Miedo", arquetipo: "El hombre sabio" },
  { romano: "X", orden: 10, nombre: "La Rueda de la Fortuna", pos: "Suerte, Resiliencia", neg: "Cambio, Descubrimiento", arquetipo: "El apostador" },
  { romano: "XI", orden: 11, nombre: "La Fuerza", pos: "Superación, Unión", neg: "Despotismo, Salvajismo", arquetipo: "El herrero" },
  { romano: "XII", orden: 12, nombre: "El Colgado", pos: "Discernimiento, Lucidez", neg: "Egoísmo, Envidia", arquetipo: "El mártir" },
  { romano: "XIII", orden: 13, nombre: "La Muerte", pos: "Fin (cierre de un ciclo), Transición", neg: "Inercia, Enfermedad", arquetipo: "El médico" },
  { romano: "XIV", orden: 14, nombre: "Templanza", pos: "Paciencia, Moderación", neg: "Desorden, Negligencia", arquetipo: "La mujer joven" },
  { romano: "XV", orden: 15, nombre: "El Diablo", pos: "Esfuerzo, Apego", neg: "Dominación, Experimentación", arquetipo: "El tabernero" },
  { romano: "XVI", orden: 16, nombre: "La Torre de Dios", pos: "Libertad, Fortuna", neg: "Descontrol, Adversidad", arquetipo: "El vigía" },
  { romano: "XX", orden: 20, nombre: "El Juicio", pos: "Triunfo, Paz Interior", neg: "Inevitabilidad, Fracaso", arquetipo: "El inquisidor" },
  { romano: "XXI", orden: 21, nombre: "El Mundo", pos: "Completitud, Integración", neg: "Encierro, Idealización", arquetipo: "El errante" }
];

export const MAYOR_POR_ROMANO = Object.fromEntries(ARCANOS.map(a => [a.romano, a]));
export const MAYOR_POR_ORDEN = Object.fromEntries(ARCANOS.map(a => [a.orden, a]));

/** R 10–13: apartadas del mazo para señalar fases; nunca se roban. */
export const MARCADORES = {
  estrella: { romano: "XVII", nombre: "La Estrella", fases: ["prima", "visperas", "maitines"], img: "estrella" },
  luna: { romano: "XVIII", nombre: "La Luna", fases: ["completas"], img: "luna" },
  sol: { romano: "XIX", nombre: "El Sol", fases: ["sexta"], img: "sol" }
};

/** R 42: el recorrido de la partida. */
export const FASES = {
  prima: { nombre: "Prima", marcador: "estrella", desc: "Se introduce el arresto, el recuerdo inicial y la reunión en el refugio." },
  sexta: { nombre: "Sexta", marcador: "sol", desc: "Primera ronda de actuaciones en aplicación del plan." },
  visperas: { nombre: "Vísperas", marcador: "estrella", desc: "Reencuentro, balance y planificación del grupo." },
  completas: { nombre: "Completas", marcador: "luna", desc: "Ronda de actuaciones nocturnas, potencialmente arriesgadas." },
  maitines: { nombre: "Maitines", marcador: "estrella", desc: "Falso refugio; la amenaza alcanza a las Hermanas." },
  laudes: { nombre: "Laudes", marcador: "", desc: "Último encuentro y determinación de nuevas acusaciones." },
  final: { nombre: "Final del juego", marcador: "", desc: "Juicio, condena y epílogo." }
};
export const ORDEN_FASES = Object.keys(FASES);

/** Cuatro pintas de 14 cartas: 1–10 y cuatro figuras (R 09, R 62). */
export const PINTAS = { oros: "Oros", copas: "Copas", espadas: "Espadas", bastos: "Bastos" };
export const FIGURAS = { 11: "Sota", 12: "Caballero", 13: "Dama", 14: "Rey" };

/** R 72–73: tabla opcional de 1d6 para consecuencias. */
export const D6 = [
  { caras: "Sí, pero…", ejemplo: "El testigo ayuda, pero alguien descubre la reunión." },
  { caras: "No, pero…", ejemplo: "El alcalde rechaza hablar, pero deja escapar un nombre." },
  { caras: "Sí, pero solo si…", ejemplo: "El sacerdote ayudará si se entrega una prueba comprometedora." },
  { caras: "No, y además…", ejemplo: "La petición fracasa y aumentan las sospechas." },
  { caras: "Sí, y además…", ejemplo: "Aparece la prueba y se suma un nuevo aliado." },
  { caras: "Necesitas ayuda…", ejemplo: "La protagonista requerirá la intervención de otra persona." }
];

/** Pregunta de vínculo por arcano (R 22–23). Se leen con __ a rellenar. */
export const PREGUNTAS_VINCULO = {
  "0": "Tus Hermanas son importantes para ti, pero ____ suele meterse en problemas. ¿Qué te genera eso y qué haces por ello?",
  "I": "____ y yo compartimos un secreto. ¿Cuál es?",
  "II": "¡La mala conducta de ____ pone en peligro su alma! ¿Cómo intentas ayudarle a encontrar el buen camino?",
  "III": "Has intentado explicarle a ____ el poder de una mujer. ¿Por qué quieres darle estos consejos?",
  "IV": "Te da la sensación de que tu Hermana ____ no tiene tanta capacidad como tú. ¿Le seguirás o intentarás imponerte?",
  "V": "Sueles saber qué conviene a tus Hermanas, pero ____ es una persona de la que debes estar al tanto siempre. ¿Por qué?",
  "VI": "____ es una persona buena y fiel. Confío plenamente en ella. ¿Qué despierta en ti tal confianza?",
  "VII": "____ es demasiado conformista con su vida. ¿Qué ha hecho que te haga pensar esto?",
  "VIII": "Sientes que ____ ha sido muy severa contigo. ¿En qué situación?",
  "IX": "Sospecho que ____ me oculta algo… ¿Qué será?",
  "X": "Nunca sé qué esperar de ____. ¿Qué le hace tan inesperada?",
  "XI": "Soy afortunada de tener a alguien como ____ a mi lado. ¿Por qué?",
  "XII": "Algo de ____ no me gusta. ¿De qué se trata?",
  "XIII": "____ ha dado por superada una discusión que tuvieron. ¿Crees que esa diferencia quedó zanjada?",
  "XIV": "Debo ser fuerte por ____. ¿Cómo llegaste a esa conclusión?",
  "XV": "____ me lleva por mal camino. ¿Qué cosas te incita a hacer?",
  "XVI": "Siempre he admirado/envidiado a ____. ¿Qué me lleva a cuestionar esto ahora?",
  "XX": "Es inevitable que a ____ le sucedan cosas. ¿Qué tipo de situaciones suele enfrentar, para bien o para mal?",
  "XXI": "Idealizas a ____. ¿Qué te ha hecho verle así?"
};
