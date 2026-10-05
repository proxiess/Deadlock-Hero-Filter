const CONFIG = {
  filterGroups: {
    roles: { label: "Roles", field: "roles" },
    characteristics: { label: "Characteristics", field: "characteristics" },
    range: { label: "Range", field: "range" },
    scalingFocus: { label: "Scaling focus", field: "scalingFocus" },
    mechanics: { label: "mechanics", field: "mechanics", type: "number" },
    aim: { label: "Aim", field: "aim", type: "number" },
    decisionMaking: { label: "decision-making", field: "decisionMaking", type: "number" }
  },
  defaultFilterGroups: {
    roles: [
      "Tank",
      "Brawler",
      "Carry",
      "Support",
      "Assassin",
      "Ganker",
      "Initiator",
      "Duelist",
      "Teamfighter",
      "Disruptor",
      "Defender",
      "Harasser",
      "Split Pusher",
      "Siege",
      "Peeler"
    ],
    characteristics: [
      "Disabler",
      "Stunner",
      "Slow",
      "Burst Damage",
      "Sustained Damage",
      "AoE",
      "Single Target",
      "DoT",
      "Execute",
      "Sustain",
      "Healer",
      "Shield",
      "Lifesteal",
      "Escape",
      "Chase",
      "High Mobility",
      "Stealth",
      "Map Control",
      "Area Denial",
      "Ally Buff",
      "Enemy Debuff",
      "Reposition"
    ],
    range: ["Melee", "Short", "Medium", "Long", "Extreme"],
    scalingFocus: ["Early", "Mid", "Late", "Consistent"],
    mechanics: [1, 2, 3, 4, 5],
    aim: [1, 2, 3, 4, 5],
    decisionMaking: [1, 2, 3, 4, 5]
  },
  storageKey: "deadlockHeroFilterData:v2"
};

let state = {
  data: null,
  filters: createFilterState(),
  editMode: false,
  editingHeroId: null
};

const $ = (sel) => document.querySelector(sel);

async function loadData() {
  const saved = localStorage.getItem(CONFIG.storageKey);
  if (saved) {
    try {
      state.data = normalizeData(JSON.parse(saved));
      $("#storageStatus").textContent = "Using browser-saved data";
      return;
    } catch (_) {}
  }
  const response = await fetch("heroes.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load heroes.json");
  state.data = normalizeData(await response.json());
  $("#storageStatus").textContent = "Using heroes.json";
}

function normalizeData(data) {
  data.filterGroups = cloneFilterGroups(CONFIG.defaultFilterGroups);
  data.heroes = (data.heroes || []).map(h => ({
    id: h.id || slug(h.name),
    name: h.name,
    portrait: h.portrait || "",
    roles: normalizeList(h.roles, { "Split pusher": "Split Pusher" }),
    characteristics: normalizeList(h.characteristics, { "Nuker": "Burst Damage" }),
    range: normalizeList(h.range),
    scalingFocus: normalizeList(h.scalingFocus || h.powerCurve, {
      "Early Game": "Early",
      "0-10": "Early",
      "Mid Game": "Mid",
      "10-20": "Mid",
      "Late Game": "Late",
      "20-30": "Late",
      "Scaling": "Consistent",
      "30+": "Consistent"
    }),
    mechanics: normalizeNumber(h.mechanics ?? h.difficulty),
    aim: normalizeNumber(h.aim ?? h.difficulty),
    decisionMaking: normalizeNumber(h.decisionMaking ?? h.difficulty),
    wikiTags: normalizeList(h.wikiTags)
  }));
  state.filters = createFilterState();
  return data;
}

function createFilterState() {
  return Object.fromEntries(Object.keys(CONFIG.filterGroups).map(key => [key, new Set()]));
}

function cloneFilterGroups(groups) {
  return Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, [...values]]));
}

function normalizeList(value, replacements = {}) {
  const values = Array.isArray(value)
    ? value
    : value === undefined || value === null || value === ""
      ? []
      : [value];

  return [...new Set(values
    .map(v => replacements[String(v)] ?? v)
    .filter(v => v !== undefined && v !== null && v !== ""))];
}

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function renderFilters() {
  const root = $("#filterGroups");
  root.innerHTML = "";
  for (const [key, group] of Object.entries(CONFIG.filterGroups)) {
    const section = document.createElement("details");
    section.className = "filter-group";
    section.dataset.group = key;
    section.open = true;
    section.innerHTML = `
      <summary class="filter-summary">
        <span>${group.label}</span>
        <span class="filter-count" aria-live="polite"></span>
      </summary>
      <div class="filter-buttons"></div>
    `;
    const buttons = section.querySelector(".filter-buttons");
    for (const value of state.data.filterGroups[key]) {
      const b = document.createElement("button");
      b.className = "filter-button";
      b.type = "button";
      b.textContent = value;
      b.dataset.group = key;
      b.dataset.value = value;
      b.addEventListener("click", () => {
        const set = state.filters[key];
        set.has(value) ? set.delete(value) : set.add(value);
        b.classList.toggle("active", set.has(value));
        updateFilterCount(section, key);
        renderHeroes();
      });
      buttons.appendChild(b);
    }
    updateFilterCount(section, key);
    root.appendChild(section);
  }
}

