import { test } from "node:test";
import assert from "node:assert/strict";
import {
  valorMenor, nombreMenor, totales, acusadasPorRecuento, limiteInversiones,
  conceptoDe, robosRestantes, ordenarMayores, quienInicia
} from "../module/reglas.mjs";
import { FIGURAS, PINTAS, FASES } from "../module/listas.mjs";

test("valorMenor: 1–10 valen su número", () => {
  assert.equal(valorMenor(1), 1);
  assert.equal(valorMenor(7), 7);
  assert.equal(valorMenor(10), 10);
});

test("valorMenor: figuras usan la tabla configurable", () => {
  assert.equal(valorMenor(11), 11);
  assert.equal(valorMenor(14), 14);
  assert.deepEqual(valorMenor(14, [10, 12, 15, 20]), 20);
  assert.equal(valorMenor(13, [0, 0, 0, 0]), 0);
});

test("nombreMenor: número o figura con pinta", () => {
  assert.equal(nombreMenor(7, "copas", PINTAS), "7 de Copas");
  assert.equal(nombreMenor(1, "oros", PINTAS), "1 de Oros");
  assert.equal(nombreMenor(14, "bastos", PINTAS), `${FIGURAS[14]} de Bastos`);
});

test("totales: solo suma reveladas con robadaPor", () => {
  const menores = [
    { robadaPor: "A", valor: 7, revelada: true },
    { robadaPor: "A", valor: 3, revelada: true },
    { robadaPor: "B", valor: 14, revelada: true },
    { robadaPor: "A", valor: 10, revelada: false },
    { robadaPor: "", valor: 5, revelada: true },
    { valor: 9, revelada: true }
  ];
  assert.deepEqual(totales(menores), { A: 10, B: 14 });
  assert.deepEqual(totales([]), {});
  assert.deepEqual(totales(undefined), {});
});

test("totales: las entregadas cuentan para la destinataria (R 53–54)", () => {
  const menores = [
    { robadaPor: "A", valor: 7, revelada: true, modo: "entregar", destinataria: "B" },
    { robadaPor: "B", valor: 4, revelada: true, modo: "entregar", destinataria: "A" },
    { robadaPor: "A", valor: 2, revelada: true, modo: "conservar" },
    { robadaPor: "B", valor: 6, revelada: true, modo: "entregar", destinataria: "" },
    { robadaPor: "A", valor: 9, revelada: false, modo: "entregar", destinataria: "B" }
  ];
  // A: recibe4 (entregada por B) + conserva2 =6; su7 va a B y su9 aún no revelada
  // B: recibe7 (entregada por A) + conserva6 (entregada sin destinataria) =13
  assert.deepEqual(totales(menores), { A: 6, B: 13 });
});

test("acusadasPorRecuento: máximo, empate máximo y vacío", () => {
  assert.deepEqual(acusadasPorRecuento({ A: 3, B: 9, C: 9, D: 2 }), ["B", "C"]);
  assert.deepEqual(acusadasPorRecuento({ A: 5 }), ["A"]);
  assert.deepEqual(acusadasPorRecuento({}), []);
  assert.deepEqual(acusadasPorRecuento({ A: 0, B: 0 }), ["A", "B"]);
});

test("limiteInversiones: una por Hermana, mínimo 1", () => {
  assert.equal(limiteInversiones(4), 4);
  assert.equal(limiteInversiones(1), 1);
  assert.equal(limiteInversiones(0), 1);
  assert.equal(limiteInversiones(undefined), 1);
});

test("conceptoDe: positivo por defecto, negativo si invertida", () => {
  assert.equal(conceptoDe({ arcano: "I", invertida: false }), "Diplomacia, Autoconfianza");
  assert.equal(conceptoDe({ arcano: "I", invertida: true }), "Evasión, Avaricia");
  assert.match(conceptoDe({ arcano: "I", invertida: true }, true), /invertida/);
  assert.equal(conceptoDe({ arcano: "nada", invertida: false }), "");
});

test("robosRestantes: descuenta usados y no baja de 0", () => {
  const menores = [{ robadaPor: "A" }, { robadaPor: "A" }, { robadaPor: "B" }];
  assert.equal(robosRestantes(menores, "A", 2), 0);
  assert.equal(robosRestantes(menores, "B", 2), 1);
  assert.equal(robosRestantes([], "A", 2), 2);
  assert.equal(robosRestantes(undefined, "A", 2), 2);
});

test("ordenarMayores: el número más alto domina", () => {
  const ordenados = ordenarMayores([
    { arcano: "I", hermana: "A" },
    { arcano: "XXI", hermana: "B" },
    { arcano: "X", hermana: "C" },
    { arcano: "0", hermana: "D" }
  ]);
  assert.deepEqual(ordenados.map(m => m.hermana), ["B", "C", "A", "D"]);
});

test("quienInicia: devuelve la Hermana del arcano más bajo", () => {
  const mayores = [
    { arcano: "XVI", hermana: "B" },
    { arcano: "0", hermana: "A" },
    { arcano: "VIII", hermana: "C" }
  ];
  assert.equal(quienInicia(mayores), "A");
  assert.equal(quienInicia([]), "");
  assert.equal(quienInicia(undefined), "");
});

test("las siete fases del día están completas", () => {
  assert.deepEqual(Object.keys(FASES), ["prima", "sexta", "visperas", "completas", "maitines", "laudes", "final"]);
});
