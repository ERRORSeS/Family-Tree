import { tickSimulation, advanceDay, advanceMonth, advanceYear } from "./core/simulation.js";
import { renderFamilies } from "./ui/families.js";
import { renderFeed } from "./ui/eventFeed.js";
import { setupTabs } from "./ui/tabs.js";
import { showCharacterModal } from "./ui/characterModal.js";

const state = { year: 1821, month: 3, monthDay: 12, phase: "Morning", tick: 0, events: [], feed: [], families: [], characters: [], relationships: [], globalReputation: 0, paused: true, autoplay: false, activeFamilyId: null, selectedCharacterId: null };

function defaultFamily(name) { return { id: `f${Date.now()}`, name, wealth: 50, reputation: 0, status: "Unknown", scandal: 0, gossipLevel: 0 }; }

function saveGame() { localStorage.setItem("family-tree-save", JSON.stringify(state)); }
function autoSave(interval = 30000) { setInterval(saveGame, interval); }
function resetGame() { localStorage.removeItem("family-tree-save"); location.reload(); }
function loadGame() {
  const raw = localStorage.getItem("family-tree-save");
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
    if (!Array.isArray(state.families)) state.families = [];
    if (!Array.isArray(state.characters)) state.characters = [];
    if (!Array.isArray(state.feed)) state.feed = [];
    if (!Array.isArray(state.events)) state.events = [];
    state.familiesById = Object.fromEntries(state.families.map((f) => [f.id, f]));
    state.charactersById = Object.fromEntries(state.characters.map((c) => [c.id, c]));
    return true;
  } catch {
    localStorage.removeItem("family-tree-save");
    return false;
  }
}

function init() {
  if (!loadGame()) {
    state.families = [];
    state.characters = [];
    state.events = [];
    state.feed = [{ text: "World is empty. Create the first family to begin.", type: "system", time: "start" }];
  }
  state.familiesById = Object.fromEntries((state.families || []).map((f) => [f.id, f]));
  state.charactersById = Object.fromEntries((state.characters || []).map((c) => [c.id, c]));
  bindUI();
  render();
  setInterval(() => { if (state.autoplay && !state.paused) { advanceDay(state); render(); saveGame(); } }, 1500);
  autoSave(30000);
}

function bindUI() {
  document.getElementById("pauseBtn").onclick = () => { state.paused = !state.paused; document.getElementById("pauseBtn").textContent = state.paused ? "▶ Play" : "⏸ Pause"; };
  document.getElementById("closeModal").onclick = () => document.getElementById("characterModal").classList.add("hidden");
  setupTabs((tab) => { if (tab === "actions") renderActions(); else renderFamiliesTab(); });
}

function renderActions() {
  const view = document.getElementById("mainView");
  if (!state.families.length) {
    view.innerHTML = `<h2>Start Society</h2><button id='createFirstFamily'>Create First Family</button>`;
    document.getElementById("createFirstFamily").onclick = () => { state.families.push(defaultFamily("House Whitmore")); state.familiesById = Object.fromEntries(state.families.map((f) => [f.id, f])); renderFamiliesTab(); saveGame(); };
    return;
  }
  view.innerHTML = `<h2>Society Control</h2>
  <div class='button-row'><button id='playBtn'>▶ play</button><button id='daySkip'>⏩ day skip</button><button id='monthSkip'>⏩ month skip</button><button id='yearSkip'>⏩ year skip</button></div>
  <div class='button-row'><button id='newFamily'>Create Family</button><button id='saveBtn'>Save Now</button><button id='resetBtn'>Reset Game</button></div>`;
  document.getElementById("playBtn").onclick = () => { state.autoplay = !state.autoplay; state.paused = false; render(); };
  document.getElementById("daySkip").onclick = () => { advanceDay(state); render(); saveGame(); };
  document.getElementById("monthSkip").onclick = () => { advanceMonth(state); render(); saveGame(); };
  document.getElementById("yearSkip").onclick = () => { advanceYear(state); render(); saveGame(); };
  document.getElementById("newFamily").onclick = () => { state.families.push(defaultFamily(`House ${state.families.length + 1}`)); state.familiesById = Object.fromEntries(state.families.map((f) => [f.id, f])); render(); saveGame(); };
  document.getElementById("saveBtn").onclick = () => saveGame();
  document.getElementById("resetBtn").onclick = () => resetGame();
}

