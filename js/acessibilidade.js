/*
 * Menu de Acessibilidade do Dungeon Café: Web Component <dc-acessibilidade>, sem framework.
 *
 * Fonte única: dungeon-cafe-app/frontend/src/acessibilidade/ (este arquivo e acessibilidade.css).
 * O site recebe uma cópia por scripts/copiar_acessibilidade.py (site/js/ e site/css/).
 *
 * - Os ajustes ficam só no navegador, em localStorage["dc-acessibilidade"]. Nada vai ao servidor.
 * - Os efeitos na página são classes e variáveis CSS no <html> (ex.: html.a11y-mono,
 *   --a11y-escala-fonte); o estado do jogo não é tocado.
 * - As páginas podem ajudar com dois atributos opcionais em qualquer elemento:
 *     data-a11y-resumo="texto"    resumo da página (a fase usa o Pergaminho do Saber);
 *     data-a11y-leitura='{"titulo":"…","baloes":["…"],"pergaminho":["…"]}'  modo de leitura.
 * - Evento "dc-acessibilidade" (detail = estado) no document a cada mudança.
 */
(() => {
  "use strict";
  if (window.customElements?.get("dc-acessibilidade")) return;

  /** Preset visual do painel: "marca" (padrão) ou "neutro". */
  const PRESET = "marca";
  const CHAVE = "dc-acessibilidade";
  const VLIBRAS_JS = "https://vlibras.gov.br/app/vlibras-plugin.js";
  const VLIBRAS_APP = "https://vlibras.gov.br/app";

  const TEMAS = {
    marca: {
      "--p-fundo": "#F4ECE1", "--p-borda": "#C9933B", "--p-texto": "#2A1810", "--p-suave": "#5A3E2E",
      "--p-barra": "#1F130B", "--p-barra-texto": "#F4ECE1", "--p-cartao": "#FFFFFF", "--p-icone": "#2A1810",
      "--p-ativo-fundo": "#F3E2C0", "--p-ativo-borda": "#8F6103", "--p-botao": "#1F130B",
      "--p-botao-texto": "#F4ECE1", "--p-foco": "#8F6103", "--p-titulo": "'Texturina', Georgia, serif",
    },
    neutro: {
      "--p-fundo": "#E6E6EC", "--p-borda": "#B5B5C0", "--p-texto": "#111111", "--p-suave": "#3D3D45",
      "--p-barra": "#0F7B7B", "--p-barra-texto": "#FFFFFF", "--p-cartao": "#FFFFFF", "--p-icone": "#111111",
      "--p-ativo-fundo": "#DDF1F1", "--p-ativo-borda": "#0F7B7B", "--p-botao": "#0F7B7B",
      "--p-botao-texto": "#FFFFFF", "--p-foco": "#0F7B7B", "--p-titulo": "system-ui, 'Segoe UI', Arial, sans-serif",
    },
  };

  // Recursos em níveis: valor de cada nível (índice 1..n; 0 = desligado).
  const NIVEIS = {
    fonteMais: [1, 1.2, 1.4, 1.6],
    fonteMenos: [1, 0.9, 0.8],
    letras: [0, 0.06, 0.12, 0.18],
    linhas: [0, 1.7, 2, 2.3],
    cursor: [0, 40, 56, 72],
  };
  const CORES_FUNDO = [["Pergaminho", "#F4ECE1"], ["Marrom Masmorra", "#1F130B"], ["Branco", "#FFFFFF"], ["Preto", "#000000"], ["Creme", "#FFF8E1"], ["Azul-claro", "#DDEEFF"]];
  const CORES_TEXTO = [["Preto", "#000000"], ["Branco", "#FFFFFF"], ["Marrom Masmorra", "#1F130B"], ["Amarelo", "#FFE14D"], ["Azul-escuro", "#0B2A5B"]];

  // Ordem da grade. O "Vídeo Acessível" do exemplo não entra: a plataforma não tem vídeos.
  const RECURSOS = [
    ["clique", "Clique para Ouvir", "ouvir", "Clique num texto para ouvir a leitura em voz alta. Nas lições, lê o balão inteiro."],
    ["descrever", "Descrever Imagem", "imagem", "Ao passar o mouse ou focar numa imagem, mostra e lê a descrição dela."],
    ["esconderImg", "Esconder Imagens", "semImagem", "Esconde as imagens decorativas e troca as de conteúdo pela descrição."],
    ["fundo", "Alterar Cor de Fundo", "fundo", "Escolha uma cor de fundo para a página.", "paleta"],
    ["texto", "Alterar Cor do Texto", "texto", "Escolha uma cor para os textos.", "paleta"],
    ["fonteMais", "Aumentar Fonte", "fonteMais", "Aumenta o texto em 3 níveis, até cerca de 60%.", "nivel"],
    ["fonteMenos", "Diminuir Fonte", "fonteMenos", "Diminui o texto em 2 níveis, até cerca de 20%.", "nivel"],
    ["mono", "Monocromático", "mono", "Mostra a página em tons de cinza."],
    ["baixaSat", "Baixa Saturação", "baixaSat", "Deixa as cores mais suaves."],
    ["altaSat", "Alta Saturação", "altaSat", "Deixa as cores mais fortes."],
    ["inverter", "Inverter Cores", "inverter", "Inverte as cores; imagens e personagens ficam com as cores originais."],
    ["resumo", "Resumir Página", "resumo", "Mostra um resumo curto da página atual."],
    ["dicionario", "Dicionário", "dicionario", "Clique duas vezes ou selecione um termo do café para ver a definição."],
    ["vlibras", "VLibras", "libras", "Tradução para Libras pelo VLibras, do Governo Federal."],
    ["foco", "Destacar Foco", "foco", "Contorno grosso no elemento em foco."],
    ["links", "Destacar Links", "links", "Sublinha e destaca links e botões."],
    ["letras", "Espaçamento das Letras", "letras", "Aumenta o espaço entre as letras em 3 níveis.", "nivel"],
    ["linhas", "Espaçamento das Linhas", "linhas", "Aumenta o espaço entre as linhas em 3 níveis.", "nivel"],
    ["cursor", "Aumentar Cursor", "cursor", "Cursor maior, em 3 tamanhos.", "nivel"],
    ["cursorEscuro", "Aumentar e Escurecer Cursor", "cursorEscuro", "Cursor grande, preto com contorno branco."],
    ["semSom", "Desativar Som", "semSom", "Silencia os sons e a leitura em voz alta."],
    ["pausar", "Pausar Animações", "pausar", "Desliga animações, transições e a máquina de escrever das lições."],
    ["barra", "Barra de Leitura", "barra", "Uma faixa horizontal acompanha o cursor ou o toque."],
    ["mascara", "Máscara de Leitura", "mascara", "Escurece a tela, menos uma janela em volta do cursor."],
    ["dislexia", "Fonte para Dislexia", "dislexia", "Troca as fontes da página pela OpenDyslexic."],
    ["leitura", "Modo de Leitura", "leitura", "Nas lições e no Grimório, mostra só o texto, em coluna única."],
  ];
  const NOMES = Object.fromEntries(RECURSOS.map((r) => [r[0], r[1]]));
  const TIPO = Object.fromEntries(RECURSOS.map((r) => [r[0], r[4] || "liga"]));

  const PERFIS = [
    ["auditiva", "Pessoa com Deficiência Auditiva", { vlibras: true, foco: true }],
    ["dislexia", "Pessoa com Dislexia", { dislexia: true, letras: 1, linhas: 1, barra: true }],
    ["convulsao", "Perfil Seguro para Convulsão", { pausar: true, baixaSat: true }],
    ["visual", "Pessoa com Deficiência Visual", { fonteMais: 2, altaSat: true, cursorEscuro: true, links: true, foco: true, clique: true }],
    ["tdah", "Pessoa com TDAH", { mascara: true, pausar: true, leitura: true }],
    ["cognitiva", "Pessoa com Deficiência Cognitiva", { fonteMais: 1, linhas: 1, links: true, resumo: true, dicionario: true }],
    ["epilepsia", "Pessoa com Epilepsia", { pausar: true, baixaSat: true, semSom: true }],
  ];

  // Resumos escritos à mão (até 40 palavras), um por rota. A fase usa o Pergaminho (data-a11y-resumo).
  const RESUMOS = {
    trilha: "Esta é a sua trilha: 10 fases por região. As lições ensinam com o mentor; nas fases 5 e 10 você enfrenta os chefes do folclore. Leia o QR do pacote para liberar a próxima fase.",
    fase: "Esta é uma lição em diálogo com o seu mentor. Leia os balões e, no fim, o Pergaminho do Saber, com 3 fatos que caem na batalha contra o chefe.",
    batalha: "Batalha contra o chefe: ele tem 5 de vida e você, 3 corações. Responda 5 perguntas; cada acerto tira vida do chefe. Use o poder do mentor uma vez. Vencer com 3 corações rende um cupom.",
    bau: "O Baú guarda os seus cupons: 10% pelo Boitatá e 20% pelo Mapinguari. Cada cupom vale para 1 pacote avulso, uma vez, por 30 dias.",
    perfil: "No perfil você vê a sua aparência e a coleção de classes, troca a aparência, salva o progresso com a conta Google ou exclui a sua conta.",
    inicio: "Aqui você escolhe o mentor e a aparência do seu aprendiz para começar a jornada pelas regiões cafeeiras do Brasil.",
    grimorio: "O Grimório reúne os Pergaminhos do Saber das fases que você já concluiu, com os fatos e as fontes de cada lição.",
    checkout: "Compra simulada de 1 pacote avulso de R$ 34,90, com o desconto de um cupom do Baú. Nenhum pagamento é feito.",
    entrar: "Entre com a conta Google ou como visitante para começar a jornada do Dungeon Café.",
    privacidade: "Esta página explica quais dados o Dungeon Café guarda, por quanto tempo e como excluir a sua conta.",
    siteInicio: "Site do Dungeon Café, clube de cafés especiais das 5 regiões do Brasil. Cada pacote libera uma fase de uma jornada com mentores e chefes do folclore. Veja as regiões, os mentores e os planos.",
    brandbook: "Manual de identidade visual do Dungeon Café: logotipo, cores, tipografia, mentores, embalagens, aplicações e a jornada gamificada, em 33 páginas, com downloads em PDF e PowerPoint.",
  };

  // Glossário tirado do conteúdo aprovado (balões e pergaminhos); o último campo é a lição de origem.
  const GLOSSARIO = [
    [["arábica", "arabica", "coffea arabica"], "Arábica", "Espécie de café Coffea arabica. Nas terras altas e amenas de Goiás e do Distrito Federal, reina o arábica.", "Centro-Oeste, fase 3 (Alquimia Botânica: Arábica e Canéfora)"],
    [["canéfora", "canefora", "coffea canephora"], "Canéfora", "O Coffea canephora, o café canéfora, a grande estrela da Amazônia. O conilon e o robusta são grupos dessa espécie.", "Norte, fase 3 (Espécies e Variedades na Amazônia); Nordeste, fase 3"],
    [["conilon"], "Conilon", "Grupo da espécie Coffea canephora, ao lado do Robusta.", "Nordeste, fase 3 (Espécies e Variedades na Bahia)"],
    [["robusta"], "Robusta", "Grupo da espécie Coffea canephora, ao lado do conilon.", "Nordeste, fase 3 (Espécies e Variedades na Bahia)"],
    [["robustas amazônicos", "robustas amazonicos"], "Robustas Amazônicos", "Café diferenciado que nasceu do cruzamento entre variedades Conilon e Robusta.", "Norte, fase 3 (Espécies e Variedades na Amazônia)"],
    [["ig", "indicação geográfica", "indicacao geografica"], "Indicação Geográfica (IG)", "Selo registrado pelo INPI que reconhece o elo entre um produto, sua terra e quem o produz. Pela Lei 9.279/1996, tem 2 tipos: IP e DO.", "Centro-Oeste, fase 8 (O Selo Mágico da Origem); Nordeste, fase 8"],
    [["ip", "indicação de procedência", "indicacao de procedencia"], "Indicação de Procedência (IP)", "Nome de um lugar que ficou conhecido como centro de produção de um produto.", "fase 8 do Norte, Nordeste, Sudeste e Sul (Lei 9.279/1996)"],
    [["do", "denominação de origem", "denominacao de origem"], "Denominação de Origem (DO)", "Nome de um lugar cujo produto tem qualidades que se devem ao meio geográfico, incluindo fatores naturais e humanos.", "fase 8 do Norte, Nordeste, Sudeste e Sul (Lei 9.279/1996)"],
    [["pós-colheita", "pos-colheita", "pós colheita"], "Pós-colheita", "Tudo o que acontece com o café depois que sai do pé. É aqui que o fruto colhido vira café de qualidade.", "Sudeste, fase 6 (Dominando a Pós-Colheita Cafeeira); Norte, fase 6"],
    [["natural", "café natural", "via seca"], "Natural (via seca)", "Processamento em que os grãos seguem inteiros para a secagem: seca-se o fruto inteiro.", "Sul, fase 6 (A Cura da Pós-Colheita); Centro-Oeste, fase 6"],
    [["cereja descascado", "via úmida", "via umida", "descascado"], "Cereja descascado (via úmida)", "Método em que os frutos têm a polpa retirada antes da secagem.", "Sul, fase 6 (A Cura da Pós-Colheita); Nordeste, fase 6"],
    [["prova de xícara", "prova de xicara", "cupping"], "Prova de xícara (cupping)", "Técnica de avaliadores especializados, com procedimentos padrão de preparo da bebida e de avaliação dos atributos.", "Sudeste, fase 7 (Sensorial no Sudeste: Aroma e Sabor)"],
    [["café especial", "cafe especial", "especial", "especiais", "sca"], "Café especial", "Café com escore acima de 80 pontos numa escala de 0 a 100 (Specialty Coffee Association, SCA).", "Sul, fase 7 (Desvendando o Perfil Sensorial Paranaense); Centro-Oeste, fase 7"],
    [["finalização", "finalizacao"], "Finalização", "O sabor que fica na boca depois do gole.", "Centro-Oeste, fase 7 (A Alquimia da Degustação)"],
    [["equilíbrio", "equilibrio"], "Equilíbrio", "Na prova de xícara, a combinação de sabor, acidez e corpo, mostrando se essa união está em harmonia.", "Sudeste, fase 7 (Sensorial no Sudeste: Aroma e Sabor)"],
    [["edafoclimático", "edafoclimáticas", "edafoclimatico", "edafoclimaticas"], "Edafoclimático", "De solo e clima: condições edafoclimáticas são as condições de solo e clima.", "Sudeste, fase 1 (Explorando o Território do Café)"],
    [["calagem"], "Calagem", "Uso de calcário contra a acidez do solo.", "Centro-Oeste, fase 2 (A Alquimia Histórica do Café)"],
    [["gessagem"], "Gessagem", "Uso de gesso que melhora o solo profundo.", "Centro-Oeste, fase 2 (A Alquimia Histórica do Café)"],
    [["latossolo", "latossolos"], "Latossolo", "Solo profundo e bem drenado, como os do Planalto Central.", "Centro-Oeste, fase 1 (O Território Mágico do Planalto Central)"],
    [["estresse hídrico", "estresse hidrico"], "Estresse hídrico controlado", "Suspender a irrigação por cerca de 70 dias no inverno seco e depois retomá-la, para sincronizar a florada e uniformizar a maturação.", "Centro-Oeste, fase 4 (Manejo e Colheita no Planalto)"],
    [["ferrugem", "ferrugem-alaranjada"], "Ferrugem-alaranjada", "Uma doença do cafeeiro.", "Norte, fase 3 (Espécies e Variedades na Amazônia)"],
    [["broca", "broca-do-café", "broca-do-cafe"], "Broca-do-café", "Praga do cafeeiro, citada ao lado da ferrugem entre as doenças e pragas.", "Nordeste, fase 6 (Segredos da Pós-Colheita Baiana)"],
  ];
  const INDICE = new Map();
  for (const item of GLOSSARIO) for (const alias of item[0]) INDICE.set(alias, item);

  // ---------------------------------------------------------------- estado
  const PADRAO = () => ({ recursos: {}, perfis: {}, narrar: false });
  function lerEstado() {
    try {
      const e = JSON.parse(window.localStorage.getItem(CHAVE) || "null");
      if (e && typeof e === "object") return { ...PADRAO(), ...e, recursos: { ...(e.recursos || {}) }, perfis: { ...(e.perfis || {}) } };
    } catch { /* armazenamento indisponível */ }
    return PADRAO();
  }
  function gravarEstado(e) { try { window.localStorage.setItem(CHAVE, JSON.stringify(e)); } catch { /* sem armazenamento */ } }
  let estado = lerEstado();
  const ligado = (id) => Boolean(estado.recursos[id]);
  const nivel = (id) => Number(estado.recursos[id] || 0);

  // ---------------------------------------------------------------- voz (pt-BR)
  function falar(texto) {
    if (!texto || ligado("semSom") || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const f = new SpeechSynthesisUtterance(String(texto).slice(0, 1200));
      f.lang = "pt-BR";
      const voz = window.speechSynthesis.getVoices().find((v) => /^pt[-_]BR/i.test(v.lang));
      if (voz) f.voice = voz;
      window.speechSynthesis.speak(f);
    } catch { /* sem voz */ }
  }
  const calar = () => { try { window.speechSynthesis?.cancel(); } catch { /* nada */ } };

  // ---------------------------------------------------------------- efeitos na página
  const html = document.documentElement;
  const CLASSES = {
    descrever: "a11y-descrever", esconderImg: "a11y-sem-imagens", inverter: "a11y-inverter", foco: "a11y-foco",
    links: "a11y-links", semSom: "a11y-sem-som", pausar: "a11y-pausar", dislexia: "a11y-dislexia",
    clique: "a11y-clique", dicionario: "a11y-dicionario",
  };
  function cursorSvg(tam, escuro) {
    const p = escuro ? "#000" : "#fff", b = escuro ? "#fff" : "#000";
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${tam}' height='${tam}' viewBox='0 0 24 24'><path d='M3 2 L3 20 L8 15 L11.5 22 L14.5 20.5 L11 13.5 L18 13.5 Z' fill='${p}' stroke='${b}' stroke-width='1.6' stroke-linejoin='round'/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 3 2, auto`;
  }
  function aplicarPagina() {
    const r = estado.recursos;
    for (const [id, classe] of Object.entries(CLASSES)) html.classList.toggle(classe, Boolean(r[id]));
    const filtros = [];
    if (r.mono) filtros.push("grayscale(1)");
    if (r.baixaSat) filtros.push("saturate(0.45)");
    if (r.altaSat) filtros.push("saturate(1.8)");
    if (r.inverter) filtros.push("invert(1) hue-rotate(180deg)");
    if (filtros.length) html.style.setProperty("filter", filtros.join(" ")); else html.style.removeProperty("filter");
    // Um filtro no próprio host prenderia os filhos fixos; o painel se reinverte por dentro.
    document.querySelector("dc-acessibilidade")?.toggleAttribute("data-invertido", Boolean(r.inverter));
    const escala = r.fonteMais ? NIVEIS.fonteMais[r.fonteMais] : r.fonteMenos ? NIVEIS.fonteMenos[r.fonteMenos] : 1;
    html.style.setProperty("--a11y-escala-fonte", String(escala));
    html.classList.toggle("a11y-fonte", escala !== 1);
    html.classList.toggle("a11y-letras", nivel("letras") > 0);
    html.style.setProperty("--a11y-letras", `${NIVEIS.letras[nivel("letras")] || 0}em`);
    html.classList.toggle("a11y-linhas", nivel("linhas") > 0);
    html.style.setProperty("--a11y-linhas", String(NIVEIS.linhas[nivel("linhas")] || "normal"));
    html.classList.toggle("a11y-fundo", Boolean(r.fundo));
    if (r.fundo) html.style.setProperty("--a11y-fundo", r.fundo); else html.style.removeProperty("--a11y-fundo");
    html.classList.toggle("a11y-texto", Boolean(r.texto));
    if (r.texto) html.style.setProperty("--a11y-texto", r.texto); else html.style.removeProperty("--a11y-texto");
    const tam = r.cursorEscuro ? 64 : NIVEIS.cursor[nivel("cursor")] || 0;
    html.classList.toggle("a11y-cursor", tam > 0);
    if (tam) html.style.setProperty("--a11y-cursor", cursorSvg(tam, Boolean(r.cursorEscuro))); else html.style.removeProperty("--a11y-cursor");
    if (r.semSom) calar();
    silenciarMidias(Boolean(r.semSom));
    esconderImagens(Boolean(r.esconderImg));
    marcarFundos(Boolean(r.inverter));
    alternarVlibras(Boolean(r.vlibras));
    if (r.descrever) listarSemAlt();
    document.dispatchEvent(new CustomEvent("dc-acessibilidade", { detail: JSON.parse(JSON.stringify(estado)) }));
  }
  function silenciarMidias(sim) {
    for (const m of document.querySelectorAll("audio, video")) {
      if (sim) { if (!m.dataset.a11yMudo) m.dataset.a11yMudo = m.muted ? "1" : "0"; m.muted = true; }
      else if (m.dataset.a11yMudo) { m.muted = m.dataset.a11yMudo === "1"; delete m.dataset.a11yMudo; }
    }
  }
  function esconderImagens(sim) {
    for (const img of document.querySelectorAll("img")) {
      const decorativa = img.getAttribute("alt") === "" || img.getAttribute("aria-hidden") === "true";
      const prox = img.nextElementSibling;
      const tem = prox && prox.hasAttribute("data-a11y-alt");
      if (sim) {
        img.classList.add("a11y-img-escondida");
        if (!decorativa && !tem && img.alt) {
          const s = document.createElement("span");
          s.setAttribute("data-a11y-alt", ""); s.className = "a11y-alt-texto"; s.textContent = img.alt;
          img.insertAdjacentElement("afterend", s);
        }
      } else { img.classList.remove("a11y-img-escondida"); if (tem) prox.remove(); }
    }
  }
  function marcarFundos(sim) {
    if (!sim) { for (const el of document.querySelectorAll("[data-a11y-reinverter]")) el.removeAttribute("data-a11y-reinverter"); return; }
    for (const el of document.body.querySelectorAll("*")) {
      if (el.tagName === "DC-ACESSIBILIDADE" || el.hasAttribute("data-a11y-reinverter")) continue;
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && /url\(/.test(bg)) el.setAttribute("data-a11y-reinverter", "");
    }
  }
  const avisadas = new Set();
  function listarSemAlt() {
    const novas = [...document.querySelectorAll("img:not([alt])")].map((i) => i.currentSrc || i.src).filter((s) => !avisadas.has(s));
    if (novas.length) { novas.forEach((s) => avisadas.add(s)); console.warn(`[acessibilidade] ${novas.length} imagem(ns) sem texto alternativo (alt):`, novas); }
  }
  // O plugin atual do VLibras (7.x) se monta sozinho: cria #vlibras-access-wrapper (com Shadow DOM)
  // e, ao clicar no botão dele, carrega vlibras-plugin-app.js, que cria #vlibras-app-root.
  const VLIBRAS_NOS = "#vlibras-access-wrapper, #vlibras-app-root, script[src*='vlibras-plugin-app'], [data-a11y-vlibras-js]";
  function alternarVlibras(sim) {
    const existente = document.querySelector("[data-a11y-vlibras-js]");
    if (sim && !existente) {
      const s = document.createElement("script");
      s.src = VLIBRAS_JS; s.async = true; s.setAttribute("data-a11y-vlibras-js", "");
      s.onload = () => {
        try { new window.VLibras.Widget(VLIBRAS_APP); } catch (e) { console.warn("[acessibilidade] O VLibras não pôde iniciar:", e); }
      };
      s.onerror = () => console.warn("[acessibilidade] Não foi possível carregar o VLibras (vlibras.gov.br).");
      document.body.appendChild(s);
    } else if (!sim && existente) {
      // Aberto, o VLibras captura os cliques da página (para traduzir o texto clicado). Primeiro
      // fecha o avatar pelo próprio atributo dele, para ele soltar esses ouvintes; depois remove.
      const app = document.getElementById("vlibras-app-root");
      if (app) app.dataset.active = "false";
      existente.removeAttribute("data-a11y-vlibras-js");
      setTimeout(() => {
        if (ligado("vlibras")) return; // religado nesse meio-tempo
        for (const no of document.querySelectorAll(`${VLIBRAS_NOS}, script[src*='vlibras']`)) no.remove();
        for (const el of document.querySelectorAll("[class*='vlibras--']")) {
          el.classList.remove(...[...el.classList].filter((c) => c.startsWith("vlibras--")));
        }
        try { delete window.VLibras; delete window.VLibrasWidget; } catch { /* nada */ }
      }, app ? 600 : 0);
    }
  }

  // ---------------------------------------------------------------- ouvir, descrever, dicionário, guias
  const BLOCOS = "p, li, h1, h2, h3, h4, h5, h6, button, a, label, td, th, figcaption, dd, dt, blockquote, summary, legend";
  function textoParaOuvir(alvo) {
    const caixa = alvo.closest(".dialogo__caixa");
    if (caixa) return (caixa.querySelector(".visualmente-oculto[aria-live]")?.textContent || caixa.textContent).trim();
    const bloco = alvo.closest(BLOCOS) || alvo;
    return (bloco.innerText || bloco.textContent || "").trim().slice(0, 900);
  }
  document.addEventListener("click", (ev) => {
    if (!ligado("clique")) return;
    const alvo = ev.target instanceof Element ? ev.target : null;
    if (!alvo || alvo.closest("dc-acessibilidade")) return;
    falar(textoParaOuvir(alvo));
  }, true);

  let dica = null;
  function mostrarDica(alvo, titulo, texto, rodape) {
    esconderDica();
    dica = document.createElement("div");
    dica.className = "a11y-dica"; dica.setAttribute("role", "status");
    const h = document.createElement("strong"); h.textContent = titulo; dica.appendChild(h);
    const p = document.createElement("span"); p.textContent = texto; dica.appendChild(p);
    if (rodape) { const f = document.createElement("small"); f.textContent = rodape; dica.appendChild(f); }
    document.body.appendChild(dica);
    const r = alvo.getBoundingClientRect();
    const larg = Math.min(320, window.innerWidth - 24);
    dica.style.maxWidth = `${larg}px`;
    dica.style.left = `${Math.max(12, Math.min(r.left, window.innerWidth - larg - 12))}px`;
    let y = r.bottom + 8;
    if (y + dica.offsetHeight + 12 > window.innerHeight) y = Math.max(12, r.top - 8 - dica.offsetHeight);
    dica.style.top = `${y}px`;
  }
  function esconderDica() { dica?.remove(); dica = null; }
  function descreverImagem(ev) {
    if (!ligado("descrever")) return;
    const img = ev.target instanceof Element ? ev.target.closest("img, [role='img']") : null;
    if (!img || img.closest("dc-acessibilidade")) return;
    const alt = img.tagName === "IMG" ? img.getAttribute("alt") : img.getAttribute("aria-label");
    mostrarDica(img, "Imagem", alt === null ? "Imagem sem descrição." : alt === "" ? "Imagem decorativa, sem descrição." : alt);
    if (alt) falar(alt);
  }
  document.addEventListener("mouseover", descreverImagem);
  document.addEventListener("focusin", descreverImagem);
  document.addEventListener("mouseout", (ev) => { if (ligado("descrever") && ev.target instanceof Element && ev.target.closest("img, [role='img']")) esconderDica(); });

  function procurarTermo(bruto) {
    const t = bruto.trim();
    if (!t || t.length > 40) return null;
    if (/^(DO|IP|IG)$/.test(t)) return INDICE.get(t.toLowerCase()); // siglas só em maiúsculas
    const n = t.toLowerCase().replace(/[“”"'(),.;:!?]/g, " ").replace(/\s+/g, " ").trim();
    if (["do", "ip", "ig"].includes(n)) return null;
    return INDICE.get(n) || null;
  }
  function consultarDicionario() {
    if (!ligado("dicionario")) return;
    const sel = window.getSelection?.();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const item = procurarTermo(String(sel));
    if (!item) return;
    mostrarDica(sel.getRangeAt(0), item[1], item[2], `Fonte: lição ${item[3]}`);
    falar(`${item[1]}. ${item[2]}`);
  }
  document.addEventListener("dblclick", () => setTimeout(consultarDicionario, 0));
  document.addEventListener("mouseup", () => setTimeout(consultarDicionario, 0));
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") esconderDica(); });

  let barra = null, cima = null, baixo = null;
  function moverGuias(y) {
    if (barra) barra.style.top = `${y - 18}px`;
    if (cima) { cima.style.height = `${Math.max(0, y - 60)}px`; baixo.style.top = `${y + 60}px`; }
  }
  function atualizarGuias() {
    if (ligado("barra") && !barra) { barra = document.createElement("div"); barra.className = "a11y-barra-leitura"; barra.setAttribute("aria-hidden", "true"); document.body.appendChild(barra); }
    else if (!ligado("barra") && barra) { barra.remove(); barra = null; }
    if (ligado("mascara") && !cima) {
      cima = document.createElement("div"); baixo = document.createElement("div");
      for (const m of [cima, baixo]) { m.className = "a11y-mascara"; m.setAttribute("aria-hidden", "true"); document.body.appendChild(m); }
      cima.style.top = "0"; baixo.style.bottom = "0";
    } else if (!ligado("mascara") && cima) { cima.remove(); baixo.remove(); cima = baixo = null; }
    moverGuias(window.innerHeight / 2);
  }
  document.addEventListener("mousemove", (ev) => { if (barra || cima) moverGuias(ev.clientY); }, { passive: true });
  document.addEventListener("touchmove", (ev) => { if ((barra || cima) && ev.touches[0]) moverGuias(ev.touches[0].clientY); }, { passive: true });

  // ---------------------------------------------------------------- resumo e leitura
  function rotaAtual() {
    const p = window.location.pathname;
    if (/brandbook\.html$/.test(p)) return "brandbook";
    if (/\/fase\/\d+/.test(p)) return "fase";
    for (const r of ["trilha", "batalha", "bau", "perfil", "inicio", "grimorio", "checkout", "entrar", "privacidade"]) if (p.startsWith(`/${r}`)) return r;
    return document.getElementById("regioes") ? "siteInicio" : "inicio";
  }
  const resumoDaPagina = () => document.querySelector("[data-a11y-resumo]")?.getAttribute("data-a11y-resumo") || RESUMOS[rotaAtual()] || "Resumo indisponível nesta página.";
  function conteudoDeLeitura() {
    const bruto = document.querySelector("[data-a11y-leitura]")?.getAttribute("data-a11y-leitura");
    if (bruto) { try { return JSON.parse(bruto); } catch { /* segue */ } }
    if (rotaAtual() === "grimorio") {
      const pedacos = [...document.querySelectorAll("main h2, main li")].map((e) => e.innerText.trim()).filter(Boolean);
      return { titulo: "Grimório", baloes: [], pergaminho: pedacos };
    }
    return null;
  }

  // ---------------------------------------------------------------- ícones (traço sólido)
  const I = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICONES = {
    acessibilidade: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor"><circle cx="12" cy="4.2" r="2.2"/><path d="M4.5 7.6c-.6-.2-1.2.2-1.3.8s.2 1.1.8 1.3l4.6 1.4v3.2l-1.8 6.1c-.2.6.2 1.2.8 1.4.6.2 1.2-.2 1.4-.8L11 15.6h2l2 5.4c.2.6.8 1 1.4.8.6-.2 1-.8.8-1.4l-1.8-6.1v-3.2l4.6-1.4c.6-.2.9-.7.8-1.3s-.7-1-1.3-.8c-2.4.6-4.9 1-7.5 1s-5.1-.4-7.5-1z"/></svg>',
    fechar: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    ajuda: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'),
    som: I('<path d="M4 10v4h4l5 4V6L8 10H4z"/><path d="M16.5 9a4 4 0 010 6M19 6.5a7.5 7.5 0 010 11"/>'),
    seta: I('<path d="M6 9l6 6 6-6"/>'),
    ouvir: I('<path d="M4 10v4h4l5 4V6L8 10H4z"/><path d="M16.5 9a4 4 0 010 6"/><path d="M19.5 4.5l-1.5 1.5"/>'),
    imagem: I('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>'),
    semImagem: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 3l18 18"/>'),
    fundo: I('<path d="M5 13l7-8 7 8-7 7-7-7z"/><path d="M19 17c0 1.1-.9 2-2 2s-2-.9-2-2 2-3.5 2-3.5 2 2.4 2 3.5z"/>'),
    texto: I('<path d="M5 19L11 5h2l6 14M8 14h8"/><path d="M4 22h16"/>'),
    fonteMais: I('<path d="M3 18L8 6l5 12M5 14h6"/><path d="M17 8v8M13 12h8"/>'),
    fonteMenos: I('<path d="M3 18L8 6l5 12M5 14h6"/><path d="M14 12h7"/>'),
    mono: I('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 010 18z" fill="currentColor"/>'),
    baixaSat: I('<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/><path d="M9 15h6"/>'),
    altaSat: I('<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/><path d="M12 12v6M9 15h6"/>'),
    inverter: I('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 000 18" fill="currentColor"/>'),
    resumo: I('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h5"/>'),
    dicionario: I('<path d="M4 4h10a4 4 0 014 4v12H8a4 4 0 01-4-4z"/><path d="M8 20a4 4 0 010-8h10"/>'),
    libras: I('<path d="M7 11V5.5a1.5 1.5 0 013 0V10M10 9.5V4a1.5 1.5 0 013 0v6M13 9.5V5a1.5 1.5 0 013 0v7"/><path d="M16 9.5a1.5 1.5 0 013 0V14a7 7 0 01-7 7h-1a6 6 0 01-5.2-3L4 14.5a1.5 1.5 0 012.6-1.5L8 15"/>'),
    foco: I('<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><circle cx="12" cy="12" r="3"/>'),
    links: I('<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1.2-1.2"/>'),
    letras: I('<path d="M3 16l3-9 3 9M4 13h4M14 16l3-9 3 9M15 13h4"/><path d="M3 20h18"/>'),
    linhas: I('<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 4v16M2 6l2-2 2 2M2 18l2 2 2-2"/>'),
    cursor: I('<path d="M5 3l14 7-6 2-2 6z"/>'),
    cursorEscuro: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 3l14 7-6 2-2 6z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    semSom: I('<path d="M4 10v4h4l5 4V6L8 10H4z"/><path d="M17 9l5 6M22 9l-5 6"/>'),
    pausar: I('<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>'),
    barra: I('<path d="M3 6h18M3 18h18"/><rect x="3" y="10" width="18" height="4" rx="1" fill="currentColor"/>'),
    mascara: I('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 3h18v6H3zM3 15h18v6H3z" fill="currentColor" opacity=".35"/>'),
    dislexia: I('<path d="M4 18c0-6 2-12 5-12s4 5 4 12"/><path d="M5 14h7"/><path d="M15 18V8c0-1 .8-2 2-2h1a3 3 0 010 6h-3"/>'),
    leitura: I('<path d="M3 5h7a2 2 0 012 2v13a2 2 0 00-2-2H3zM21 5h-7a2 2 0 00-2 2v13a2 2 0 012-2h7z"/>'),
  };

  const CSS_PAINEL = `
:host { all: initial; position: fixed; z-index: 2147483000; right: 0; bottom: 0; font-family: system-ui, "Segoe UI", Arial, sans-serif; color: var(--p-texto); }
*, *::before, *::after { box-sizing: border-box; }
/* Os efeitos da página (fonte para dislexia, espaçamentos, cor do texto) chegam ao host por herança;
   o painel fixa a própria tipografia para continuar legível e sem estourar os cartões. */
.flutuante, .painel, .sobreposicao, .vozes { font-family: system-ui, "Segoe UI", Arial, sans-serif; letter-spacing: normal; word-spacing: normal; line-height: 1.3; color: var(--p-texto); text-align: left; }
button, select { font: inherit; color: inherit; }
:focus-visible { outline: 3px solid var(--p-foco); outline-offset: 2px; }
[hidden] { display: none !important; }
.flutuante { position: fixed; right: 16px; bottom: var(--a11y-bottom, 16px); width: 56px; height: 56px; border-radius: 50%; border: 3px solid var(--p-borda); background: var(--p-barra); color: var(--p-barra-texto); display: grid; place-items: center; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.35); padding: 0; }
.flutuante svg { width: 32px; height: 32px; }
.painel { position: fixed; top: 0; right: 0; height: 100vh; height: 100dvh; width: min(440px, 100vw); background: var(--p-fundo); color: var(--p-texto); border-left: 4px solid var(--p-borda); display: flex; flex-direction: column; box-shadow: -8px 0 28px rgba(0,0,0,.35); }
.cabeca { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 14px 10px; border-bottom: 2px solid var(--p-borda); }
.cabeca h2 { margin: 0; flex: 1 1 auto; font: 700 22px/1.15 var(--p-titulo); }
.pilulas { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.pilula { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 4px 10px; border-radius: 999px; border: 2px solid var(--p-borda); background: var(--p-cartao); cursor: pointer; font-size: 14px; }
.pilula svg { width: 18px; height: 18px; }
.pilula[aria-checked="true"], .pilula[aria-expanded="true"] { background: var(--p-ativo-fundo); border-color: var(--p-ativo-borda); }
.chave { width: 34px; height: 20px; border-radius: 999px; background: #6B6B6B; position: relative; flex: none; }
.chave::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: left .15s; }
[aria-checked="true"] .chave { background: var(--p-botao); }
[aria-checked="true"] .chave::after { left: 16px; }
select.pilula { appearance: none; cursor: not-allowed; }
.fechar { width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--p-borda); background: var(--p-cartao); display: grid; place-items: center; cursor: pointer; padding: 0; }
.fechar svg { width: 22px; height: 22px; }
.rolagem { overflow-y: auto; padding: 12px 14px 16px; flex: 1 1 auto; overscroll-behavior: contain; }
.ajuda { background: var(--p-cartao); border: 2px solid var(--p-borda); border-radius: 12px; padding: 10px 12px; margin-bottom: 12px; font-size: 14px; line-height: 1.45; }
.ajuda p { margin: 0 0 6px; } .ajuda ul { margin: 0 0 6px; padding-left: 18px; }
.perfis-barra { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 52px; padding: 10px 14px; border-radius: 12px; border: 0; background: var(--p-barra); color: var(--p-barra-texto); cursor: pointer; font-weight: 700; font-size: 16px; text-align: left; }
.perfis-barra svg { width: 22px; height: 22px; transition: transform .15s; }
.perfis-barra[aria-expanded="true"] svg { transform: rotate(180deg); }
.perfis { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; }
.perfil { background: var(--p-cartao); border: 2px solid var(--p-borda); border-radius: 12px; padding: 8px 10px; }
.perfil.ativo { border: 3px solid var(--p-ativo-borda); background: var(--p-ativo-fundo); }
.perfil-linha { display: flex; align-items: center; gap: 8px; }
.perfil-nome { flex: 1 1 auto; font-weight: 600; font-size: 15px; }
.info { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--p-borda); background: transparent; display: grid; place-items: center; cursor: pointer; padding: 0; }
.info svg { width: 18px; height: 18px; }
.alternar { display: inline-flex; align-items: center; border: 0; background: transparent; cursor: pointer; padding: 6px 4px; min-height: 32px; }
.perfil-desc { margin: 6px 0 2px; font-size: 13px; color: var(--p-suave); }
.grade { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
.recurso { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 8px 6px; border-radius: 14px; border: 2px solid var(--p-borda); background: var(--p-cartao); color: var(--p-texto); cursor: pointer; text-align: center; font-size: 13px; line-height: 1.2; }
.recurso svg { width: 34px; height: 34px; color: var(--p-icone); flex: none; }
.recurso[aria-pressed="true"] { border: 4px solid var(--p-ativo-borda); background: var(--p-ativo-fundo); }
.pontos { display: flex; gap: 4px; min-height: 8px; }
.pontos i { width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--p-texto); }
.pontos i.cheio { background: var(--p-texto); }
.paleta { grid-column: 1 / -1; background: var(--p-cartao); border: 2px solid var(--p-ativo-borda); border-radius: 12px; padding: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.paleta p { margin: 0; width: 100%; font-weight: 600; font-size: 14px; }
.cor { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 4px 10px 4px 4px; border-radius: 999px; border: 2px solid var(--p-borda); background: var(--p-cartao); cursor: pointer; font-size: 13px; }
.cor i { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #555; }
.cor[aria-pressed="true"] { border: 3px solid var(--p-ativo-borda); background: var(--p-ativo-fundo); }
.rodape { padding: 12px 14px 14px; border-top: 2px solid var(--p-borda); }
.redefinir { width: 100%; min-height: 48px; border-radius: 12px; border: 0; background: var(--p-botao); color: var(--p-botao-texto); font-weight: 700; font-size: 16px; cursor: pointer; }
.assinatura { margin: 8px 0 0; text-align: center; font-size: 12px; color: var(--p-suave); }
.vozes { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.sobreposicao { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: grid; place-items: center; padding: 16px; }
.janela { background: var(--p-fundo); color: var(--p-texto); border: 4px solid var(--p-borda); border-radius: 14px; width: min(720px, 100%); max-height: 90vh; overflow: auto; padding: 18px 20px; }
.janela h2 { margin: 0 0 10px; font: 700 24px/1.2 var(--p-titulo); }
.janela p, .janela li { font-size: 19px; line-height: 1.6; }
.fechar-janela { margin-top: 12px; min-height: 44px; padding: 0 18px; border-radius: 10px; border: 0; background: var(--p-botao); color: var(--p-botao-texto); font-weight: 700; cursor: pointer; }
:host([data-invertido]) .flutuante, :host([data-invertido]) .painel, :host([data-invertido]) .sobreposicao { filter: invert(1) hue-rotate(180deg); }
@media (max-width: 520px) { .painel { width: 100vw; border-left: 0; } .flutuante { right: 12px; width: 52px; height: 52px; } .cabeca h2 { font-size: 20px; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }`;

  const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  class DcAcessibilidade extends HTMLElement {
    connectedCallback() {
      if (this.montado) return;
      this.montado = true;
      this.raiz = this.attachShadow({ mode: "open" });
      for (const [k, v] of Object.entries(TEMAS[PRESET] || TEMAS.marca)) this.style.setProperty(k, v);
      this.raiz.innerHTML = `<style>${CSS_PAINEL}</style>${this.modelo()}`;
      this.$ = (s) => this.raiz.querySelector(s);
      this.aberto = false;
      this.ligarEventos();
      this.salvar(false);
      this.observar();
    }

    modelo() {
      const cartoes = RECURSOS.map(([id, nome, icone, , tipo]) => {
        const paleta = tipo === "paleta"
          ? `<div class="paleta" id="paleta-${id}" hidden role="group" aria-label="${nome}"><p>${nome}</p>${(id === "fundo" ? CORES_FUNDO : CORES_TEXTO).map(([n, c]) => `<button type="button" class="cor" data-paleta="${id}" data-cor="${c}" aria-pressed="false"><i style="background:${c}"></i>${n}</button>`).join("")}<button type="button" class="cor" data-paleta="${id}" data-cor="" aria-pressed="false">Padrão</button></div>` : "";
        return `<button type="button" class="recurso" data-recurso="${id}" aria-pressed="false"${tipo === "paleta" ? ` aria-expanded="false" aria-controls="paleta-${id}"` : ""}>${ICONES[icone] || ""}<span>${nome}</span>${tipo === "nivel" ? '<span class="pontos" aria-hidden="true"></span>' : ""}</button>${paleta}`;
      }).join("");
      const perfis = PERFIS.map(([id, nome, liga]) => `
        <li class="perfil">
          <div class="perfil-linha">
            <span class="perfil-nome" id="perfil-nome-${id}">${nome}</span>
            <button type="button" class="info" data-info="${id}" aria-expanded="false" aria-controls="perfil-desc-${id}" aria-label="O que liga: ${nome}">${ICONES.ajuda}</button>
            <button type="button" class="alternar" role="switch" aria-checked="false" data-perfil="${id}" aria-labelledby="perfil-nome-${id}"><span class="chave" aria-hidden="true"></span></button>
          </div>
          <p class="perfil-desc" id="perfil-desc-${id}" hidden>Liga: ${Object.entries(liga).map(([r, v]) => (typeof v === "number" && v > 1 ? `${NOMES[r]} (${v} níveis)` : NOMES[r])).join(", ")}.</p>
        </li>`).join("");
      return `
        <button type="button" class="flutuante" aria-label="Abrir menu de acessibilidade" aria-haspopup="dialog" aria-expanded="false" aria-controls="painel">${ICONES.acessibilidade}</button>
        <div class="painel" id="painel" role="dialog" aria-modal="true" aria-labelledby="titulo-a11y" hidden>
          <div class="cabeca">
            <h2 id="titulo-a11y">Menu de Acessibilidade</h2>
            <button type="button" class="fechar" aria-label="Fechar menu de acessibilidade">${ICONES.fechar}</button>
            <div class="pilulas">
              <button type="button" class="pilula" data-acao="ajuda" aria-expanded="false" aria-controls="ajuda-a11y">${ICONES.ajuda}<span>Ajuda</span></button>
              <button type="button" class="pilula" data-acao="narrar" role="switch" aria-checked="false" aria-label="Narrar o menu">${ICONES.som}<span class="chave" aria-hidden="true"></span></button>
              <select class="pilula" disabled aria-label="Idioma: Português (BR). Outros idiomas em breve" title="Em breve"><option>Português (BR)</option></select>
            </div>
          </div>
          <div class="rolagem">
            <div class="ajuda" id="ajuda-a11y" hidden>
              <p><strong>Atalho:</strong> Alt + A abre e fecha este menu; Esc fecha.</p>
              <p>Os ajustes ficam salvos só neste navegador e valem em todas as páginas do Dungeon Café.</p>
              <ul>${RECURSOS.map(([, nome, , desc]) => `<li><strong>${nome}:</strong> ${desc}</li>`).join("")}</ul>
              <p>Os perfis ligam um conjunto de recursos; desligar um perfil desfaz só o que ele ligou.</p>
            </div>
            <button type="button" class="perfis-barra" aria-expanded="false" aria-controls="lista-perfis"><span>Selecione seu perfil de acessibilidade</span>${ICONES.seta}</button>
            <ul class="perfis" id="lista-perfis" hidden>${perfis}</ul>
            <div class="grade" role="group" aria-label="Recursos de acessibilidade">${cartoes}</div>
          </div>
          <div class="rodape">
            <button type="button" class="redefinir">Redefinir ajustes</button>
            <p class="assinatura">Acessibilidade Dungeon Café</p>
          </div>
        </div>
        <div class="sobreposicao" data-janela hidden role="dialog" aria-modal="true" aria-labelledby="titulo-janela">
          <div class="janela"><h2 id="titulo-janela"></h2><div data-corpo></div><button type="button" class="fechar-janela">Fechar</button></div>
        </div>
        <div class="vozes" aria-live="polite" data-anuncio></div>`;
    }

    ligarEventos() {
      const r = this.raiz;
      const expandir = (botao, alvo) => { const aberto = botao.getAttribute("aria-expanded") === "true"; botao.setAttribute("aria-expanded", String(!aberto)); alvo.hidden = aberto; };
      this.$(".flutuante").addEventListener("click", () => this.alternarPainel());
      this.$(".fechar").addEventListener("click", () => this.fecharPainel());
      this.$(".redefinir").addEventListener("click", () => this.redefinir());
      this.$(".perfis-barra").addEventListener("click", (e) => expandir(e.currentTarget, this.$("#lista-perfis")));
      this.$("[data-acao='ajuda']").addEventListener("click", (e) => expandir(e.currentTarget, this.$("#ajuda-a11y")));
      this.$("[data-acao='narrar']").addEventListener("click", () => { estado.narrar = !estado.narrar; this.salvar(); if (estado.narrar) falar("Narração do menu ligada"); });
      this.$(".fechar-janela").addEventListener("click", () => this.fecharJanela());
      this.$("[data-janela]").addEventListener("click", (e) => { if (e.target === e.currentTarget) this.fecharJanela(); });
      r.addEventListener("click", (e) => {
        const alvo = e.target instanceof Element ? e.target : null;
        if (!alvo) return;
        const cartao = alvo.closest("[data-recurso]");
        if (cartao) { this.acionar(cartao.dataset.recurso); return; }
        const cor = alvo.closest("[data-paleta]");
        if (cor) { estado.recursos[cor.dataset.paleta] = cor.dataset.cor || null; this.salvar(); this.anunciar(`${NOMES[cor.dataset.paleta]}: ${cor.textContent.trim()}`); return; }
        const info = alvo.closest("[data-info]");
        if (info) { const d = this.$(`#perfil-desc-${info.dataset.info}`); expandir(info, d); if (!d.hidden) this.narrar(d.textContent); return; }
        const perfil = alvo.closest("[data-perfil]");
        if (perfil) this.alternarPerfil(perfil.dataset.perfil);
      });
      const narrarAlvo = (e) => {
        if (!estado.narrar) return;
        const c = e.target instanceof Element ? e.target.closest("button, select") : null;
        if (!c || c === this.ultimoNarrado) return;
        this.ultimoNarrado = c;
        this.narrar(c.getAttribute("aria-label") || c.textContent.trim());
      };
      r.addEventListener("focusin", narrarAlvo);
      r.addEventListener("mouseover", narrarAlvo);
      r.addEventListener("keydown", (e) => this.prenderFoco(e));
      document.addEventListener("keydown", (e) => {
        if (e.altKey && !e.ctrlKey && !e.metaKey && (e.code === "KeyA" || (e.key || "").toLowerCase() === "a")) { e.preventDefault(); this.alternarPainel(); }
        else if (e.key === "Escape" && !this.$("[data-janela]").hidden) this.fecharJanela();
        else if (e.key === "Escape" && this.aberto) this.fecharPainel();
      });
      window.addEventListener("scroll", () => this.evitarSobreposicao(), { passive: true });
      window.addEventListener("resize", () => this.evitarSobreposicao());
    }

    narrar(t) { if (estado.narrar) falar(t); }
    anunciar(t) { const a = this.$("[data-anuncio]"); a.textContent = ""; setTimeout(() => { a.textContent = t; }, 30); this.narrar(t); }

    acionar(id) {
      const nome = NOMES[id];
      if (TIPO[id] === "paleta") {
        const p = this.$(`#paleta-${id}`), c = this.$(`[data-recurso="${id}"]`);
        p.hidden = !p.hidden; c.setAttribute("aria-expanded", String(!p.hidden));
        if (!p.hidden) p.querySelector("button")?.focus();
        return;
      }
      if (TIPO[id] === "nivel") {
        const max = NIVEIS[id].length - 1;
        const prox = (nivel(id) + 1) % (max + 1);
        estado.recursos[id] = prox;
        if (prox && id === "fonteMais") estado.recursos.fonteMenos = 0;
        if (prox && id === "fonteMenos") estado.recursos.fonteMais = 0;
        if (prox && id === "cursor") estado.recursos.cursorEscuro = false;
        this.anunciar(prox ? `${nome}: nível ${prox} de ${max}` : `${nome} desligado`);
      } else {
        const on = !ligado(id);
        estado.recursos[id] = on;
        if (on && id === "cursorEscuro") estado.recursos.cursor = 0;
        const cores = ["mono", "baixaSat", "altaSat"];
        if (on && cores.includes(id)) for (const o of cores) if (o !== id) estado.recursos[o] = false;
        this.anunciar(`${nome} ${on ? "ligado" : "desligado"}`);
      }
      this.salvar();
      if (id === "resumo" && ligado("resumo")) this.abrirResumo();
      if (id === "leitura" && ligado("leitura")) this.abrirLeitura();
    }

    alternarPerfil(id) {
      const [, nome, liga] = PERFIS.find((p) => p[0] === id);
      if (estado.perfis[id]) {
        // Desfaz só o que este perfil ligou: volta cada recurso ao valor de antes.
        for (const [rec, antes] of Object.entries(estado.perfis[id].antes)) estado.recursos[rec] = antes;
        delete estado.perfis[id];
        this.anunciar(`Perfil ${nome} desligado`);
        this.salvar();
        return;
      }
      const antes = {};
      for (const [rec, alvo] of Object.entries(liga)) {
        if (typeof alvo === "number") {
          if (nivel(rec) < alvo) {
            antes[rec] = nivel(rec);
            estado.recursos[rec] = alvo;
            if (rec === "fonteMais" && estado.recursos.fonteMenos) { antes.fonteMenos = estado.recursos.fonteMenos; estado.recursos.fonteMenos = 0; }
          }
        } else if (!ligado(rec)) { antes[rec] = false; estado.recursos[rec] = true; }
      }
      estado.perfis[id] = { antes };
      this.anunciar(`Perfil ${nome} ligado`);
      this.salvar();
      if ("resumo" in antes) this.abrirResumo();
      else if ("leitura" in antes && conteudoDeLeitura()) this.abrirLeitura();
    }

    redefinir() {
      estado = PADRAO();
      try { window.localStorage.removeItem(CHAVE); } catch { /* nada */ }
      calar(); esconderDica();
      this.salvar(false);
      this.anunciar("Ajustes redefinidos");
    }

    salvar(gravar = true) {
      if (gravar) gravarEstado(estado);
      aplicarPagina();
      atualizarGuias();
      this.renderizar();
    }

    renderizar() {
      for (const b of this.raiz.querySelectorAll("[data-recurso]")) {
        const id = b.dataset.recurso;
        const ativo = TIPO[id] === "nivel" ? nivel(id) > 0 : Boolean(estado.recursos[id]);
        b.setAttribute("aria-pressed", String(ativo));
        const pontos = b.querySelector(".pontos");
        if (pontos) {
          const max = NIVEIS[id].length - 1;
          pontos.innerHTML = Array.from({ length: max }, (_, i) => `<i class="${i < nivel(id) ? "cheio" : ""}"></i>`).join("");
          b.setAttribute("aria-label", `${NOMES[id]}${nivel(id) ? `, nível ${nivel(id)} de ${max}` : ""}`);
        }
      }
      for (const c of this.raiz.querySelectorAll("[data-paleta]")) c.setAttribute("aria-pressed", String((estado.recursos[c.dataset.paleta] || "") === c.dataset.cor));
      for (const s of this.raiz.querySelectorAll("[data-perfil]")) {
        const on = Boolean(estado.perfis[s.dataset.perfil]);
        s.setAttribute("aria-checked", String(on));
        s.closest(".perfil").classList.toggle("ativo", on);
      }
      this.$("[data-acao='narrar']").setAttribute("aria-checked", String(Boolean(estado.narrar)));
    }

    alternarPainel() { if (this.aberto) this.fecharPainel(); else this.abrirPainel(); }
    abrirPainel() {
      this.aberto = true;
      this.$("#painel").hidden = false;
      const f = this.$(".flutuante"); f.setAttribute("aria-expanded", "true"); f.hidden = true;
      this.$(".fechar").focus();
      this.narrar("Menu de Acessibilidade aberto");
    }
    fecharPainel() {
      this.aberto = false;
      this.$("#painel").hidden = true;
      const f = this.$(".flutuante"); f.hidden = false; f.setAttribute("aria-expanded", "false"); f.focus();
    }
    focaveis(area) {
      return [...area.querySelectorAll("button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])")].filter((el) => !el.closest("[hidden]"));
    }
    prenderFoco(e) {
      if (e.key !== "Tab") return;
      const janela = this.$("[data-janela]");
      const area = !janela.hidden ? janela : this.aberto ? this.$("#painel") : null;
      if (!area) return;
      const lista = this.focaveis(area);
      if (!lista.length) return;
      const primeiro = lista[0], ultimo = lista[lista.length - 1], ativo = this.raiz.activeElement;
      if (e.shiftKey && (ativo === primeiro || !area.contains(ativo))) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && (ativo === ultimo || !area.contains(ativo))) { e.preventDefault(); primeiro.focus(); }
    }
    abrirJanela(titulo, corpo, voz) {
      this.focoAntesJanela = this.raiz.activeElement;
      this.$("#titulo-janela").textContent = titulo;
      this.$("[data-corpo]").innerHTML = corpo;
      this.$("[data-janela]").hidden = false;
      this.$(".fechar-janela").focus();
      if (voz) this.narrar(voz);
    }
    fecharJanela() { this.$("[data-janela]").hidden = true; (this.focoAntesJanela || this.$(".flutuante"))?.focus?.(); }
    abrirResumo() { const t = resumoDaPagina(); this.abrirJanela("Resumo da página", `<p>${escapar(t)}</p>`, t); }
    abrirLeitura() {
      const c = conteudoDeLeitura();
      if (!c) { this.abrirJanela("Modo de Leitura", "<p>O modo de leitura funciona nas lições e no Grimório. Abra uma fase ou o Grimório para usá-lo.</p>"); return; }
      const baloes = (c.baloes || []).map((b) => `<p>${escapar(b)}</p>`).join("");
      const perg = (c.pergaminho || []).length ? `<h2>Pergaminho do Saber</h2><ol>${c.pergaminho.map((p) => `<li>${escapar(p)}</li>`).join("")}</ol>` : "";
      this.abrirJanela(c.titulo || "Modo de Leitura", baloes + perg);
    }

    /** Sobe o botão flutuante quando ele cobriria o balão ou o "Pular" das lições. */
    evitarSobreposicao() {
      const botao = this.$(".flutuante");
      if (!botao) return;
      const lado = window.innerWidth <= 520 ? 52 : 56, direita = window.innerWidth - (window.innerWidth <= 520 ? 12 : 16);
      let fundo = 16;
      for (const el of document.querySelectorAll(".dialogo__caixa, .dialogo__pular, [data-a11y-evitar]")) {
        const r = el.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > window.innerHeight) continue;
        const topo = window.innerHeight - fundo - lado;
        if (r.right > direita - lado && r.left < direita && r.bottom > topo && r.top < window.innerHeight - fundo) fundo = window.innerHeight - r.top + 12;
      }
      botao.style.setProperty("--a11y-bottom", `${Math.min(fundo, window.innerHeight - lado - 8)}px`);
    }

    observar() {
      let pendente = false;
      const tarefa = () => {
        pendente = false;
        if (ligado("esconderImg")) esconderImagens(true);
        if (ligado("inverter")) marcarFundos(true);
        if (ligado("descrever")) listarSemAlt();
        if (ligado("semSom")) silenciarMidias(true);
        this.evitarSobreposicao();
      };
      const agendar = () => { if (!pendente) { pendente = true; requestAnimationFrame(tarefa); } };
      new MutationObserver((lista) => { if (lista.some((m) => !(m.target instanceof Element && (m.target.matches(".a11y-dica, .a11y-barra-leitura, .a11y-mascara"))))) agendar(); })
        .observe(document.body, { childList: true, subtree: true });
      for (const m of ["pushState", "replaceState"]) {
        const original = history[m];
        history[m] = function (...args) { const r = original.apply(this, args); agendar(); return r; };
      }
      window.addEventListener("popstate", agendar);
      tarefa();
    }
  }

  customElements.define("dc-acessibilidade", DcAcessibilidade);
  window.dcAcessibilidade = {
    get estado() { return JSON.parse(JSON.stringify(estado)); },
    get semSom() { return ligado("semSom"); },
    get pausado() { return ligado("pausar"); },
  };
  const montar = () => { if (!document.querySelector("dc-acessibilidade")) document.body.appendChild(document.createElement("dc-acessibilidade")); };
  if (document.body) montar(); else document.addEventListener("DOMContentLoaded", montar);
})();
