#!/usr/bin/env python3
"""
Importa el zip de arte (MR-Nosotras-Arte) al sistema: recorta, reduce y pasa a WebP.
Uso:  python3 scripts/importar-arte.py <carpeta_descomprimida>
Salida (todo en WebP, los PNG originales no se versionan):
  assets/tarot/arte/{mayores,menores}/<clave>.webp   ilustraciones de las cartas
  assets/tarot/glifos/<palo>.webp                    glifos de palo recortados y con transparencia
  assets/tarot/dorso-arte.webp                       dorso
  assets/retratos/*.webp   assets/escenarios/*.webp   assets/portadas/portada.webp
  assets/sprites/{horas,sellos}/*.webp  assets/sprites/logo.webp   assets/texturas/*.webp
  docs/img/hero.webp  docs/img/escenarios/*.webp
"""
import sys, pathlib
from PIL import Image, ImageDraw, ImageFilter

origen = pathlib.Path(sys.argv[1])
raiz = pathlib.Path(__file__).resolve().parent.parent
limpio = lambda p: p.stem.replace("_dudosa", "")


def guardar(im, destino, q=82, **kw):
    destino = raiz / destino
    destino.parent.mkdir(parents=True, exist_ok=True)
    im.save(destino, "WEBP", quality=q, method=6, **kw)
    return destino


def escalar(im, ancho=None, alto=None):
    if ancho and im.width > ancho:
        im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    if alto and im.height > alto:
        im = im.resize((round(im.width * alto / im.height), alto), Image.LANCZOS)
    return im


def transparente(im, tolerancia=38):
    """Quita el fondo blanco conectado con los bordes (los blancos interiores se conservan)."""
    rgb = im.convert("RGB")
    marca = (255, 0, 255)
    w, h = rgb.size
    for semilla in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        if sum(rgb.getpixel(semilla)) > 700:
            ImageDraw.floodfill(rgb, semilla, marca, thresh=tolerancia)
    alfa = Image.new("L", rgb.size, 255)
    datos = rgb.load(); a = alfa.load()
    for y in range(h):
        for x in range(w):
            if datos[x, y] == marca:
                a[x, y] = 0
    alfa = alfa.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    sal = im.convert("RGBA")
    sal.putalpha(alfa)
    return sal.crop(sal.getbbox()) if sal.getbbox() else sal


n = 0
# Cartas: ilustraciones sin marco; el sistema pone el marco, el numeral y el nombre.
for sub in ("mayores", "menores"):
    for f in sorted((origen / "tarot/arte" / sub).glob("*.png")):
        im = escalar(Image.open(f).convert("RGB"), ancho=728)
        guardar(im, f"assets/tarot/arte/{sub}/{limpio(f)}.webp", 76); n += 1
guardar(escalar(Image.open(origen / "tarot/dorso.png").convert("RGB").resize((900, 1500), Image.LANCZOS), 900), "assets/tarot/dorso-arte.webp", 86)

# Sprites con transparencia
dims = {}
for f in sorted((origen / "sprites/glifos").glob("*.png")):
    g = escalar(transparente(Image.open(f)), alto=420)
    guardar(g, f"assets/tarot/glifos/{limpio(f)}.webp", 90); n += 1
    dims[limpio(f)] = [g.width, g.height]
import json
(raiz / "assets/tarot/glifos/dimensiones.json").write_text(json.dumps(dims))
for sub in ("horas", "sellos"):
    for f in sorted((origen / "sprites" / sub).glob("*.png")):
        guardar(escalar(transparente(Image.open(f)), ancho=420, alto=420), f"assets/sprites/{sub}/{limpio(f)}.webp", 90); n += 1
guardar(escalar(transparente(Image.open(next(origen.glob("sprites/logo*.png")))), ancho=512, alto=512), "assets/sprites/logo.webp", 90)

# Retratos, portada, escenarios, texturas
for f in sorted((origen / "retratos").glob("*.png")):
    guardar(escalar(Image.open(f).convert("RGB"), ancho=560), f"assets/retratos/{limpio(f)}.webp", 84); n += 1
guardar(escalar(Image.open(origen / "portadas/portada.png").convert("RGB"), 1920), "assets/portadas/portada.webp", 80)
guardar(escalar(Image.open(origen / "portadas/hero.png").convert("RGB"), 1920), "docs/img/hero.webp", 80)
for f in sorted((origen / "escenarios").glob("*.png")):
    im = Image.open(f).convert("RGB")
    guardar(escalar(im, 2560), f"assets/escenarios/{limpio(f)}.webp", 78)
    guardar(escalar(im, 640), f"docs/img/escenarios/{limpio(f)}.webp", 76); n += 1
guardar(escalar(Image.open(origen / "texturas/papel.png").convert("RGB"), 768), "assets/texturas/papel.webp", 84)
guardar(escalar(Image.open(origen / "texturas/terciopelo.png").convert("RGB"), 768), "assets/texturas/terciopelo.webp", 84)
print(f"importadas {n} imágenes")
