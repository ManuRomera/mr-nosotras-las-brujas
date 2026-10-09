/**
 * Modelos de datos. Sin template.json: cada tipo declara su esquema aquí.
 *
 * - `hermana`: la hoja de papel, escrita como frases (R 17–23).
 * - `pnj`: identidad, papel, descriptor e impulso (R 24).
 * - `pueblo`: cómo es la comunidad y quién acusa (R 17–18, 25).
 */
import { PREGUNTAS_VINCULO, MAYOR_POR_ROMANO } from "./listas.mjs";

const { StringField, NumberField, BooleanField, HTMLField, SchemaField, ArrayField } = foundry.data.fields;

const texto = (initial = "") => new StringField({ required: true, blank: true, initial });
const eleccion = (opciones, initial) => new StringField({ required: true, blank: true, initial, choices: Object.keys(opciones) });

/** Las cinco casillas de la hoja impresa: acusada, acusador y tres Hermanas. */
const FILAS_VINCULO = [
  { tipo: "acusada", arcano: "", quien: "", uuid: "", texto: "" },
  { tipo: "acusador", arcano: "", quien: "", uuid: "", texto: "" },
  { tipo: "hermana", arcano: "", quien: "", uuid: "", texto: "" },
  { tipo: "hermana", arcano: "", quien: "", uuid: "", texto: "" },
  { tipo: "hermana", arcano: "", quien: "", uuid: "", texto: "" }
];

export class HermanaData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      siguiente: texto(),
      lugar: new SchemaField({ donde: texto(), porque: texto() }),
      vinculos: new ArrayField(
        new SchemaField({
          tipo: eleccion({ acusada: "acusada", acusador: "acusador", hermana: "Hermana" }, "hermana"),
          arcano: new StringField({ required: true, blank: true, initial: "" }),
          quien: texto(),
          uuid: texto(),
          texto: texto()
        }),
        { initial: () => FILAS_VINCULO.map(f => ({ ...f })) }
      ),
      notas: new HTMLField({ required: true, blank: true })
    };
  }

  prepareDerivedData() {
    for (const v of this.vinculos) v.pregunta = PREGUNTAS_VINCULO[v.arcano] ?? "";
  }
}

export class PnjData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      arcano: new StringField({ required: true, blank: true, initial: "" }),
      papel: texto(),
      descriptor: texto(),
      impulso: texto(),
      notas: new HTMLField({ required: true, blank: true })
    };
  }

  prepareDerivedData() {
    this.arquetipo = MAYOR_POR_ROMANO[this.arcano]?.arquetipo ?? "";
  }
}

export class PuebloData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      une: texto(),
      refugio: texto(),
      acusador: new SchemaField({ nombre: texto(), relacion: texto() }),
      rasgos: new ArrayField(new SchemaField({ texto: texto() }), { initial: () => [{ texto: "" }, { texto: "" }] }),
      notas: new HTMLField({ required: true, blank: true })
    };
  }
}

export const MODELOS = { hermana: HermanaData, pnj: PnjData, pueblo: PuebloData };