function renderFamiliesTab() {
  renderFamilies(state, { onCharacterClick: (id) => { state.selectedCharacterId = id; showCharacterModal(state, id, rerender); }, onSelectFamily: (id) => { state.activeFamilyId = id; renderFamiliesTab(); } , onCreateCharacter: createCharacter, onModifyFamily: modifyFamily, onRenameFamily: renameFamily, onDeleteFamily: deleteFamily });
}

function createCharacter(data) { if (!state.activeFamilyId) return; const id = `c${Date.now()}`; const c = { id, ...data, familyId: state.activeFamilyId, originFamilyId: state.activeFamilyId, maritalStatus: "not-married", health: "Healthy", status: "alive", characterReputation: 0, relationships: [] }; state.characters.push(c); state.charactersById[id] = c; state.feed.unshift({ text: `${c.firstName} joined ${state.familiesById[state.activeFamilyId].name}.`, type: "player", time: "now" }); render(); saveGame(); }
function modifyFamily(field, amount) { const f = state.familiesById[state.activeFamilyId]; if (!f) return; f[field] += amount; state.feed.unshift({ text: `${f.name} ${field} changed by ${amount}.`, type: "player", time: "now" }); render(); saveGame(); }
function renameFamily(name) { const f = state.familiesById[state.activeFamilyId]; if (!f) return; f.name = name; render(); saveGame(); }
function deleteFamily(familyId) {
  const family = state.familiesById[familyId];
  if (!family) return;
  const members = state.characters.filter((c) => c.familyId === familyId);
  const memberIds = new Set(members.map((m) => m.id));
  const linkedRelationships = state.characters.reduce((count, c) => count + ((c.relationships || []).filter((r) => memberIds.has(r.targetId)).length), 0);
  const inheritanceLinks = state.characters.filter((c) => (c.parents || []).some((p) => memberIds.has(p))).length;
  const warning = `Delete permanently? ${members.length} characters removed, ${linkedRelationships} relationships broken, ${inheritanceLinks} inheritance links affected.`;
  if (!window.confirm(warning)) return;

  state.characters = state.characters.filter((c) => c.familyId !== familyId);
  for (const c of state.characters) {
    c.relationships = (c.relationships || []).filter((r) => !memberIds.has(r.targetId));
    if ((c.parents || []).some((p) => memberIds.has(p))) c.parents = (c.parents || []).filter((p) => !memberIds.has(p));
  }
  state.families = state.families.filter((f) => f.id !== familyId);
  state.relationships = (state.relationships || []).filter((r) => !memberIds.has(r.a) && !memberIds.has(r.b));
  state.familiesById = Object.fromEntries(state.families.map((f) => [f.id, f]));
  state.charactersById = Object.fromEntries(state.characters.map((c) => [c.id, c]));
  if (state.activeFamilyId === familyId) state.activeFamilyId = state.families[0]?.id || null;
  state.feed.unshift({ text: `House deletion: ${family.name} removed. Society reacts with major gossip.`, type: "player", time: "now" });
  render();
  saveGame();
}
function rerender() { render(); saveGame(); }

function render() {
  document.getElementById("timeDisplay").textContent = `Year: ${state.year} Month: ${state.month} Day: ${state.monthDay}`;
  document.getElementById("globalReputation").textContent = state.globalReputation;
  const active = document.querySelector(".tab.active")?.dataset.tab;
  if (active === "families") renderFamiliesTab();
  if (active === "actions") renderActions();
  renderFeed(state);
}

init();
