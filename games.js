/**
 * 游戏库：左侧分类；Steam 用商店 header 比例；非 Steam 用大图标。
 * 评价：输入实时写入本机；底部「保存评价」同步到可选后端（见 server/index.mjs）。
 */
(function () {
  const LS_API = "gamescope-api-base";
  const LS_TOKEN = "gamescope-api-token";
  const LS_LAST = "gamescope-last-saved-at";

  const STEAM = (id) =>
    `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`;

  const FAV = (origin) =>
    `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
      origin
    )}&size=256`;

  const ICON = {
    hok: FAV("https://pvp.qq.com/"),
    lol: FAV("https://www.leagueoflegends.com/"),
    genshin: FAV("https://genshin.hoyoverse.com/"),
    minecraft: FAV("https://www.minecraft.net/"),
  };

  const fallbackIcon = (title) => {
    const safe = title.replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect fill="#0d0221" width="256" height="256"/><rect x="12" y="12" width="232" height="232" fill="none" stroke="#00f3ff" stroke-width="3" opacity="0.55"/><text x="128" y="140" fill="#ff2a6d" font-family="system-ui,sans-serif" font-size="18" font-weight="800" text-anchor="middle">${safe}</text></svg>`;
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
      label: "MOBA",
      games: [
        { title: "Honor of Kings", icon: ICON.hok },
        { title: "League of Legends", icon: ICON.lol },
        { title: "Dota 2", steam: 570 },
        { title: "SMITE", steam: 386360 },
        { title: "Battlerite", steam: 555850 },
      ],
    },
    {
      id: "anime",
      label: "二次元",
      games: [
        { title: "Genshin Impact", icon: ICON.genshin },
        { title: "Honkai: Star Rail", steam: 2357570 },
        { title: "Persona 5", steam: 1687950 },
        { title: "NieR:Automata", steam: 524220 },
        { title: "Tales of Arise", steam: 740130 },
      ],
    },
    {
      id: "coop",
      label: "协力",
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
      label: "叙事解谜",
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
      label: "3A",
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
      label: "生存模拟",
      games: [
        { title: "Stardew Valley", steam: 413150 },
        { title: "Minecraft", icon: ICON.minecraft },
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
      label: "FPS",
      games: [
        { title: "PUBG: BATTLEGROUNDS", steam: 578080 },
        { title: "Counter-Strike 2", steam: 730 },
        { title: "Apex Legends", steam: 1172470 },
        { title: "DOOM Eternal", steam: 782330 },
        { title: "Borderlands 3", steam: 397540 },
      ],
    },
  ];

  function thumbUrl(g) {
    if (g.steam != null) return STEAM(g.steam);
    if (g.icon) return g.icon;
    return fallbackIcon(g.title);
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
      setStatus("远程读取失败，已使用本机数据", "warn");
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

    cat.games.forEach((g, i) => {
      const slug = gameSlug(cat, g, i);
      const src = thumbUrl(g);
      const isSteam = g.steam != null;
      const row = document.createElement("article");
      row.className = isSteam ? "row row--steam" : "row row--icon";

      if (isSteam) {
        row.innerHTML = `
          <div class="row__banner">
            <img src="${src}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
          </div>
          <div class="row__body">
            <div class="row__title">${g.title}</div>
            <textarea class="row__ta" data-slug="${slug}" spellcheck="false" rows="5" aria-label="${g.title.replace(/"/g, "&quot;")}"></textarea>
          </div>
        `;
      } else {
        row.innerHTML = `
          <div class="row__iconbox">
            <img src="${src}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
          </div>
          <div class="row__body">
            <div class="row__title">${g.title}</div>
            <textarea class="row__ta" data-slug="${slug}" spellcheck="false" rows="5" aria-label="${g.title.replace(/"/g, "&quot;")}"></textarea>
          </div>
        `;
      }

      const img = row.querySelector("img");
      img.addEventListener("error", () => {
        img.src = fallbackIcon(g.title);
      });
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
          `<button type="button" class="rail__btn${c.id === activeId ? " is-active" : ""}" data-id="${c.id}">${c.label}</button>`
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
      return new Date(ts).toLocaleString();
    } catch {
      return "";
    }
  }

  async function onSaveClick() {
    persistDockPrefs();
    setStatus("正在保存…", "busy");
    flushTextareasToStorage();
    const map = readAllReviewsMap();
    const now = Date.now();
    localStorage.setItem(LS_LAST, String(now));

    try {
      const res = await pushRemote(map);
      if (res && res.localOnly) {
        setStatus(`已保存到本机 · ${formatTime(now)}`, "ok");
      } else {
        setStatus(`已保存到服务器与本机 · ${formatTime(now)}`, "ok");
      }
    } catch (e) {
      setStatus(
        `本机已保存 · 服务器失败（${e && e.message ? e.message : "网络错误"}）`,
        "err"
      );
    }
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
    initDock();
    await pullRemote();
    renderSidebar();
    renderList();
    const st = document.getElementById("dock-status");
    const last = localStorage.getItem(LS_LAST);
    if (last && st && !st.textContent.trim()) {
      setStatus(`上次保存：${formatTime(Number(last))}`, "");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
