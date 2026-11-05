"""Gera o Manual de Identidade Visual (PDF e PPTX) a partir de brandbook.html.

Cada página do manual é uma <figure class="prancha prancha--html"> do brandbook, desenhada
em 1123 × 794 px. O script abre o brandbook no Chromium (Playwright), captura cada prancha
em escala 2 (2246 × 1588 px, JPEG) e monta, no mesmo formato da versão de 03/11/2026:

  assets/downloads/Dungeon_Cafe_Manual_de_Identidade_Visual.pdf
      A4 paisagem (841,89 × 595,25 pt), uma imagem por página, ocupando a página inteira.
  assets/downloads/Dungeon_Cafe_Manual_de_Identidade_Visual.pptx
      Slides de 297 × 210 mm, uma imagem por slide, em tela cheia.

Como rodar (Windows, dentro da pasta site/; precisa de internet por causa do Google Fonts):

    python -m venv --system-site-packages .venv
    .venv\\Scripts\\python -m pip install playwright pillow python-pptx
    .venv\\Scripts\\python -m playwright install chromium   (só na primeira vez)
    .venv\\Scripts\\python scripts\\gerar_manual.py

Depois de gerar, confira o PDF e ajuste os tamanhos citados nos botões "Baixar PDF" e
"Baixar PowerPoint" do brandbook.html, se tiverem mudado.
"""

from __future__ import annotations

import io
import os
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright
from pptx import Presentation
from pptx.util import Emu

SITE = Path(__file__).resolve().parent.parent
BRANDBOOK = SITE / "brandbook.html"
DESTINO = SITE / "assets" / "downloads"
NOME = "Dungeon_Cafe_Manual_de_Identidade_Visual"
TITULO = "Dungeon Café — Manual de Identidade Visual"
AUTOR = "Bruno Freitas de Souza"

LARGURA_PG, ALTURA_PG = 1123, 794          # prancha no brandbook, em px CSS
ESCALA = 2                                 # imagem final: 2246 × 1588 px
QUALIDADE_JPEG = 90
PDF_W, PDF_H = 841.889764, 595.245300      # A4 paisagem, em pontos
PPTX_W, PPTX_H = 10689336, 7562088         # 297 × 210 mm, em EMU

# Força cada prancha em escala 1 e deixa só as pranchas na página (sem cabeçalho fixo, capa,
# faixas "respiro" e rodapé), para elas ficarem em posições inteiras: 0, 794, 1588 px...
# Com o texto acima delas, o topo caía em frações de pixel e a captura saía com 1 px a mais.
CSS_CAPTURA = f"""
  body > :not(main), main > :not(.projeto), .projeto > :not(.prancha--html) {{
    display: none !important; }}
  .projeto {{ padding: 0 !important; margin: 0 !important; }}
  .prancha--html {{ width: {LARGURA_PG}px !important; height: {ALTURA_PG}px !important;
                    max-width: none !important; aspect-ratio: auto !important; }}
  .prancha--html .pg {{ transform: none !important; }}
"""


def capturar_pranchas() -> list[bytes]:
    """Devolve um JPEG (2246 × 1588) por prancha, na ordem do brandbook."""
    jpegs = []
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pagina = navegador.new_page(viewport={"width": 1400, "height": 1000},
                                    device_scale_factor=ESCALA, reduced_motion="reduce")
        pagina.goto(BRANDBOOK.as_uri(), wait_until="networkidle")
        pagina.add_style_tag(content=CSS_CAPTURA)
        pagina.evaluate("""async () => {
          document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; });
          await Promise.all([...document.images].map(i => i.complete ? null :
            new Promise(ok => { i.onload = i.onerror = ok; })));
          await document.fonts.ready;
        }""")
        pranchas = pagina.query_selector_all("figure.prancha--html")
        if not pranchas:
            raise SystemExit("Nenhuma prancha encontrada em brandbook.html")
        for n, prancha in enumerate(pranchas, 1):
            prancha.scroll_into_view_if_needed()
            pagina.wait_for_timeout(150)
            img = Image.open(io.BytesIO(prancha.screenshot(type="png"))).convert("RGB")
            esperado = (LARGURA_PG * ESCALA, ALTURA_PG * ESCALA)
            if img.size != esperado:
                raise SystemExit(f"Prancha {n}: {img.size}, esperado {esperado}")
            saida = io.BytesIO()
            img.save(saida, "JPEG", quality=QUALIDADE_JPEG, optimize=True)
            jpegs.append(saida.getvalue())
            print(f"prancha {n:02d} capturada")
        navegador.close()
    return jpegs


