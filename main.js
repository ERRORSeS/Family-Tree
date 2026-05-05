import { assignLooks } from "./core/genetics.js";
import { tickSimulation } from "./core/simulation.js";
import { renderFamilies } from "./ui/families.js";
import { renderFeed } from "./ui/eventFeed.js";
import { setupTabs } from "./ui/tabs.js";
import { showCharacterModal, titleFor } from "./ui/characterModal.js";

const dresses = ["Morning Dress","Visiting Dress","Ball Gown","Evening Dress"];
const state = { year: 1700, phase: "Morning", phaseIndex: 0, tick: 0, events: [], feed: [], families: [], characters: [], relationships: [], globalReputation: 0, paused: false };

async function init() {
  const [families, characters] = await Promise.all([
    fetch("./data/families.json").then(r => r.json()),
    fetch("./data/characters.json").then(r => r.json())
  ]);
  state.families = families;
  state.familiesById = Object.fromEntries(families.map(f => [f.id, f]));
  state.characters = characters;
  assignLooks(state.characters);
  state.characters.forEach(c => {
    c.displayName = `${titleFor(c)} ${c.firstName} ${state.familiesById[c.familyId].name.replace("House ","")}`;
    c.dress = dresses[Math.floor(Math.random()*dresses.length)];
  });
  state.charactersById = Object.fromEntries(state.characters.map(c => [c.id, c]));
  bindUI();
  render();
  setInterval(() => { if (!state.paused) { tickSimulation(state); render(); } }, 1500);
}

function bindUI() {
  document.getElementById("pauseBtn").onclick = () => {
    state.paused = !state.paused;
    document.getElementById("pauseBtn").textContent = state.paused ? "Resume" : "Pause";
  };
  document.getElementById("closeModal").onclick = () => document.getElementById("characterModal").classList.add("hidden");
  setupTabs((tab) => {
    if (tab === "actions") {
      document.getElementById("mainView").innerHTML = `<h2>Player Actions</h2>
        <button id='skipTime'>Skip Time</button>
        <button id='startRumor'>Start Rumor</button>
        <p>Spectator mode remains active unless you intervene.</p>`;
      document.getElementById("skipTime").onclick = () => { tickSimulation(state); render(); };
      document.getElementById("startRumor").onclick = () => { state.feed.unshift({text:"A player-forged rumor now spreads through court.", type:"gossip"}); renderFeed(state); };
    } else renderFamilies(state, (id) => showCharacterModal(state, id));
  });
}

function render() {
  document.getElementById("timeDisplay").textContent = `Year ${state.year} • ${state.phase}`;
  document.getElementById("globalReputation").textContent = state.globalReputation;
  if (document.querySelector('.tab.active')?.dataset.tab === 'families') renderFamilies(state, (id) => showCharacterModal(state, id));
  renderFeed(state);
}

init();
