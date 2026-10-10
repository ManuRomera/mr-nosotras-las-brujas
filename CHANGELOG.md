# Cambios

## 1.4.0

- **Tutorial guiado** con los tours de Foundry: uno para quien dirige (tracker, fichas, cartas, seguridad) y otro para las Hermanas. Se ofrece la primera vez, está en el botón «Tutorial» del tracker, en la bienvenida del chat y en Configuración → Tours.
- Fuera de la interfaz las referencias a reglas numeradas («R 22», «R 55»…): quedan solo en la auditoría.
- El diagnóstico sale del tracker: vive en Configuración → Ajustes del sistema.
- El botón «Reiniciar» del diálogo de confirmación ya no enseña código.

## 1.3.0

**Las cartas, con más peso**

- **Lupa**: al dejar el cursor sobre una carta (chat, tracker, hojas o mazos) o un retrato se muestra grande, en toda su magnitud, junto a ella. Se puede desactivar en Ajustes.
- **Chat**: las cartas robadas salen centradas y grandes, con su reparto animado; las horas llevan su marcador o su emblema ilustrado; la bienvenida lleva portada.
- **Tracker**: cartas más grandes, cabecera sobre la noche del pueblo y botón **Fondo**.
- **Tapiz**: elige la escena de fondo de la mesa entre las ocho del compendio «Escenarios»; opcionalmente cambia sola con cada hora. Un mundo sin escena activa estrena la plaza del pueblo.
- Los glifos de palo de los menores 2–10 se ven más llenos.

## 1.2.0

**Arte propio de verdad**

- **Cartas**: ilustraciones de xilografía a color para los 22 mayores, los 16 cortes y los 4 ases; los menores del 2 al 10 usan glifos de palo ilustrados y siguen siendo exactos. Dorso nuevo. El marco, el numeral y el nombre los sigue componiendo `npm run tarot`.
- **Retratos** por defecto ilustrados (6 Hermanas, 3 PNJ y el pueblo) y **estampas de tinta** de «Acusada» y «La cautiva» en la hoja.
- **Compendio «Escenarios»** con 8 escenas ilustradas listas para usar.
- **Papel y terciopelo** reales como fondo de hojas, tracker y chat; emblemas ilustrados de las siete horas en la tira del tracker; portada nueva del sistema.
- `npm run arte` importa un zip de arte nuevo (recorta, reduce y pasa a WebP).

## 1.1.0

**Rediseño completo y auditoría** (ver `docs/AUDITORIA.md`)

- **Tarot rehecho**: las 78 cartas, el dorso y la portada, en grabado marsellés. Antes las 22 cartas de mayores eran idénticas.
- **Tracker de La Jueza**: tira de las siete horas con salto directo, barra **«Ahora»** con el siguiente paso, escena y mesa en dos columnas, puntos de inversión y diseño según la hora (sin panel de escena en Laudes o el Final).
- **Automatismos**: sorteo de vínculos y quién empieza, cuenta atrás de Prima, primera sospecha para conservar y segunda para entregar con destinataria propuesta, aviso si falta alguien por robar antes de Laudes, sentencia del Final.
- **Fichas**: papel y tinta con tipografía IM Fell, carta del arcano en cada vínculo, la pregunta con el nombre ya puesto, sello de acusada o cautiva, retratos en arco y **modo oscuro**.
- **Seguridad en mesa**: Pausa, Velo y Tarjeta X anónimas y líneas y velos acordados.
- **Diagnóstico** copiable, **créditos**, **sonido ambiente** sintetizado (campanas, cartas) y **retratos por defecto**.
- Correcciones: la guía de las ayudas, el modo de alta legibilidad rompía los iconos, el manual ilegible con el tema claro, retratos sin encuadre en el tracker y Laudes revelable dos veces.
- Se retiran las tipografías Oswald y Barlow.

## 1.0.0

**Primera versión**

- **Fichas**: Hermana (frases de la hoja, vínculos con las tres tablas, sospechas
  y notas), PNJ (arcano → arquetipo, papel, descriptor, impulso) y Pueblo (nos
  une, refugio, acusador y rasgos).
- **Mazos**: Arcanos Mayores (19) y Menores (56) con arte generado, más los
  marcadores de La Estrella, El Sol y La Luna; se crean automáticamente al entrar
  en la partida.
- **Escena**: objetivo, lugar y PNJ; robo del Mayor del concepto y robo de dos
  Menores por Hermana con límite configurable; escena compartida con concepto
  dominante por número (empate de máximo = todas).
- **Sospechas**: robadas boca abajo al montón del mundo, reveladas y sumadas en
  **Laudes** —las entregadas a una destinataria suman para ella—, con
  acusación al máximo (en empate, a todas).
- **Tracker de La Jueza**: fases del día con marcador y anuncio, inversiones
  (una por carta, límite = nº de Hermanas), dado opcional de 1 a 6, recuento y
  reinicio. Uso reservado al GM: el resto de la mesa lo ve en solo lectura, sin
  valores ni destinatarias, y el socket de sesión solo aplica peticiones de GM.
- **Compendio «Ayudas de juego»**: guía de uso, tabla de vínculos, conceptos de
  jugadoras y de directora, arquetipos, fases y dado.
- **Ajustes**: valores de las figuras, destinatarias de los menores, robos por
  Hermana, bienvenida y tamaño de letra.
- **Accesibilidad**: icono en todas las ventanas (escala, contraste, legibilidad,
  movimiento) y encuadre de retrato.
