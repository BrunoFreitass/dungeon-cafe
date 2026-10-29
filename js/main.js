/* =========================================================
   Dungeon Café — interações da página inicial
   Login é apenas uma SIMULAÇÃO de front-end (sem servidor):
   guarda só o nome de exibição; a senha nunca é armazenada.
   ========================================================= */

(() => {
  "use strict";

  const SESSION_KEY = "dungeon-cafe:session";

  /* ---------- Armazenamento seguro (pode falhar em aba anônima) ---------- */
  const storage = {
    read() {
      for (const store of ["localStorage", "sessionStorage"]) {
        try {
          const raw = window[store].getItem(SESSION_KEY);
          if (raw) return JSON.parse(raw);
        } catch { /* ignora */ }
      }
      return null;
    },
    write(session, remember) {
      try {
        window[remember ? "localStorage" : "sessionStorage"].setItem(SESSION_KEY, JSON.stringify(session));
      } catch { /* sessão só nesta visita */ }
    },
    clear() {
      for (const store of ["localStorage", "sessionStorage"]) {
        try { window[store].removeItem(SESSION_KEY); } catch { /* ignora */ }
      }
    },
  };

  /* ---------- Toast ---------- */
  const toastEl = document.getElementById("toast");
  let toastTimer;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3200);
  }

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

  /* ---------- Login ---------- */
  const form = document.getElementById("login-form");
  const welcome = document.getElementById("login-welcome");
  const welcomeName = document.getElementById("welcome-name");
  const userInput = document.getElementById("login-user");
  const passInput = document.getElementById("login-pass");
  const remember = document.getElementById("login-remember");
  const togglePass = document.getElementById("toggle-pass");
  const logoutBtn = document.getElementById("logout");

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const MATRICULA_RE = /^\d{6,14}$/;

  function setError(input, message) {
    const error = document.getElementById(`${input.id}-error`);
    error.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validate() {
    const user = userInput.value.trim();
    const pass = passInput.value;
    let ok = true;

    if (!user) {
      setError(userInput, "Informe seu e-mail ou matrícula.");
      ok = false;
    } else if (!EMAIL_RE.test(user) && !MATRICULA_RE.test(user)) {
      setError(userInput, "Use um e-mail válido ou uma matrícula só com números.");
      ok = false;
    } else {
      setError(userInput, "");
    }

    if (!pass) {
      setError(passInput, "Informe sua senha.");
      ok = false;
    } else if (pass.length < 6) {
      setError(passInput, "A senha precisa ter pelo menos 6 caracteres.");
      ok = false;
    } else {
      setError(passInput, "");
    }

    return ok;
  }

  function displayName(user) {
    if (user.includes("@")) {
      const local = user.split("@")[0].split(/[._-]/)[0];
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
    return `#${user.slice(-4)}`;
  }

  function showSession(session) {
    welcomeName.textContent = session.name;
    form.hidden = true;
    welcome.hidden = false;
  }

  function showForm() {
    welcome.hidden = true;
    form.hidden = false;
    form.reset();
    passInput.type = "password";
    togglePass.textContent = "Mostrar";
    togglePass.setAttribute("aria-pressed", "false");
    setError(userInput, "");
    setError(passInput, "");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    const label = submit.querySelector(".btn__label");
    submit.disabled = true;
    label.textContent = "Abrindo a taverna…";

    // Simula a ida ao servidor
    setTimeout(() => {
      const session = { name: displayName(userInput.value.trim()) };
      storage.write(session, remember.checked);
      submit.disabled = false;
      label.textContent = "Entrar";
      showSession(session);
      toast(`Bem-vindo à taverna, ${session.name}! ☕`);
    }, 700);
  });

  // Limpa o erro assim que o usuário corrige o campo
  [userInput, passInput].forEach((input) => {
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") setError(input, "");
    });
  });

  togglePass.addEventListener("click", () => {
    const show = passInput.type === "password";
    passInput.type = show ? "text" : "password";
    togglePass.textContent = show ? "Ocultar" : "Mostrar";
    togglePass.setAttribute("aria-pressed", String(show));
  });

  logoutBtn.addEventListener("click", () => {
    storage.clear();
    showForm();
    toast("Você saiu da taverna. Até a próxima xícara!");
    userInput.focus();
  });

  const saved = storage.read();
  if (saved?.name) showSession(saved);

  /* ---------- Links ainda não implementados ---------- */
  document.querySelectorAll("[data-soon]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      toast(`${el.dataset.soon}: em breve na taverna!`);
    });
  });

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
      terroir: "Roraima — Matas & Lavrado",
      tipo: "Café Especial Sustentável",
      especie: "100% Robusta Roraimense",
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
  const revealTargets = document.querySelectorAll(".step, .boss, .region, .plan, .section__title, .section__lead");
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
