/**
 * 游戏库：左侧分类；每条左侧小封面 + 右侧短评；Steam / 本地 assets 图。
 * 评价写本机；底部保存可同步 server/index.mjs。
 */
(function () {
  const LS_API = "gamescope-api-base";
  const LS_TOKEN = "gamescope-api-token";
  const LS_LAST = "gamescope-last-saved-at";
  const LS_LANG = "gamescope-locale";

  /** 在地址栏加 `?covers=debug` 可查看每条封面配置的 URL 链与浏览器最终使用的地址 */
  const COVERS_DEBUG =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("covers") === "debug";

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
    hok: [
      `${asset("hok-10th-icon.png")}?t=20260514`,
      asset("hok-wide.svg"),
    ],
    lol: [
      `${asset("lol-hero.png")}?t=20260516`,
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lux_0.jpg",
    ],
    /* 原神封面：仅使用仓库内 genshin-cover.png（可自行替换该文件） */
    genshin: [`${asset("genshin-cover.png")}?t=genshin-20260518`],
    /* 星穹铁道无官方 Steam 页；勿用 2357570（实为守望先锋 2）作 header 回退 */
    starRail: [`${asset("honkai-star-rail.jpg")}?t=20260517`],
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

  function displayTitle(g) {
    const T = g.title;
    if (typeof T === "string") return T;
    if (T && typeof T === "object") {
      /* 界面可切英文，游戏名保持中文 */
      return T.zh || T.en || "";
    }
    return "";
  }

  /** 评价存储 slug 始终用英文名，避免改名后丢存档 */
  function slugSeed(g) {
    const T = g.title;
    if (typeof T === "string") return T;
    if (T && typeof T === "object") return T.en || T.zh || "";
    return "";
  }

  const categories = [
    {
      id: "moba",
      label: { zh: "MOBA", en: "MOBA" },
      games: [
        { title: { zh: "王者荣耀", en: "Honor of Kings" }, cover: WEB_HERO.hok },
        {
          title: { zh: "英雄联盟", en: "League of Legends" },
          cover: WEB_HERO.lol,
        },
        { title: { zh: "Dota 2", en: "Dota 2" }, steam: 570 },
        { title: { zh: "神之浩劫", en: "SMITE" }, steam: 386360 },
        { title: { zh: "战争仪式", en: "Battlerite" }, steam: 555850 },
      ],
    },
    {
      id: "anime",
      label: { zh: "二次元", en: "Anime" },
      games: [
        {
          title: { zh: "原神", en: "Genshin Impact" },
          cover: WEB_HERO.genshin,
        },
        {
          title: { zh: "崩坏：星穹铁道", en: "Honkai: Star Rail" },
          cover: WEB_HERO.starRail,
        },
        { title: { zh: "女神异闻录5", en: "Persona 5" }, steam: 1687950 },
        { title: { zh: "尼尔：自动人形", en: "NieR:Automata" }, steam: 524220 },
        { title: { zh: "破晓传说", en: "Tales of Arise" }, steam: 740130 },
      ],
    },
    {
      id: "coop",
      label: { zh: "协力", en: "Co-op" },
      games: [
        { title: { zh: "糖豆人", en: "Fall Guys" }, steam: 1097150 },
        { title: { zh: "内容警告", en: "Content Warning" }, steam: 2881650 },
        { title: { zh: "我们永远在这里", en: "We Were Here Forever" }, steam: 1341290 },
        { title: { zh: "双人成行", en: "It Takes Two" }, steam: 1426210 },
        { title: { zh: "代号：探戈", en: "Operation: Tango" }, steam: 1335790 },
      ],
    },
    {
      id: "story",
      label: { zh: "叙事解谜", en: "Story & puzzle" },
      games: [
        { title: { zh: "巴别塔圣歌", en: "Chants of Sennaar" }, steam: 1931770 },
        { title: { zh: "接线疑云", en: "The Operator" }, steam: 1771980 },
        { title: { zh: "全网公敌", en: "Cyber Manhunt" }, steam: 1330330 },
        { title: { zh: "山河旅探", en: "Murders on the Yangtze River" }, steam: 1746030 },
        { title: { zh: "三伏", en: "Sanfu" }, steam: 1880330 },
        { title: { zh: "烟火", en: "Firework" }, steam: 1288310 },
        { title: { zh: "三相奇谈", en: "Trinity" }, steam: 3084280 },
        { title: { zh: "文字游戏", en: "Word Game" }, steam: 1396220 },
        { title: { zh: "喜丧", en: "Laughing to Die" }, steam: 2182400 },
        { title: { zh: "疑案追声", en: "Unheard" }, steam: 942970 },
        { title: { zh: "行将消逝", en: "The Almost Gone" }, steam: 1115780 },
        { title: { zh: "画中世界", en: "Gorogoa" }, steam: 557600 },
        { title: { zh: "黑客网络", en: "Hacknet" }, steam: 365450 },
        { title: { zh: "小小梦魇", en: "Little Nightmares" }, steam: 252550 },
        { title: { zh: "精灵与萤火意志", en: "Ori and the Will of the Wisps" }, steam: 1057090 },
        { title: { zh: "锈湖三部曲", en: "Rusty Lake Trilogy" }, steam: 435400 },
        { title: { zh: "捣蛋鹅", en: "Untitled Goose Game" }, steam: 1016600 },
      ],
    },
    {
      id: "aaa",
      label: { zh: "3A", en: "AAA" },
      games: [
        { title: { zh: "白之旅", en: "Blanc" }, steam: 2537370 },
        { title: { zh: "内在昔日", en: "The Past Within" }, steam: 1519060 },
        { title: { zh: "逃出生天", en: "A Way Out" }, steam: 1222700 },
        { title: { zh: "死亡搁浅", en: "Death Stranding" }, steam: 1190460 },
        { title: { zh: "艾尔登法环", en: "Elden Ring" }, steam: 1245620 },
      ],
    },
    {
      id: "sim",
      label: { zh: "生存模拟", en: "Survival sim" },
      games: [
        { title: { zh: "星露谷物语", en: "Stardew Valley" }, steam: 413150 },
        { title: { zh: "我的世界", en: "Minecraft" }, cover: WEB_HERO.minecraft },
        { title: { zh: "灵魂旅人", en: "Spiritfarer" }, steam: 972660 },
        { title: { zh: "咩咩启示录", en: "Cult of the Lamb" }, steam: 1123580 },
        { title: { zh: "饥荒", en: "Don't Starve" }, steam: 219740 },
        { title: { zh: "潜水员戴夫", en: "Dave the Diver" }, steam: 1868140 },
        { title: { zh: "中国式家长", en: "Chinese Parents" }, steam: 570940 },
        { title: { zh: "异星探险家", en: "Astroneer" }, steam: 361420 },
      ],
    },
    {
      id: "fps",
      label: { zh: "FPS", en: "FPS" },
      games: [
        { title: { zh: "绝地求生", en: "PUBG: BATTLEGROUNDS" }, steam: 578080 },
        { title: { zh: "反恐精英2", en: "Counter-Strike 2" }, steam: 730 },
        { title: { zh: "Apex英雄", en: "Apex Legends" }, steam: 1172470 },
        { title: { zh: "毁灭战士：永恒", en: "DOOM Eternal" }, steam: 782330 },
        { title: { zh: "无主之地3", en: "Borderlands 3" }, steam: 397540 },
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
        img.src = fallbackHero(displayTitle(g));
      }
    };
    img.addEventListener("error", onErr);
    img.addEventListener("load", () => img.removeEventListener("error", onErr), {
      once: true,
    });
    img.src = urls.length ? urls[0] : fallbackHero(displayTitle(g));
  }

  function mountCoverDebugUI() {
    if (!COVERS_DEBUG) return;
    let el = document.getElementById("cover-debug");
    if (!el) {
      el = document.createElement("aside");
      el.id = "cover-debug";
      el.className = "cover-debug";
      el.setAttribute("aria-label", "封面 URL 调试");
      document.body.appendChild(el);
    }
  }

  function refreshCoverDebug() {
    if (!COVERS_DEBUG) return;
    mountCoverDebugUI();
    const el = document.getElementById("cover-debug");
    const list = document.getElementById("library-root");
    const cat = categories.find((c) => c.id === activeId) || categories[0];
    if (!el || !list) return;

    const rows = [...list.querySelectorAll(".row--compact")].map((row) => {
      const img = row.querySelector("img");
      const title = row.querySelector(".row__title")?.textContent?.trim() || "";
      const chainRaw = img?.getAttribute("data-hero-chain") || "";
      const chain = chainRaw ? chainRaw.split("|||") : [];
      const finalSrc = img?.currentSrc || img?.src || "";
      const decoded = !!(img && img.complete && img.naturalWidth > 0);
      return {
        title,
        chain,
        finalSrc,
        decoded,
        w: img?.naturalWidth || 0,
        h: img?.naturalHeight || 0,
      };
    });

    const chainBlock = (chain) =>
      chain.length
        ? `<ol class="cover-debug__chain">${chain
            .map((u) => `<li><code title="${escHtml(u)}">${escHtml(u.length > 160 ? `${u.slice(0, 158)}…` : u)}</code></li>`)
            .join("")}</ol>`
        : `<p class="cover-debug__empty">（无链，仅用内置占位）</p>`;

    el.innerHTML = `
      <div class="cover-debug__head">
        <strong>covers=debug</strong>
        <span class="cover-debug__cat">${escHtml(categoryLabel(cat))}</span>
      </div>
      <p class="cover-debug__meta"><code>${escHtml(location.href)}</code></p>
      <table class="cover-debug__table">
        <thead>
          <tr>
            <th>游戏</th>
            <th>代码里配置的 URL 链（按顺序回退）</th>
            <th>浏览器最终地址（img.currentSrc）</th>
            <th>像素</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `<tr>
            <td>${escHtml(r.title)}</td>
            <td class="cover-debug__cell--chain">${chainBlock(r.chain)}</td>
            <td class="cover-debug__cell--final"><code title="${escHtml(r.finalSrc)}">${escHtml(
                r.finalSrc.length > 120 ? `${r.finalSrc.slice(0, 118)}…` : r.finalSrc
              )}</code></td>
            <td>${r.decoded ? `${r.w}×${r.h}` : "…"}</td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  const storageKey = (slug) => `gamescope-review::${slug}`;

  let activeId = categories[0].id;

  function forEachGame(fn) {
    categories.forEach((cat) => {
      cat.games.forEach((g, i) => fn(cat, g, i));
    });
  }

  function gameSlug(cat, game, index) {
    const base = slugify(slugSeed(game));
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

      const shown = displayTitle(g);
      row.innerHTML = `
        <div class="row__thumb">
          <img alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
        </div>
        <div class="row__body">
          <div class="row__title">${escHtml(shown)}</div>
          <textarea class="row__ta" data-slug="${slug}" spellcheck="false" rows="2" aria-label="${reviewAria(shown)}"></textarea>
        </div>
      `;

      const img = row.querySelector("img");
      img.alt = shown;
      const urls = heroUrlList(g);
      if (COVERS_DEBUG) {
        img.loading = "eager";
        img.setAttribute("data-hero-chain", urls.join("|||"));
      }
      bindHeroImage(img, g);
      bindReview(row.querySelector(".row__ta"), slug);
      root.appendChild(row);
    });

    if (COVERS_DEBUG) {
      mountCoverDebugUI();
      refreshCoverDebug();
      requestAnimationFrame(() => refreshCoverDebug());
      [400, 2000].forEach((ms) => setTimeout(refreshCoverDebug, ms));
    }
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
