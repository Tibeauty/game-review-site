/**
 * 游戏库：左侧分类；每条左侧小封面 + 右侧短评；Steam / 本地 assets 图。
 * 评价写本机；底部保存可同步 server/index.mjs。
 */
(function () {
  const LS_API = "gamescope-api-base";
  const LS_TOKEN = "gamescope-api-token";
  const LS_LAST = "gamescope-last-saved-at";
  const LS_LANG = "gamescope-locale";

  /** @type {"zh" | "en"} */
  let locale = "zh";

  const STR = {
    zh: {
      pageTitle: "GameScope",
      railAria: "分类",
      catNavAria: "游戏分类",
      langBtn: "English",
      langAria: "切换到英语",
      dockApi: "API",
      dockToken: "TOKEN",
      phApi: "http://127.0.0.1:3456",
      phToken: "可选",
      saveBtn: "保存评价",
      pullFail: "远程读取失败，已使用本机数据",
      saving: "正在保存…",
      savedLocal: "已保存到本机",
      savedBoth: "已保存到服务器与本机",
      savedLocalErr: "本机已保存 · 服务器失败",
      networkErr: "网络错误",
      lastSaved: "上次保存：",
    },
    en: {
      pageTitle: "GameScope",
      railAria: "Categories",
      catNavAria: "Game categories",
      langBtn: "中文",
      langAria: "Switch to Chinese",
      dockApi: "API",
      dockToken: "TOKEN",
      phApi: "http://127.0.0.1:3456",
      phToken: "Optional",
      saveBtn: "Save reviews",
      pullFail: "Remote fetch failed; using local data",
      saving: "Saving…",
      savedLocal: "Saved locally",
      savedBoth: "Saved to server and locally",
      savedLocalErr: "Saved locally · server error",
      networkErr: "network error",
      lastSaved: "Last saved: ",
    },
  };

  function t(key) {
    const pack = STR[locale] || STR.zh;
    return pack[key] != null ? pack[key] : STR.zh[key];
  }

  function loadLocale() {
    const raw = localStorage.getItem(LS_LANG);
    locale = raw === "en" ? "en" : "zh";
  }

  function categoryLabel(cat) {
    const L = cat.label;
    if (typeof L === "string") return L;
    if (L && typeof L === "object") {
      return L[locale] || L.zh || L.en || cat.id;
    }
    return cat.id;
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function reviewAria(title) {
    const safe = title.replace(/"/g, "&quot;");
    return locale === "zh" ? `${safe} 短评` : `Review: ${safe}`;
  }

  const STEAM = (id) =>
    `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`;

  /** 与 index.html 同级的静态图（GitHub Pages / 外链 403 时仍可用） */
  function asset(file) {
    return new URL(`assets/covers/${file}`, window.location.href).href;
  }

  /**
   * 非 Steam：优先使用仓库内 assets/covers（可自己替换文件）。
   * 数组为回退顺序；末项仍可为外网直链。
   */
  const WEB_HERO = {
    hok: [asset("hok-wide.svg")],
    lol: [
      asset("lol.jpg"),
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lux_0.jpg",
    ],
    genshin: [asset("genshin.jpg")],
    minecraft: [asset("minecraft.png")],
  };

  const fallbackHero = (title) => {
    const safe = title.replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="540" viewBox="0 0 1920 540"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0d0221"/><stop offset="100%" stop-color="#12061f"/></linearGradient></defs><rect width="1920" height="540" fill="url(#g)"/><rect x="24" y="24" width="1872" height="492" fill="none" stroke="#00f3ff" stroke-width="3" opacity="0.45"/><text x="960" y="290" fill="#ff2a6d" font-family="system-ui,sans-serif" font-size="42" font-weight="800" text-anchor="middle">${safe}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  const slugify = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const categories = [
    {
      id: "moba",
      label: { zh: "MOBA", en: "MOBA" },
      games: [
        { title: "Honor of Kings", cover: WEB_HERO.hok },
        { title: "League of Legends", cover: WEB_HERO.lol },
        { title: "Dota 2", steam: 570 },
        { title: "SMITE", steam: 386360 },
        { title: "Battlerite", steam: 555850 },
      ],
    },
    {
      id: "anime",
      label: { zh: "二次元", en: "Anime" },
      games: [
        { title: "Genshin Impact", cover: WEB_HERO.genshin },
        { title: "Honkai: Star Rail", steam: 2357570 },
        { title: "Persona 5", steam: 1687950 },
        { title: "NieR:Automata", steam: 524220 },
        { title: "Tales of Arise", steam: 740130 },
      ],
    },
    {
      id: "coop",
      label: { zh: "协力", en: "Co-op" },
      games: [
        { title: "Fall Guys", steam: 1097150 },
        { title: "Content Warning", steam: 2881650 },
        { title: "We Were Here Forever", steam: 1341290 },
        { title: "It Takes Two", steam: 1426210 },
        { title: "Operation: Tango", steam: 1335790 },
      ],
    },
    {
      id: "story",
      label: { zh: "叙事解谜", en: "Story & puzzle" },
      games: [
        { title: "Chants of Sennaar", steam: 1931770 },
        { title: "The Operator", steam: 1771980 },
        { title: "Cyber Manhunt", steam: 1330330 },
        { title: "Murders on the Yangtze River", steam: 1746030 },
        { title: "Sanfu", steam: 1880330 },
        { title: "Firework", steam: 1288310 },
        { title: "Trinity", steam: 3084280 },
        { title: "Word Game", steam: 1396220 },
        { title: "Laughing to Die", steam: 2182400 },
        { title: "Unheard", steam: 942970 },
        { title: "The Almost Gone", steam: 1115780 },
        { title: "Gorogoa", steam: 557600 },
        { title: "Hacknet", steam: 365450 },
        { title: "Little Nightmares", steam: 252550 },
        { title: "Ori and the Will of the Wisps", steam: 1057090 },
        { title: "Rusty Lake Trilogy", steam: 435400 },
        { title: "Untitled Goose Game", steam: 1016600 },
      ],
    },
    {
      id: "aaa",
      label: { zh: "3A", en: "AAA" },
      games: [
        { title: "Blanc", steam: 2537370 },
        { title: "The Past Within", steam: 1519060 },
        { title: "A Way Out", steam: 1222700 },
        { title: "Death Stranding", steam: 1190460 },
        { title: "Elden Ring", steam: 1245620 },
      ],
    },
    {
      id: "sim",
      label: { zh: "生存模拟", en: "Survival sim" },
      games: [
        { title: "Stardew Valley", steam: 413150 },
        { title: "Minecraft", cover: WEB_HERO.minecraft },
        { title: "Spiritfarer", steam: 972660 },
        { title: "Cult of the Lamb", steam: 1123580 },
        { title: "Don't Starve", steam: 219740 },
        { title: "Dave the Diver", steam: 1868140 },
        { title: "Chinese Parents", steam: 570940 },
        { title: "Astroneer", steam: 361420 },
      ],
    },
    {
      id: "fps",
      label: { zh: "FPS", en: "FPS" },
      games: [
        { title: "PUBG: BATTLEGROUNDS", steam: 578080 },
        { title: "Counter-Strike 2", steam: 730 },
        { title: "Apex Legends", steam: 1172470 },
        { title: "DOOM Eternal", steam: 782330 },
        { title: "Borderlands 3", steam: 397540 },
      ],
    },
  ];

  function heroUrlList(g) {
    if (g.steam != null) return [STEAM(g.steam)];
    if (Array.isArray(g.cover)) return g.cover.filter(Boolean);
    if (typeof g.cover === "string" && g.cover) return [g.cover];
    return [];
  }

  function bindHeroImage(img, g) {
    const urls = heroUrlList(g);
    let attempt = 0;
    const onErr = () => {
      attempt += 1;
      if (attempt < urls.length) {
        img.src = urls[attempt];
      } else {
        img.removeEventListener("error", onErr);
        img.src = fallbackHero(g.title);
      }
    };
    img.addEventListener("error", onErr);
    img.addEventListener("load", () => img.removeEventListener("error", onErr), {
      once: true,
    });
    img.src = urls.length ? urls[0] : fallbackHero(g.title);
  }

  const storageKey = (slug) => `gamescope-review::${slug}`;

  let activeId = categories[0].id;

  function forEachGame(fn) {
    categories.forEach((cat) => {
      cat.games.forEach((g, i) => fn(cat, g, i));
    });
  }

  function gameSlug(cat, game, index) {
    const base = slugify(game.title);
    return `${cat.id}-${index}-${base || "game"}`;
  }

  function getApiBase() {
    const el = document.getElementById("dock-api");
    const fromInput = el && el.value.trim();
    const fromWin =
      typeof window !== "undefined" &&
      window.GAMEREVIEW_API &&
      String(window.GAMEREVIEW_API).trim();
    const fromLs = localStorage.getItem(LS_API) || "";
    return (fromInput || fromWin || fromLs).replace(/\/$/, "");
  }

  function getToken() {
    const el = document.getElementById("dock-token");
    if (el && el.value.trim()) return el.value.trim();
    return localStorage.getItem(LS_TOKEN) || "";
  }

  function authHeaders() {
    const t = getToken();
    if (!t) return {};
    return { Authorization: `Bearer ${t}` };
  }

  function setStatus(text, tone) {
    const el = document.getElementById("dock-status");
    if (!el) return;
    el.textContent = text;
    el.dataset.tone = tone || "";
  }

  function flushTextareasToStorage() {
    document.querySelectorAll("textarea.row__ta[data-slug]").forEach((ta) => {
      const slug = ta.getAttribute("data-slug");
      if (slug) localStorage.setItem(storageKey(slug), ta.value);
    });
  }

  function readAllReviewsMap() {
    const map = {};
    forEachGame((cat, g, i) => {
      const slug = gameSlug(cat, g, i);
      map[slug] = localStorage.getItem(storageKey(slug)) || "";
    });
    return map;
  }

  function applyRemoteReviews(reviews) {
    if (!reviews || typeof reviews !== "object") return;
    Object.entries(reviews).forEach(([slug, text]) => {
      if (typeof slug === "string" && typeof text === "string") {
        localStorage.setItem(storageKey(slug), text);
      }
    });
  }

  async function pullRemote() {
    const base = getApiBase();
    if (!base) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const r = await fetch(`${base}/reviews`, {
        method: "GET",
        headers: { ...authHeaders() },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (data.reviews) applyRemoteReviews(data.reviews);
    } catch {
      setStatus(t("pullFail"), "warn");
    }
  }

  async function pushRemote(map) {
    const base = getApiBase();
    if (!base) return { ok: true, localOnly: true };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`${base}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...authHeaders(),
      },
      body: JSON.stringify({ reviews: map }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  function bindReview(ta, slug) {
    const k = storageKey(slug);
    const saved = localStorage.getItem(k);
    if (saved) ta.value = saved;
    ta.addEventListener("input", () => {
      localStorage.setItem(k, ta.value);
    });
  }

  function renderList() {
    const root = document.getElementById("library-root");
    if (!root) return;
    const cat = categories.find((c) => c.id === activeId) || categories[0];
    root.innerHTML = "";
    root.style.setProperty("--games", String(cat.games.length));
    cat.games.forEach((g, i) => {
      const slug = gameSlug(cat, g, i);
      const row = document.createElement("article");
      row.className = "row row--compact";

      row.innerHTML = `
        <div class="row__thumb">
          <img alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
        </div>
        <div class="row__body">
          <div class="row__title">${g.title}</div>
          <textarea class="row__ta" data-slug="${slug}" spellcheck="false" rows="2" aria-label="${reviewAria(g.title)}"></textarea>
        </div>
      `;

      const img = row.querySelector("img");
      bindHeroImage(img, g);
      bindReview(row.querySelector(".row__ta"), slug);
      root.appendChild(row);
    });
  }

  function renderSidebar() {
    const rail = document.getElementById("sidebar");
    if (!rail) return;
    rail.innerHTML = categories
      .map(
        (c) =>
          `<button type="button" class="rail__btn${c.id === activeId ? " is-active" : ""}" data-id="${c.id}">${escHtml(categoryLabel(c))}</button>`
      )
      .join("");

    rail.querySelectorAll(".rail__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        flushTextareasToStorage();
        activeId = btn.getAttribute("data-id");
        rail.querySelectorAll(".rail__btn").forEach((b) => {
          b.classList.toggle("is-active", b.getAttribute("data-id") === activeId);
        });
        renderList();
      });
    });
  }

  function persistDockPrefs() {
    const apiEl = document.getElementById("dock-api");
    const tokEl = document.getElementById("dock-token");
    if (apiEl) {
      const v = apiEl.value.trim();
      if (v) localStorage.setItem(LS_API, v);
      else localStorage.removeItem(LS_API);
    }
    if (tokEl) {
      const t = tokEl.value.trim();
      if (t) localStorage.setItem(LS_TOKEN, t);
      else localStorage.removeItem(LS_TOKEN);
    }
  }

  function loadDockPrefs() {
    const apiEl = document.getElementById("dock-api");
    const tokEl = document.getElementById("dock-token");
    const savedApi = localStorage.getItem(LS_API) || "";
    const savedTok = localStorage.getItem(LS_TOKEN) || "";
    const winApi =
      typeof window !== "undefined" && window.GAMEREVIEW_API
        ? String(window.GAMEREVIEW_API).trim()
        : "";
    if (apiEl) apiEl.value = savedApi || winApi;
    if (tokEl) tokEl.value = savedTok;
  }

  function formatTime(ts) {
    try {
      return new Date(ts).toLocaleString(locale === "zh" ? "zh-CN" : "en-US");
    } catch {
      return "";
    }
  }

  async function onSaveClick() {
    persistDockPrefs();
    setStatus(t("saving"), "busy");
    flushTextareasToStorage();
    const map = readAllReviewsMap();
    const now = Date.now();
    localStorage.setItem(LS_LAST, String(now));

    try {
      const res = await pushRemote(map);
      if (res && res.localOnly) {
        setStatus(`${t("savedLocal")} · ${formatTime(now)}`, "ok");
      } else {
        setStatus(`${t("savedBoth")} · ${formatTime(now)}`, "ok");
      }
    } catch (e) {
      setStatus(
        `${t("savedLocalErr")}（${e && e.message ? e.message : t("networkErr")}）`,
        "err"
      );
    }
  }

  function initLangToggle() {
    const btn = document.getElementById("lang-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      locale = locale === "zh" ? "en" : "zh";
      localStorage.setItem(LS_LANG, locale);
      applyChrome();
    });
  }

  function applyChrome() {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = t("pageTitle");

    const rail = document.getElementById("rail-root");
    if (rail) rail.setAttribute("aria-label", t("railAria"));

    const nav = document.getElementById("sidebar");
    if (nav) nav.setAttribute("aria-label", t("catNavAria"));

    const langBtn = document.getElementById("lang-toggle");
    if (langBtn) {
      langBtn.textContent = t("langBtn");
      langBtn.setAttribute("aria-label", t("langAria"));
    }

    const apiKey = document.getElementById("dock-label-api");
    if (apiKey) apiKey.textContent = t("dockApi");

    const tokKey = document.getElementById("dock-label-token");
    if (tokKey) tokKey.textContent = t("dockToken");

    const apiInput = document.getElementById("dock-api");
    if (apiInput) apiInput.placeholder = t("phApi");

    const tokInput = document.getElementById("dock-token");
    if (tokInput) tokInput.placeholder = t("phToken");

    const saveBtn = document.getElementById("dock-save");
    if (saveBtn) saveBtn.textContent = t("saveBtn");

    renderSidebar();
    renderList();
  }

  function initDock() {
    loadDockPrefs();
    const btn = document.getElementById("dock-save");
    if (btn) btn.addEventListener("click", () => onSaveClick());

    ["dock-api", "dock-token"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", persistDockPrefs);
    });
  }

  async function boot() {
    loadLocale();
    initDock();
    initLangToggle();
    applyChrome();
    await pullRemote();
    const st = document.getElementById("dock-status");
    const last = localStorage.getItem(LS_LAST);
    if (last && st && !st.textContent.trim()) {
      setStatus(`${t("lastSaved")}${formatTime(Number(last))}`, "");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