def _texto_pdf(texto: str) -> bytes:
    return b"<FEFF" + texto.encode("utf-16-be").hex().upper().encode() + b">"


def montar_pdf(jpegs: list[bytes]) -> bytes:
    """PDF mínimo: uma página A4 paisagem por imagem, a imagem ocupando a página toda."""
    objetos: list[bytes] = [b"", b""]  # 1 = Catalog, 2 = Pages (preenchidos no fim)

    def novo(conteudo: bytes) -> int:
        objetos.append(conteudo)
        return len(objetos)

    paginas = []
    w_px, h_px = LARGURA_PG * ESCALA, ALTURA_PG * ESCALA
    for jpeg in jpegs:
        img = novo(b"<< /Type /XObject /Subtype /Image /Width %d /Height %d "
                   b"/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode "
                   b"/Length %d >>\nstream\n" % (w_px, h_px, len(jpeg)) + jpeg + b"\nendstream")
        desenho = b"q %.6f 0 0 %.6f 0 0 cm /image Do Q\n" % (PDF_W, PDF_H)
        cont = novo(b"<< /Length %d >>\nstream\n" % len(desenho) + desenho + b"endstream")
        paginas.append(novo(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.6f %.6f] "
                            b"/Resources << /XObject << /image %d 0 R >> >> /Contents %d 0 R >>"
                            % (PDF_W, PDF_H, img, cont)))
    objetos[0] = b"<< /Type /Catalog /Pages 2 0 R >>"
    objetos[1] = b"<< /Type /Pages /Count %d /Kids [%s] >>" % (
        len(paginas), b" ".join(b"%d 0 R" % k for k in paginas))
    agora = datetime.now(timezone.utc).strftime("D:%Y%m%d%H%M%SZ").encode()
    info = novo(b"<< /Title %s /Author %s /CreationDate (%s) /ModDate (%s) >>"
                % (_texto_pdf(TITULO), _texto_pdf(AUTOR), agora, agora))

    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    posicoes = []
    for i, obj in enumerate(objetos, 1):
        posicoes.append(len(pdf))
        pdf += b"%d 0 obj\n" % i + obj + b"\nendobj\n"
    xref = len(pdf)
    pdf += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objetos) + 1)
    pdf += b"".join(b"%010d 00000 n \n" % pos for pos in posicoes)
    pdf += (b"trailer\n<< /Size %d /Root 1 0 R /Info %d 0 R >>\nstartxref\n%d\n%%%%EOF\n"
            % (len(objetos) + 1, info, xref))
    return bytes(pdf)


def montar_pptx(jpegs: list[bytes]) -> bytes:
    """Uma imagem por slide, em tela cheia."""
    apresentacao = Presentation()
    apresentacao.slide_width, apresentacao.slide_height = Emu(PPTX_W), Emu(PPTX_H)
    em_branco = apresentacao.slide_layouts[6]
    for jpeg in jpegs:
        slide = apresentacao.slides.add_slide(em_branco)
        slide.shapes.add_picture(io.BytesIO(jpeg), 0, 0, Emu(PPTX_W), Emu(PPTX_H))
    apresentacao.core_properties.title = TITULO
    apresentacao.core_properties.author = AUTOR
    saida = io.BytesIO()
    apresentacao.save(saida)
    return saida.getvalue()


def gravar(caminho: Path, dados: bytes) -> None:
    """Grava num temporário e troca no fim, para nunca deixar um arquivo pela metade."""
    temporario = caminho.with_suffix(caminho.suffix + ".tmp")
    temporario.write_bytes(dados)
    os.replace(temporario, caminho)
    print(f"{caminho.relative_to(SITE)}: {len(dados) / 1_000_000:.1f} MB")


def main() -> None:
    jpegs = capturar_pranchas()
    gravar(DESTINO / f"{NOME}.pdf", montar_pdf(jpegs))
    gravar(DESTINO / f"{NOME}.pptx", montar_pptx(jpegs))


if __name__ == "__main__":
    main()
