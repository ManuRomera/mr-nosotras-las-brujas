# Auditoría · MR- Nosotras, las brujas 1.1.0

Octubre de 2026. Se audita la v1.0.0 contra el dossier de reglas (75 reglas numeradas, «Guía de reglas, procedimientos, ejemplos y controversias») y la muestra gratuita del manual. El manual completo no estaba en el equipo: **las reglas se comprueban contra el dossier**, no contra el libro; los puntos que el propio dossier marca «A VERIFICAR» siguen ajustables.

## 1. Cobertura de reglas

| Reglas | Qué dicen | Estado |
|---|---|---|
| R 01–08 | Identidad, participantes, objetivo | Sin mecánica; recogido en la bienvenida y las ayudas |
| R 09–13 | Separar mayores y menores, apartar Sol, Estrella y Luna | **Automático**: dos mazos y dos montones; los tres marcadores señalan las horas |
| R 14–15 | Mayores = conceptos, menores = sospechas; ver números y nombres | Cada carta lleva numeral y nombre propios en la imagen |
| R 17–21 | Preguntas del pueblo y de cada Hermana | Fichas *Pueblo* y *Hermana* con las frases de la hoja |
| R 22–23 | Vínculos con arcanos y sus preguntas | Tabla integrada; **nuevo**: sorteo de arcanos distintos y la pregunta con el nombre ya puesto |
| R 24–25 | PNJ y rasgos del pueblo | Fichas *PNJ* (arcano → arquetipo) y *Pueblo* |
| R 26 | Los mayores usados vuelven a mezclarse | Al cerrar cada escena y en «Barajar» |
| R 27 | Empieza quien saca El Loco / el menor valor | **Nuevo** (a verificar): lo anuncia el sorteo de vínculos. En la v1.0.0 la función existía y no se usaba |
| R 28–36 | La escena: objetivo, lugar, PNJ, mayor, concepto, menor | Tracker completo, con la guía «Ahora» |
| R 37–41 | Escena compartida | Mayor dominante, segundo = PNJ, resto = detalle; empate de máximo |
| R 42–51 | Las siete horas | Tira de horas con salto directo; **nuevo**: cuenta atrás de Prima (R 43) y sentencia del Final (R 49) |
| R 50 | Duda: ¿tercer robo en Laudes? | Ajuste «robos por Hermana» |
| R 52–54 | Menores = rumores; destinataria no mira; boca abajo | Boca abajo en el mazo y en la hoja; ver límites en §4 |
| R 55 | Una para conservar y otra para entregar | **Nuevo**: la 1.ª se conserva y la 2.ª se entrega con destinataria propuesta |
| R 56 | Duda: ¿a la acusada inicial? | Ajuste «destinatarias» |
| R 57–61 | Laudes: revelar, sumar, empate máximo = todas | Automático; **nuevo**: avisa si falta alguien por robar |
| R 62 | Duda: valor de las figuras | Ajuste «valores de las figuras» |
| R 63–70 | La Jueza: inversiones, una por carta, límite = nº de Hermanas | Automático y sin recuperar |
| R 71–73 | Dado opcional de 1 a 6 | Tarjeta de chat con la tabla |
| R 74 | «Cartas Itras» | **Sin implementar**: el dossier no las describe |

## 2. Fallos encontrados y corregidos

1. **Las 22 cartas de arcanos mayores eran idénticas**: el mismo símbolo sobre fondo crema. Rehechas las 78 caras, el dorso y la portada (grabado marsellés, textos convertidos a trazados).
2. **La guía de las ayudas contenía una frase sin sentido** («…son *tu partido, tus reglas*…») y describía mal el reparto de sospechas. Reescrita.
3. **El modo «alta legibilidad» pisaba la fuente de iconos** de Font Awesome: los botones de cerrar y de menú podían quedar rotos. Ahora excluye los elementos con iconos.
4. **El manual del compendio se leía mal con el tema claro de Foundry** (texto claro sobre fondo claro). Lleva su propio fondo.
5. **`quienInicia` (R 27) era código muerto.**
6. **Revelar Laudes dos veces** se permitía y reescribía las acusadas. Ahora lo impide, y avisa si hay Hermanas que aún deben robar.
7. **El tracker no pintaba los retratos encuadrados** (el README decía que sí).
8. **Tipografía y tamaños**: texto de 11–13 px sobre fondos con textura; subido a 14–16 px con la fuente IM Fell, que se cambia por la de Foundry en «alta legibilidad».
9. El compendio de ayudas se llamaba «NB · …»; ahora «Ayudas de juego», dentro de la carpeta del sistema.

## 3. Automatismos

| Automatismo | v1.0.0 | v1.1.0 |
|---|---|---|
| Crear mazos y barajar | sí | sí |
| Robar mayor por Hermana y ordenar por número | sí | sí |
| Inversiones con tope | sí | sí (puntos en vez de «0/3») |
| Robo de menores al cerrar la escena | sí | sí, con **modo y destinataria propuestos** |
| Recuento, empate y acusadas | sí | sí, con avisos |
| Fase: anuncio en el chat | sí | sí, con campanadas |
| Qué hacer ahora | no | **barra «Ahora»**: abre escena, elige quién actúa, roba mayores, termina, siguiente hora, Laudes, Final |
| Sorteo de vínculos y quién empieza | no | sí |
| Cuenta atrás del recuerdo de Prima | no | sí |
| Sentencia del Final | no | sí |
| Seguridad (pausa, velo, X, líneas y velos) | no | sí |
| Diagnóstico copiable | solo en consola | panel con comprobaciones |
| Retratos por defecto | silueta de Foundry | 10 retratos propios |

**No automatizado, a propósito**: elegir el concepto entre los dos de cada arcano, decidir el éxito o fracaso de una acción y narrar el juicio. El libro los deja a la mesa (R 31, R 34).

## 4. Límites conocidos

- **El secreto de las sospechas es social, no técnico.** Foundry envía todos los datos del mundo a todos los clientes: quien abra la consola puede ver las cartas boca abajo. La interfaz las oculta; no impide mirar. Se acepta porque el juego no es adversarial; si hiciera falta, la solución probada en MR- Bruja es cifrar con una clave en el navegador.
- **Solo el cliente GM mueve el tracker.** Una Jueza que no sea GM debe usar la cuenta de GM; el resto de la mesa lo ve en solo lectura.
- Foundry 14 y Dice So Nice no se han podido probar. Lo que cambia entre versiones está aislado en `module/compat.mjs`.

## 5. Decisión pendiente

**Texto del libro.** Las tablas de conceptos (positivos y de dirección), los arquetipos y las preguntas de vínculo vienen del manual, que es © de sus autores y de Primigenia Austral, y el repositorio es público. Se ha dejado el aviso en `NOTICE.md` y en el README («requiere el manual»). Lo prudente es pedir permiso a la editorial o sustituir las tablas por un importador que las lea del PDF del propio usuario, como en MR- Bruja.
