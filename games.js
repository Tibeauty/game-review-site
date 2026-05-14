/**
 * Game library: categories, cover URLs (Steam header / known art), render + review autosave.
 */
(function () {
  const STEAM = (id) =>
    `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`;

  const fallbackCover = (title) => {
    const safe = title.replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="215" viewBox="0 0 460 215"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1a1d2e"/><stop offset="100%" stop-color="#12141f"/></linearGradient></defs><rect width="460" height="215" fill="url(#g)"/><text x="50%" y="50%" fill="#7ae0ff" font-family="system-ui,sans-serif" font-size="18" font-weight="700" text-anchor="middle" dominant-baseline="middle">${safe}</text></svg>`;
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
      title: "MOBA",
      subtitle: "多人竞技 · 补全至 5 款",
      games: [
        {
          title: "Honor of Kings",
          subtitle: "~2000h · 巅峰 2200+",
          cover: null,
        },
        {
          title: "League of Legends",
          subtitle: "~300h",
          cover:
            "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lux_0.jpg",
        },
        { title: "Dota 2", subtitle: "推荐补位 · 经典三角对线", cover: STEAM(570) },
        { title: "SMITE", subtitle: "推荐补位 · 神话题材第三人称", cover: STEAM(386360) },
        {
          title: "Battlerite",
          subtitle: "推荐补位 · 团队竞技场快节奏",
          cover: STEAM(555850),
        },
      ],
    },
    {
      id: "anime",
      title: "Anime-style",
      subtitle: "二次元动漫风 · 补全至 5 款",
      games: [
        {
          title: "Genshin Impact",
          subtitle: "AR 59 · 主线完结 · 蒙德 & 璃月全探索",
          cover:
            "https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_cover.jpg",
        },
        {
          title: "Honkai: Star Rail",
          subtitle: "Lv 70 · 全图 100% · 主线 & 支线清完 · 深渊通关",
          cover: STEAM(2357570),
        },
        {
          title: "Persona 5",
          subtitle: "15h · 进行中",
          cover: STEAM(1687950),
        },
        {
          title: "NieR:Automata",
          subtitle: "推荐补位 · 叙事与动作演出标杆",
          cover: STEAM(524220),
        },
        {
          title: "Tales of Arise",
          subtitle: "推荐补位 · JRPG 王道旅程",
          cover: STEAM(740130),
        },
      ],
    },
    {
      id: "coop",
      title: "Co-op",
      subtitle: "协力 / 派对 / 双人成行",
      games: [
        { title: "Fall Guys", subtitle: "130+h", cover: STEAM(1097150) },
        { title: "Content Warning", subtitle: "10h", cover: STEAM(2881650) },
        {
          title: "We Were Here Forever",
          subtitle: "已通关",
          cover: STEAM(1341290),
        },
        { title: "It Takes Two", subtitle: "已通关 · ~14h", cover: STEAM(1426210) },
        {
          title: "Operation: Tango",
          subtitle: "已通关",
          cover: STEAM(1335790),
        },
      ],
    },
    {
      id: "story",
      title: "Story & Puzzle",
      subtitle: "叙事与解谜（已通关为主）",
      games: [
        {
          title: "Chants of Sennaar",
          subtitle: "巴别塔圣歌 / Tower of Babel",
          cover: STEAM(1931770),
        },
        {
          title: "The Operator",
          subtitle: "接线疑云式桌面推理",
          cover: STEAM(1771980),
        },
        {
          title: "Cyber Manhunt",
          subtitle: "1 & 2",
          cover: STEAM(1330330),
        },
        {
          title: "Murders on the Yangtze River",
          subtitle: "山河旅探",
          cover: STEAM(1746030),
        },
        { title: "Sanfu", subtitle: "三伏", cover: STEAM(1880330) },
        { title: "Firework", subtitle: "烟火", cover: STEAM(1288310) },
        { title: "Trinity", subtitle: "三相奇谈", cover: STEAM(3084280) },
        {
          title: "Word Game",
          subtitle: "文字游戏",
          cover: STEAM(1396220),
        },
        {
          title: "Laughing to Die",
          subtitle: "喜丧 / Red Paper · Funeral",
          cover: STEAM(2182400),
        },
        {
          title: "Unheard",
          subtitle: "疑案追声 · Detective Di",
          cover: STEAM(942970),
        },
        {
          title: "The Almost Gone",
          subtitle: "已通关",
          cover: STEAM(1115780),
        },
        { title: "Gorogoa", subtitle: "已通关", cover: STEAM(557600) },
        { title: "Hacknet", subtitle: "已通关", cover: STEAM(365450) },
        {
          title: "Little Nightmares",
          subtitle: "已通关",
          cover: STEAM(252550),
        },
        {
          title: "Ori and the Will of the Wisps",
          subtitle: "已通关",
          cover: STEAM(1057090),
        },
        {
          title: "Rusty Lake Trilogy",
          subtitle: "Hotel / Roots / Paradise",
          cover: STEAM(435400),
        },
        {
          title: "Untitled Goose Game",
          subtitle: "已通关",
          cover: STEAM(1016600),
        },
      ],
    },
    {
      id: "aaa",
      title: "AAA & Cinematic",
      subtitle: "3A 与强演出（补全至 5 款 · It Takes Two 见协力区）",
      games: [
        { title: "Blanc", subtitle: "13h · 已通关", cover: STEAM(2537370) },
        {
          title: "The Past Within",
          subtitle: "13h · 已通关",
          cover: STEAM(1519060),
        },
        { title: "A Way Out", subtitle: "12h · 已通关", cover: STEAM(1222700) },
        { title: "Death Stranding", subtitle: "5h", cover: STEAM(1190460) },
        {
          title: "Elden Ring",
          subtitle: "推荐补位 · 开放世界魂系标杆",
          cover: STEAM(1245620),
        },
      ],
    },
    {
      id: "sim",
      title: "Survival / Builder / Sim",
      subtitle: "生存 · 建造 · 模拟",
      games: [
        { title: "Stardew Valley", subtitle: "130+h", cover: STEAM(413150) },
        {
          title: "Minecraft",
          subtitle: "50h",
          cover:
            "https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png",
        },
        { title: "Spiritfarer", subtitle: "36h", cover: STEAM(972660) },
        { title: "Cult of the Lamb", subtitle: "8h", cover: STEAM(1123580) },
        { title: "Don't Starve", subtitle: "8h", cover: STEAM(219740) },
        {
          title: "Dave the Diver",
          subtitle: "10h · 进行中",
          cover: STEAM(1868140),
        },
        { title: "Chinese Parents", subtitle: "18h", cover: STEAM(570940) },
        { title: "Astroneer", subtitle: "10h", cover: STEAM(361420) },
      ],
    },
    {
      id: "fps",
      title: "FPS",
      subtitle: "射击 · 补全至 5 款",
      games: [
        { title: "PUBG: BATTLEGROUNDS", subtitle: "100+h", cover: STEAM(578080) },
        {
          title: "Counter-Strike 2",
          subtitle: "推荐补位 · 竞技射击常青树",
          cover: STEAM(730),
        },
        {
          title: "Apex Legends",
          subtitle: "推荐补位 · 英雄技能大逃杀",
          cover: STEAM(1172470),
        },
        {
          title: "DOOM Eternal",
          subtitle: "推荐补位 · 高速清屏爽感",
          cover: STEAM(782330),
        },
        {
          title: "Borderlands 3",
          subtitle: "推荐补位 · 刷宝射击合作",
          cover: STEAM(397540),
        },
      ],
    },
  ];

  const storageKey = (slug) => `gamescope-review::${slug}`;

  function mount() {
    const root = document.getElementById("library-root");
    if (!root) return;

    const frag = document.createDocumentFragment();

    categories.forEach((cat) => {
      const section = document.createElement("section");
      section.className = "cat";
      section.id = cat.id;
      section.innerHTML = `
        <header class="cat__head">
          <div>
            <h2 class="cat__title">${cat.title}</h2>
            <p class="cat__sub">${cat.subtitle}</p>
          </div>
          <span class="cat__count">${cat.games.length} games</span>
        </header>
        <div class="cat__grid"></div>
      `;
      const grid = section.querySelector(".cat__grid");

      cat.games.forEach((g) => {
        const slug = slugify(g.title + "-" + cat.id);
        const card = document.createElement("article");
        card.className = "game-card";
        const initialCover = g.cover || fallbackCover(g.title);
        card.innerHTML = `
          <div class="game-card__media">
            <img class="game-card__cover" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${initialCover}" />
            <div class="game-card__shine" aria-hidden="true"></div>
          </div>
          <div class="game-card__body">
            <h3 class="game-card__title">${g.title}</h3>
            <p class="game-card__meta">${g.subtitle}</p>
            <label class="sr-only" for="ta-${slug}">评价</label>
            <textarea id="ta-${slug}" class="game-card__review" rows="3" spellcheck="false" placeholder="写下你对这款游戏的评价…"></textarea>
          </div>
        `;

        const img = card.querySelector(".game-card__cover");
        img.addEventListener("error", () => {
          img.src = fallbackCover(g.title);
        });

        const ta = card.querySelector(".game-card__review");
        const saved = localStorage.getItem(storageKey(slug));
        if (saved) ta.value = saved;
        ta.addEventListener("input", () => {
          localStorage.setItem(storageKey(slug), ta.value);
        });

        grid.appendChild(card);
      });

      frag.appendChild(section);
    });

    root.appendChild(frag);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