function updateFilterCount(section, key) {
  const count = state.filters[key].size;
  section.querySelector(".filter-count").textContent = count ? `${count} active` : "";
}

function heroMatches(hero) {
  for (const [key, group] of Object.entries(CONFIG.filterGroups)) {
    const active = state.filters[key];
    if (!active.size) continue;
    const field = group.field;
    const value = hero[field];
    const matches = [...active].every(v => group.type === "number"
      ? Number(value) === Number(v)
      : Array.isArray(value) && value.includes(v));
    if (!matches) return false;
  }
  return true;
}

function renderHeroes() {
  const grid = $("#heroGrid");
  grid.innerHTML = "";
  let matches = 0;
  const template = $("#heroTemplate");

  for (const hero of state.data.heroes) {
    const card = template.content.firstElementChild.cloneNode(true);
    const matched = heroMatches(hero);
    if (matched) matches++;
    card.classList.toggle("match", matched);

    const img = card.querySelector(".hero-portrait");
    img.src = hero.portrait;
    img.alt = `${hero.name} portrait`;
    img.addEventListener("error", () => {
      img.alt = `${hero.name} portrait unavailable`;
      img.style.opacity = ".2";
    });

    card.querySelector(".hero-name").textContent = hero.name;
    const meta = [
      hero.roles.join(" · "),
      hero.characteristics.join(" · "),
      hero.range.join(" · "),
      hero.scalingFocus.join(" · "),
      hero.mechanics ? `Mechanics ${hero.mechanics}` : "Mechanics not set",
      hero.aim ? `Aim ${hero.aim}` : "Aim not set",
      hero.decisionMaking ? `Decision-making ${hero.decisionMaking}` : "Decision-making not set"
    ].filter(Boolean).join(" | ");
    card.querySelector(".hero-meta").textContent = meta;

    card.querySelector(".edit-hero-button").addEventListener("click", () => openEditor(hero.id));
    grid.appendChild(card);
  }
  $("#matchCount").textContent = `${matches} / ${state.data.heroes.length}`;
}

function openEditor(id) {
  state.editingHeroId = id;
  const hero = state.data.heroes.find(h => h.id === id);
  if (!hero) return;
  $("#editTitle").textContent = `Edit ${hero.name}`;
  const root = $("#editFields");
  root.innerHTML = "";

  for (const [key, group] of Object.entries(CONFIG.filterGroups)) {
    const section = document.createElement("section");
    section.className = "editor-group";
    section.innerHTML = `<h3>${group.label}</h3><div class="editor-buttons"></div>`;
    const buttons = section.querySelector(".editor-buttons");
    for (const value of state.data.filterGroups[key]) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "editor-button";
      const selected = group.type === "number"
        ? Number(hero[group.field]) === Number(value)
        : hero[group.field].includes(value);
      b.classList.toggle("selected", selected);
      b.textContent = value;
      b.addEventListener("click", () => {
        if (group.type === "number") {
          hero[group.field] = Number(value);
          buttons.querySelectorAll(".editor-button").forEach(x => x.classList.remove("selected"));
          b.classList.add("selected");
        } else {
          const list = hero[group.field];
          const i = list.indexOf(value);
          i >= 0 ? list.splice(i,1) : list.push(value);
          b.classList.toggle("selected", i < 0);
        }
      });
      buttons.appendChild(b);
    }
    root.appendChild(section);
  }
  $("#editDialog").showModal();
}

function saveBrowserCopy() {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.data));
  $("#storageStatus").textContent = "Changes saved in this browser";
}

$("#editModeBtn").addEventListener("click", () => {
  state.editMode = !state.editMode;
  document.body.classList.toggle("edit-mode", state.editMode);
  $("#editModeBtn").textContent = state.editMode ? "Exit edit mode" : "Edit mode";
});

$("#resetFiltersBtn").addEventListener("click", () => {
  for (const set of Object.values(state.filters)) set.clear();
  document.querySelectorAll(".filter-button").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".filter-group").forEach(section => {
    updateFilterCount(section, section.dataset.group);
  });
  renderHeroes();
});

$("#saveHeroBtn").addEventListener("click", (event) => {
  event.preventDefault();
  saveBrowserCopy();
  $("#editDialog").close();
  renderHeroes();
});

$("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "heroes.json"; a.click();
  URL.revokeObjectURL(url);
});

$("#importBtn").addEventListener("click", () => $("#importInput").click());
$("#importInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = normalizeData(JSON.parse(await file.text()));
    if (!Array.isArray(imported.heroes)) throw new Error("Invalid heroes array");
    state.data = imported;
    saveBrowserCopy();
    renderFilters();
    renderHeroes();
  } catch (err) {
    alert(`Import failed: ${err.message}`);
  }
  event.target.value = "";
});

(async function init() {
  try {
    await loadData();
    renderFilters();
    renderHeroes();
  } catch (err) {
    $("#heroGrid").innerHTML = `<p>Could not load the hero data. If your browser blocks local JSON files, start a tiny local server; see README.md.</p>`;
    console.error(err);
  }
})();
