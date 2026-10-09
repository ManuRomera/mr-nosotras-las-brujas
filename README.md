<p align="center">
  <img src="docs/img/cover.png" alt="MR- Nosotras, las brujas · sistema para Foundry VTT" width="100%">
</p>

<p align="center">
  <a href="https://github.com/ManuRomera/mr-nosotras-las-brujas/releases/latest"><img alt="Última versión" src="https://img.shields.io/github/v/release/ManuRomera/mr-nosotras-las-brujas?style=for-the-badge&color=c9a227&labelColor=2a1740&label=versi%C3%B3n"></a>
  <img alt="Foundry VTT 13 y 14" src="https://img.shields.io/badge/Foundry_VTT-13_%E2%80%93_14-5b2a6e?style=for-the-badge&labelColor=2a1740">
  <img alt="Licencia MIT" src="https://img.shields.io/badge/c%C3%B3digo-MIT-b04a6d?style=for-the-badge&labelColor=2a1740">
  <img alt="En español" src="https://img.shields.io/badge/idioma-espa%C3%B1ol-4b6d3b?style=for-the-badge&labelColor=2a1740">
</p>

<h3 align="center">Un pueblo pequeño, una Hermana acusada y siete horas para descubrir quién la está envenenando con sospechas.</h3>

<p align="center">
  El juego de rol narrativo de <b>Hernán D'Andreis</b> y <b>Keith Monardes</b> (<a href="https://primigenia-austral.itch.io/nosotras-las-brujas">Primigenia Austral</a>), listo para jugar en Foundry VTT: <b>tarot completo de 78 cartas</b>, el <b>tracker de La Jueza</b> que te dice qué toca hacer, sospechas boca abajo, Laudes y seguridad en mesa.
</p>

<p align="center">
  <a href="https://github.com/ManuRomera/mr-nosotras-las-brujas/releases/latest/download/mr-nosotras-las-brujas.zip"><img alt="Descargar" src="https://img.shields.io/badge/%E2%AC%87_Descargar_el_sistema-c9a227?style=for-the-badge&labelColor=c9a227&color=2a1740" height="44"></a>
  &nbsp;
  <a href="https://manuromera.github.io/mr-nosotras-las-brujas/"><img alt="Ver la página" src="https://img.shields.io/badge/Ver_la_p%C3%A1gina-5b2a6e?style=for-the-badge&labelColor=5b2a6e&color=2a1740" height="44"></a>
</p>

---

## Instalar en 20 segundos

En Foundry: **Configuración → Sistemas de juego → Instalar sistema**, pega el manifiesto y pulsa *Instalar*. Se actualiza desde ahí mismo cada vez que haya versión nueva.

```
https://github.com/ManuRomera/mr-nosotras-las-brujas/releases/latest/download/system.json
```

