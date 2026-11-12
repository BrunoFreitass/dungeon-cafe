"""Teste visual das 33 pranchas do brandbook: compara cada uma com uma imagem de referência.

As pranchas (<figure class="prancha prancha--html">) têm medidas fixas (1123 × 794 px) e viram o
Manual de Identidade Visual em PDF (scripts/gerar_manual.py). Uma mudança de HTML ou CSS que mexa
no layout de uma prancha (como o <picture> que quebrou a grade das embalagens em 11/2026) aparece
aqui antes de chegar ao manual.

Captura do mesmo jeito que o gerar_manual.py (Chromium, CSS que isola as pranchas em escala 1),
reduz cada prancha à metade (561 × 397) e compara com scripts/referencia_pranchas/prancha-NN.png.
Uma prancha falha quando mais de LIMITE (1%) dos pixels muda de cor de forma visível (diferença
acima de 40 em algum canal). As referências são PNG: a comparação não sofre com artefatos de JPEG.

Como rodar, dentro da pasta site/ (precisa de internet por causa do Google Fonts):

    python scripts/conferir_pranchas.py                  # compara; sai com 1 se alguma mudou
    python scripts/conferir_pranchas.py --saida pasta    # guarda capturas e mapas de diferença
    python scripts/conferir_pranchas.py --atualizar      # regrava as referências (só depois de
                                                         # conferir que a mudança é desejada)

Requer: playwright (com o Chromium instalado) e pillow.
"""

from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

SITE = Path(__file__).resolve().parent.parent
REFERENCIAS = Path(__file__).resolve().parent / "referencia_pranchas"
LARGURA_PG, ALTURA_PG = 1123, 794
REDUCAO = 2  # referências guardadas pela metade: 561 × 397 px
LIMITE = 0.01  # fração máxima de pixels com diferença visível
LIMIAR_PIXEL = 40  # diferença (0 a 255) em algum canal para o pixel contar como mudado

# O mesmo CSS do gerar_manual.py: só as pranchas na página, em escala 1 e posições inteiras.
CSS_CAPTURA = f"""
  body > :not(main), main > :not(.projeto), .projeto > :not(.prancha--html) {{
    display: none !important; }}
  .projeto {{ padding: 0 !important; margin: 0 !important; }}
  .prancha--html {{ width: {LARGURA_PG}px !important; height: {ALTURA_PG}px !important;
                    max-width: none !important; aspect-ratio: auto !important; }}
  .prancha--html .pg {{ transform: none !important; }}
"""


def capturar(raiz: Path, largura_janela: int = 1440) -> list[Image.Image]:
    """Uma imagem RGB (1123 × 794) por prancha de raiz/brandbook.html, na ordem da página."""
    imagens = []
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pagina = navegador.new_page(
            viewport={"width": largura_janela, "height": 1000}, reduced_motion="reduce"
        )
        pagina.goto((raiz / "brandbook.html").as_uri(), wait_until="networkidle")
        pagina.add_style_tag(content=CSS_CAPTURA)
        pagina.evaluate("""async () => {
          document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; });
          await Promise.all([...document.images].map(i => i.complete ? null :
            new Promise(ok => { i.onload = i.onerror = ok; })));
          await document.fonts.ready;
        }""")
        for prancha in pagina.query_selector_all("figure.prancha--html"):
            prancha.scroll_into_view_if_needed()
            pagina.wait_for_timeout(150)
            imagens.append(Image.open(io.BytesIO(prancha.screenshot(type="png"))).convert("RGB"))
        navegador.close()
    if not imagens:
        raise SystemExit("Nenhuma prancha encontrada em brandbook.html")
    return imagens


def reduzir(imagem: Image.Image) -> Image.Image:
    tamanho = (LARGURA_PG // REDUCAO, ALTURA_PG // REDUCAO)
    return imagem.resize(tamanho, Image.Resampling.LANCZOS)


def diferenca(a: Image.Image, b: Image.Image) -> tuple[float, Image.Image]:
    """(fração de pixels mudados, mapa da diferença em vermelho sobre a imagem b esmaecida)."""
    if a.size != b.size:
        return 1.0, b
    canais = ImageChops.difference(a, b).split()
    maior = ImageChops.lighter(ImageChops.lighter(canais[0], canais[1]), canais[2])
    mascara = maior.point(lambda v: 255 if v > LIMIAR_PIXEL else 0)
    mudados = mascara.histogram()[255]
    mapa = Image.blend(b, Image.new("RGB", b.size, "white"), 0.6)
    mapa.paste(Image.new("RGB", b.size, (220, 0, 0)), mask=mascara)
    return mudados / (a.width * a.height), mapa


def main() -> int:
    argumentos = argparse.ArgumentParser(description=(__doc__ or "").split("\n\n")[0])
    argumentos.add_argument("--atualizar", action="store_true", help="regrava as referências")
    argumentos.add_argument("--saida", type=Path, help="pasta para capturas e diferenças")
    argumentos.add_argument("--raiz", type=Path, default=SITE, help="pasta do site (padrão: site/)")
    opcoes = argumentos.parse_args()

    capturas = [reduzir(i) for i in capturar(opcoes.raiz)]
    print(f"{len(capturas)} pranchas capturadas")
    if opcoes.saida:
        opcoes.saida.mkdir(parents=True, exist_ok=True)

    if opcoes.atualizar:
        REFERENCIAS.mkdir(exist_ok=True)
        for antiga in REFERENCIAS.glob("prancha-*.png"):
            antiga.unlink()
        for n, imagem in enumerate(capturas, 1):
            imagem.save(REFERENCIAS / f"prancha-{n:02d}.png", optimize=True)
        print(f"Referências regravadas em {REFERENCIAS.relative_to(SITE)}")
        return 0

    referencias = sorted(REFERENCIAS.glob("prancha-*.png"))
    if len(referencias) != len(capturas):
        print(f"FALHA: {len(capturas)} pranchas na página e {len(referencias)} referências.")
        return 1
    falhas = []
    for n, (atual, arquivo) in enumerate(zip(capturas, referencias, strict=True), 1):
        with Image.open(arquivo) as referencia:
            fracao, mapa = diferenca(referencia.convert("RGB"), atual)
        situacao = "ok" if fracao <= LIMITE else "MUDOU"
        print(f"prancha {n:02d}: {fracao:6.2%} de pixels diferentes  {situacao}")
        if fracao > LIMITE:
            falhas.append(n)
        if opcoes.saida:
            atual.save(opcoes.saida / f"prancha-{n:02d}.png")
            if fracao > 0:
                mapa.save(opcoes.saida / f"prancha-{n:02d}-diferenca.png")
    if falhas:
        lista = ", ".join(f"{n:02d}" for n in falhas)
        print(f"\nFALHA: {len(falhas)} prancha(s) acima de {LIMITE:.0%}: {lista}.")
        return 1
    print(f"\nTodas as {len(capturas)} pranchas iguais à referência (limite {LIMITE:.0%}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
