/**
 * Categories + games: Steam titles use header art as thumb; off-Steam use icon URLs.
 * Left rail switches category; reviews persist in localStorage.
 */
(function () {
  const STEAM = (id) =>
    `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`;

  /** Off-Steam — high-res favicons from official sites (Google favicon proxy, stable hotlink). */
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
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect fill="#0d0221" width="128" height="128"/><rect x="8" y="8" width="112" height="112" fill="none" stroke="#00f3ff" stroke-width="2" opacity="0.6"/><text x="64" y="72" fill="#ff2a6d" font-family="system-ui,sans-serif" font-size="11" font-weight="700" text-anchor="middle">${safe}</text></svg>`;
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

  function gameSlug(cat, game, index) {
    const base = slugify(game.title);
    return `${cat.id}-${index}-${base || "game"}`;
  }

  function bindReview(ta, slug) {
    const k = storageKey(slug);
    const saved = localStorage.getItem(k);
    if (saved) ta.value = saved;
    ta.addEventListener("input", () => localStorage.setItem(k, ta.value));
  }

  function renderList() {
    const root = document.getElementById("library-root");
    if (!root) return;
    const cat = categories.find((c) => c.id === activeId) || categories[0];
    root.innerHTML = "";

    cat.games.forEach((g, i) => {
      const slug = gameSlug(cat, g, i);
      const row = document.createElement("article");
      row.className = "row";
      const src = thumbUrl(g);
      row.innerHTML = `
        <div class="row__thumb${g.steam != null ? " row__thumb--steam" : " row__thumb--icon"}">
          <img src="${src}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
        </div>
        <div class="row__body">
          <div class="row__title">${g.title}</div>
          <textarea class="row__ta" spellcheck="false" rows="3" aria-label="${g.title.replace(/"/g, "&quot;")}"></textarea>
        </div>
      `;
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
        activeId = btn.getAttribute("data-id");
        rail.querySelectorAll(".rail__btn").forEach((b) => {
          b.classList.toggle("is-active", b.getAttribute("data-id") === activeId);
        });
        renderList();
      });
    });
  }

  function mount() {
    renderSidebar();
    renderList();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