> **Necesitas el manual del juego.** Este sistema es una ayuda de mesa: automatiza el ritual (cartas, escenas, recuento), no sustituye al libro. Consíguelo en [itch.io](https://primigenia-austral.itch.io/nosotras-las-brujas).

## El tarot, hecho a mano

Las **78 cartas** son de grabado marsellés, con el arcano, el número y el nombre en la propia carta. Los 19 mayores y los 56 menores son mazos de Foundry; La Estrella, El Sol y La Luna son los marcadores de las horas.

<p align="center"><img src="docs/img/baraja.webp" alt="Una muestra de la baraja" width="100%"></p>

## El tracker de La Jueza: siempre sabes qué toca

<p align="center"><img src="docs/img/tracker-escena.webp" alt="Tracker de La Jueza durante la hora de Sexta" width="62%"></p>

- **Tira de las siete horas** (Prima, Sexta, Vísperas, Completas, Maitines, Laudes y Final) con su marcador; campanadas al cambiar.
- **«Ahora»**: una barra que propone el siguiente paso con su botón. Abre escena, elige quién actúa, roba los mayores, termina, pasa de hora, revela en Laudes y publica la sentencia.
- **Escena**: objetivo, lugar y PNJ; el mayor de cada Hermana ordenado por número —dominante, segundo, detalle— con el concepto a la vista y la inversión de La Jueza (una por Hermana, sin recuperarlas).
- **Sospechas**: la primera de cada Hermana se conserva y la segunda se entrega boca abajo, con destinataria propuesta. Nadie la mira hasta Laudes.
- **Laudes**: revela, suma —lo entregado suma a quien lo recibe— y acusa al máximo; con empate, a todas. Avisa si falta alguien por robar.
- **Prima**: sorteo de vínculos (y quién empieza) y cuenta atrás de diez minutos para el recuerdo.

<p align="center"><img src="docs/img/tracker-laudes.webp" alt="Recuento de Laudes con las acusadas" width="100%"></p>

## Fichas con papel y tinta

**Hermana**, **PNJ** y **Pueblo**: las frases de la hoja, los vínculos con la carta del arcano a la vista (y su pregunta con el nombre ya puesto), las sospechas robadas y recibidas, sello de *Acusada* o *La cautiva*, retrato en arco con encuadre, modo compacto y memoria de posición. Con **modo oscuro** si lo prefieres.

<p align="center">
  <img src="docs/img/hoja-clara.webp" alt="Ficha de Hermana en papel" width="46%">
  &nbsp;
  <img src="docs/img/hojas-oscuras.webp" alt="Fichas de PNJ y de pueblo en modo oscuro" width="50%">
</p>

## Pensado para jugar con cuidado

La partida trata de persecución, misoginia y ejecución. El botón **Seguridad** abre **Pausa**, **Velo** y **Tarjeta X** —anónimas, a toda la mesa al instante— y las **líneas y velos** acordados.

<p align="center"><img src="docs/img/seguridad.webp" alt="Panel de seguridad en mesa" width="42%"></p>

Además: icono de **accesibilidad** en cada ventana (tamaño del texto, alto contraste, modo oscuro, fuente de alta legibilidad, sin movimiento), **sonido ambiente** sintetizado (opcional) y un **diagnóstico** que revisa mazos, imágenes y partida y deja un informe para copiar.

## Ajustes que importan

El dossier de reglas marca varios puntos «a verificar con el original»; el sistema los deja a tu mesa en lugar de decidirlos:

| Ajuste | Para qué |
|---|---|
| Valores de las figuras | Sota, Caballero, Dama y Rey (11–14 por defecto, R 62) |
| Robos por Hermana | Dos por defecto: una para conservar y otra para entregar (R 50, R 55) |
| Destinatarias | Solo otras Hermanas, o también la acusada inicial (R 56) |
| Dado opcional de 1d6 | Las seis respuestas de La Jueza (R 72–73) |

## Para quien quiera mirar dentro

```bash
npm run check    # sintaxis, JSON, rutas, 78 cartas y plantillas
npm test         # reglas puras (node:test)
npm run build    # compila las ayudas a packs/ (con Foundry cerrado)
npm run tarot    # regenera las 78 cartas, el dorso y la portada
npm run retratos # regenera los retratos por defecto
```

Foundry 13 y 14 con `ApplicationV2`, `TypeDataModel` y un único `module/compat.mjs` para lo que cambia entre versiones. La auditoría de reglas y automatismos está en [`docs/AUDITORIA.md`](docs/AUDITORIA.md); los cambios, en [`CHANGELOG.md`](CHANGELOG.md).

## Créditos y licencia

*Nosotras, las brujas* es de **Hernán D'Andreis** y **Keith Monardes**, con ilustraciones de Ferenike, publicado por **Primigenia Austral**. Este sistema es una implementación no oficial de **Manu Romera** y no tiene relación con la editorial: si lo piden, se retira. Ver [`NOTICE.md`](NOTICE.md).

El código y el arte generado por código son [MIT](LICENSE); las tipografías IM Fell y Caveat, [OFL](fonts/OFL.txt).

<p align="center"><sub>MR- · Manu Romera · Digital RPG Design</sub></p>
