import { assignLooks } from "./core/genetics.js";
import { tickSimulation } from "./core/simulation.js";
import { renderFamilies } from "./ui/families.js";
import { renderFeed } from "./ui/eventFeed.js";
import { setupTabs } from "./ui/tabs.js";
import { showCharacterModal, titleFor } from "./ui/characterModal.js";
import { skipDay, skipWeek, skipMonth, skipYear } from "./systems/time.js";

const maleAttire = ["Tailcoat", "Estate Suit", "Club Uniform"];
const femaleAttire = ["Morning Dress", "Visiting Dress", "Ball Gown", "Evening Dress"];
const state = { year: 1700, month: 1, monthDay: 1, day: 1, phase: "Morning", phaseIndex: 0, tick: 0, events: [], feed: [], families: [], characters: [], relationships: [], globalReputation: 0, paused: false, autoplay: false };

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
    c.genderRole ??= c.gender;
    c.displayName = `${titleFor(c)} ${c.firstName} ${state.familiesById[c.familyId].name.replace("House ", "")}`;
    c.dress = c.genderRole === "male" ? maleAttire[Math.floor(Math.random() * maleAttire.length)] : femaleAttire[Math.floor(Math.random() * femaleAttire.length)];
    c.relationships ??= [];
  });
  state.charactersById = Object.fromEntries(state.characters.map(c => [c.id, c]));
  bindUI();
  render();
  setInterval(() => {
    if (!state.paused && state.autoplay) {
      tickSimulation(state);
      render();
    }
  }, 1200);
}

function bindUI() {
  document.getElementById("pauseBtn").onclick = () => {
    state.paused = !state.paused;
    document.getElementById("pauseBtn").textContent = state.paused ? "Play" : "Pause";
  };
  document.getElementById("closeModal").onclick = () => document.getElementById("characterModal").classList.add("hidden");
  setupTabs((tab) => {
    if (tab === "actions") {
      document.getElementById("mainView").innerHTML = `<h2>God Mode Actions</h2>
        <div class='button-row'>
          <button id='skipDay'>⏭ Skip Day</button><button id='skipWeek'>⏭ Skip Week</button><button id='skipMonth'>⏭ Skip Month</button><button id='skipYear'>⏭ Skip Year</button>
          <button id='playAuto'>⏩ Fast Forward</button><button id='stopAuto'>⏸ Pause Auto</button>
        </div>
        <div class='button-row'>
          <button id='createFamily'>Create Family</button><button id='modifyFamily'>Modify Wealth/Reputation</button>
          <button id='forceMarriage'>Force Marriage</button><button id='forceDivorce'>Force Divorce</button>
          <button id='startRumor'>Start Rumor</button><button id='amplifyGossip'>Amplify Gossip</button>
        </div>`;
      wireActionButtons();
    } else renderFamilies(state, (id) => showCharacterModal(state, id));
  });
}

function wireActionButtons() {
  const run = (fn) => { fn(state); tickSimulation(state, 0); render(); };
  document.getElementById("skipDay").onclick = () => run(skipDay);
  document.getElementById("skipWeek").onclick = () => run(skipWeek);
  document.getElementById("skipMonth").onclick = () => run(skipMonth);
  document.getElementById("skipYear").onclick = () => run(skipYear);
  document.getElementById("playAuto").onclick = () => { state.autoplay = true; state.paused = false; };
  document.getElementById("stopAuto").onclick = () => { state.autoplay = false; };
  document.getElementById("createFamily").onclick = () => {
    const id = `f${Date.now()}`;
    state.families.push({ id, name: `House Newland ${state.families.length + 1}`, wealth: "Low", reputation: 25, status: "Unknown", scandal: 0, marriagePressure: 2 });
    state.familiesById[id] = state.families[state.families.length - 1];
    render();
  };
  document.getElementById("modifyFamily").onclick = () => {
    const fam = state.families[0]; if (!fam) return;
    fam.wealth = "High"; fam.reputation = Math.min(100, fam.reputation + 10);
    state.feed.unshift({ text: `${fam.name} received direct intervention: wealth and reputation improved.`, type: "player" }); render();
  };
  document.getElementById("forceMarriage").onclick = () => state.feed.unshift({ text: "Player arranged a strategic marriage alliance.", type: "player" });
  document.getElementById("forceDivorce").onclick = () => state.feed.unshift({ text: "Player forced a divorce. Reputation shock ripples through society.", type: "player" });
  document.getElementById("startRumor").onclick = () => state.feed.unshift({ text: "A player-forged rumor now spreads through court.", type: "gossip" });
  document.getElementById("amplifyGossip").onclick = () => state.feed.unshift({ text: "The rumor was amplified by salons and rival houses.", type: "gossip" });
}

function render() {
  document.getElementById("timeDisplay").textContent = `Year ${state.year}, Month ${state.month}, Day ${state.monthDay} • ${state.phase}`;
  document.getElementById("globalReputation").textContent = state.globalReputation;
  if (document.querySelector(".tab.active")?.dataset.tab === "families") renderFamilies(state, (id) => showCharacterModal(state, id));
  renderFeed(state);
}

init();
