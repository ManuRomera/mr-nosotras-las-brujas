/** Genera _data/escenarios.json: una escena de Foundry por cada fondo de assets/escenarios (npm run build). */
import fs from "node:fs/promises";
import { createHash } from "node:crypto";

const ID = "mr-nosotras-las-brujas";
const ESCENAS = [
  ["plaza-pueblo", "La plaza del pueblo"],
  ["iglesia-nave", "La iglesia"],
  ["sacristia", "La sacristía"],
  ["molino-viejo", "El molino viejo"],
  ["ermita-sierra", "La ermita de la sierra"],
  ["bosque-noche", "El bosque de noche"],
  ["camino-cementerio", "El camino del cementerio"],
  ["calabozo", "El calabozo"]
];
const id = t => createHash("sha1").update(`escena-${t}`).digest("hex").slice(0, 16);

const documentos = ESCENAS.map(([archivo, nombre], i) => ({
  _id: id(archivo),
  name: nombre,
  navigation: false,
  background: { src: `systems/${ID}/assets/escenarios/${archivo}.webp` },
  width: 2560, height: 1440, padding: 0,
  initial: { x: 1280, y: 720, scale: 0.4 },
  grid: { type: 0, size: 100, distance: 1, units: "m" },
  tokenVision: false, fog: { exploration: false },
  sort: (i + 1) * 1000,
  ownership: { default: 0 }
}));
await fs.writeFile(new URL("../_data/escenarios.json", import.meta.url), JSON.stringify(documentos, null, 1) + "\n");
console.log("escenarios.json:", documentos.length, "escenas");
