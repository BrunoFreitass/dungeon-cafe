/* =========================================================
   Dungeon Café — interações da página inicial
   ========================================================= */

(() => {
  "use strict";

  /* ---------- Menu mobile ---------- */
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("menu");

  function setMenu(open) {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.querySelector(".sr-only").textContent = open ? "Fechar menu" : "Abrir menu";
    nav.classList.toggle("is-open", open);
  }
  navToggle.addEventListener("click", () => setMenu(navToggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- Abas dos mentores (padrão ARIA tabs) ---------- */
  const tabs = Array.from(document.querySelectorAll('.roster [role="tab"]'));

  function selectTab(tab) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
    });
    tab.focus({ preventScroll: true });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (e) => {
      const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      selectTab(tabs[(keys[e.key] + tabs.length) % tabs.length]);
    });
  });

  /* ---------- "Conhecer o mentor" nas regiões: ativa a aba; o href="#mentores" faz a rolagem ---------- */
  document.querySelectorAll("[data-goto-hero]").forEach((link) => {
    link.addEventListener("click", () => {
      const tab = tabs.find((t) => t.dataset.hero === link.dataset.gotoHero);
      if (tab) selectTab(tab);
    });
  });

  /* ---------- Detalhe do café (<dialog>) ---------- */
  // Dados copiados das embalagens finais; a chave é o data-hero do card/mentor.
  const COFFEES = {
    simone: {
      regiao: "Norte",
      terroir: "Amazônia — Robustas Amazônicos",
      tipo: "Café Especial Sustentável",
      especie: "100% Canéfora · Robustas Amazônicos",
      notas: "Corpo potente e aveludado, notas de cacau selvagem, castanhas e toque herbal da Amazônia.",
      mentor: "Profª. Simone",
      classe: "Guerreira",
    },
    vagner: {
      regiao: "Centro-Oeste",
      terroir: "Planalto Central — Cerrado",
      tipo: "Café Especial Artesanal",
      especie: "100% Arábica · Catuaí Amarelo",
      notas: "Corpo aveludado e equilibrado, notas marcantes de caramelo, chocolate ao leite e melaço de cana.",
      mentor: "Prof. Vagner",
      classe: "Mago",
    },
    ellem: {
      regiao: "Sudeste",
      terroir: "Minas Gerais — Alta Mogiana",
      tipo: "Café Especial Gourmet",
      especie: "100% Arábica · Lote Heavy Metal",
      notas: "Corpo denso e potente, notas intensas de chocolate amargo 80%, caramelo tostado e especiarias.",
      mentor: "Profª. Ellem",
      classe: "Bárbara",
    },
    vitor: {
      regiao: "Nordeste",
      terroir: "Chapada Diamantina, Bahia",
      tipo: "Café Especial Microlote",
      especie: "100% Arábica · Catuaí Vermelho",
      notas: "Notas vibrantes de frutas vermelhas, mirtilo, rapadura e finalização doce e melada.",
      mentor: "Prof. Vitor",
      classe: "Bardo",
    },
    viviane: {
      regiao: "Sul",
      terroir: "Norte Pioneiro do Paraná",
      tipo: "Café Especial Seleção Rara",
      especie: "100% Arábica · Mundo Novo Tradicional",
      notas: "Corpo denso e aveludado, notas de nozes tostadas, chocolate meio amargo e doçura acolhedora.",
      mentor: "Profª. Viviane",
      classe: "Curandeira",
    },
  };
  const COFFEE_COMMON = { torra: "Torrado e moído", peso: "250 g" };

  const dialog = document.getElementById("coffee");
  const packImg = document.getElementById("coffee-pack");
  const spriteImg = document.getElementById("coffee-sprite");
  const sheet = document.getElementById("coffee-sheet");
  let opener = null;     // botão "Ver café" que abriu a janela (recebe o foco de volta)
  let current = null;    // data-hero do café aberto
  let moveFocus = true;  // false quando a ação leva o foco para outra seção

  function openCoffee(hero) {
    const c = COFFEES[hero];
    const card = document.querySelector(`.region[data-hero="${hero}"]`);
    if (!c || !card) return;
    const isFem = c.mentor.startsWith("Profª");
    const nome = c.mentor.replace(/^Prof(ª)?\.\s*/, "");

    current = hero;
    opener = card.querySelector("[data-coffee]");
    dialog.dataset.hero = hero;

    packImg.src = card.querySelector(".region__art img").getAttribute("src");
    packImg.alt = `Embalagem de 250 g do ${c.tipo} da Região ${c.regiao}, Linha Mestres do Brasil, com ${isFem ? "a mentora" : "o mentor"} ${nome}`;
    spriteImg.src = `assets/img/heroi-${hero}.png`;
    spriteImg.alt = `${c.mentor} em pixel art, ${c.classe.toLowerCase()} da Região ${c.regiao}`;
    document.getElementById("coffee-title").textContent = `Café da Região ${c.regiao}`;
    document.getElementById("coffee-mentor").textContent = `${isFem ? "Mentora" : "Mentor"}: ${nome} · ${c.classe}`;

    const rows = [
      ["Região", c.regiao],
      ["Terroir", c.terroir],
      ["Tipo", c.tipo],
      ["Espécie/variedade", c.especie],
      ["Notas sensoriais", c.notas],
      ["Torra e moagem", COFFEE_COMMON.torra],
      ["Peso", COFFEE_COMMON.peso],
      [isFem ? "Mentora e classe" : "Mentor e classe", `${c.mentor} · ${c.classe}`],
    ];
    sheet.replaceChildren(...rows.flatMap(([term, value]) => {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = term;
      dd.textContent = value;
      return [dt, dd];
    }));

    moveFocus = true;
    dialog.showModal();
    dialog.scrollTop = 0;
  }

  document.querySelector(".regions").addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-coffee], .region__art img, .region__name");
    if (trigger) openCoffee(trigger.closest(".region").dataset.hero);
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) { dialog.close(); return; }  // clique no ::backdrop
    if (e.target.closest(".coffee__close")) { dialog.close(); return; }

    const action = e.target.closest("[data-coffee-action]")?.dataset.coffeeAction;
    if (!action) return;
    moveFocus = false;
    dialog.close();
    if (action === "mentor") {
      const tab = tabs.find((t) => t.dataset.hero === current);
      document.getElementById("mentores").scrollIntoView();
      if (tab) selectTab(tab);
    } else {
      document.getElementById("planos").scrollIntoView();
      document.querySelector(".plan--single .btn")?.focus({ preventScroll: true });
    }
  });

  dialog.addEventListener("close", () => {
    if (moveFocus) opener?.focus();
  });

  /* ---------- Revelar seções ao rolar ---------- */
  const revealTargets = document.querySelectorAll(".step, .boss, .region, .plan, .mentors-cta, .section__title, .section__lead");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px" });

    revealTargets.forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
  }
})();
