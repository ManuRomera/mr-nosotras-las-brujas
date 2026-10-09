/**
 * Validación estática antes de publicar: sintaxis, JSON, rutas de plantillas,
 * recursos referenciados y coherencia entre etiqueta y versión.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const errores = [];
const listar = async dir => (await fs.readdir(dir, { recursive: true })).map(f => path.join(dir, f));
const existe = p => fs.stat(p).then(() => true, () => false);

const manifiesto = JSON.parse(await fs.readFile("system.json"));
const etiqueta = process.env.RELEASE_TAG;
if (etiqueta && etiqueta !== `v${manifiesto.version}`) errores.push(`La etiqueta ${etiqueta} no coincide con la versión ${manifiesto.version}.`);
const paquete = JSON.parse(await fs.readFile("package.json"));
if (paquete.version !== manifiesto.version) errores.push(`package.json (${paquete.version}) y system.json (${manifiesto.version}) no coinciden.`);

const js = ["mr-nosotras-las-brujas.mjs", ...(await listar("module")), ...(await listar("scripts")), ...(await listar("tests"))].filter(f => f.endsWith(".mjs"));
for (const f of js) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { errores.push(`${f}: ${e.stderr}`); }
}

for (const f of ["system.json", "lang/es.json", ...(await listar("_data")).filter(f => f.endsWith(".json"))]) {
  try { JSON.parse(await fs.readFile(f, "utf8")); }
  catch (e) { errores.push(`${f}: JSON inválido (${e.message})`); }
}

// Toda ruta systems/mr-nosotras-las-brujas/... citada en código, plantillas y datos debe existir.
const fuentes = [...js, ...(await listar("templates")), ...(await listar("_data")), "system.json"].filter(f => /\.(mjs|hbs|json)$/.test(f));
for (const f of fuentes) {
  const texto = await fs.readFile(f, "utf8");
  for (const [, ruta] of texto.matchAll(/systems\/mr-nosotras-las-brujas\/([\w\-/.]+\.(?:hbs|webp|png|svg|css|woff2))/g)) {
    if (!(await existe(ruta))) errores.push(`${f}: falta ${ruta}`);
  }
  for (const [, ruta] of texto.matchAll(/\$\{RUTA\}\/([\w\-/.]+\.(?:hbs|webp|svg|png))/g)) {
    if (!(await existe(ruta))) errores.push(`${f}: falta ${ruta}`);
  }
}
const css = await fs.readFile("styles/mr-nosotras-las-brujas.css", "utf8");
for (const [, ruta] of css.matchAll(/url\("\.\.\/([^"]+)"\)/g)) {
  if (!(await existe(ruta))) errores.push(`styles: falta ${ruta}`);
}
for (const f of manifiesto.styles.concat(manifiesto.esmodules)) if (!(await existe(f))) errores.push(`system.json: falta ${f}`);

if (errores.length) {
  console.error(errores.join("\n"));
  process.exit(1);
}
console.log(`Comprobación correcta: ${js.length} módulos, ${fuentes.length} fuentes revisadas.`);
