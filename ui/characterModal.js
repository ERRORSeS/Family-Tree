import { startPregnancy } from "../core/events.js";
function titleFor(character) { return character.gender === "male" ? "Sir" : "Lady"; }

export function showCharacterModal(state, id, rerender) {
  const c = state.charactersById[id];
  if (!c) return;
  const modal = document.getElementById("characterModal");
  const el = document.getElementById("characterContent");
  const family = state.familiesById[c.familyId]?.name || "Unknown";
  const relRows = (c.relationships || []).map((r) => {
    const t = state.charactersById[r.targetId];
    if (!t) return "";
    return `<li>${t.firstName} — ${r.type} | Strength: ${r.strength ?? 0} | Attraction: ${r.attraction ?? 0} | Trust: ${r.trust ?? 50} | Familiarity: ${r.familiarity ?? 10} | ${r.visibility || "public"} (${r.originReason || "interaction"})</li>`;
  }).join("");
  const pregnancy = c.pregnancy ? `<h3>Pregnancy</h3>
  <p>Status: Pregnant | Months Remaining: ${c.pregnancy.monthsRemaining} | Father: ${state.charactersById[c.pregnancy.parentB]?.firstName || "Unknown"} | Risk Level: ${c.pregnancy.riskLevel?.[0]?.toUpperCase()}${c.pregnancy.riskLevel?.slice(1)}</p>` : "";

  el.innerHTML = `<h2>${titleFor(c)} ${c.firstName}</h2>
  <h3>Identity</h3>
  <p>Gender: ${c.gender} | Age: ${c.age} | Family: ${family} | Origin Family: ${state.familiesById[c.originFamilyId]?.name || family} | Character Reputation: ${c.characterReputation ?? 0}</p>
  <h3>Stats</h3>
  <p>Beauty: ${c.beauty ?? 5} | Intelligence: ${c.intelligence ?? 5}</p>
  <p>Looks: Hair ${c.looks?.hair || "unknown"} | Skin ${c.looks?.skin || "unknown"} | Eyes ${c.looks?.eyes || "unknown"} (${c.looks?.eyeColor || "unknown"})</p>
  <p>Traits: ${Object.entries(c.personality || {}).map(([k,v]) => `${k}:${v}`).join(", ")}</p>
  ${pregnancy}
  <h3>Edit</h3>
  <input id='renameCharacter' value='${c.firstName}' /> <button id='saveCharacterName'>Save Character Name</button>
  <input id='renameFamily' value='${family}' /> <button id='saveFamilyName'>Save Family Name</button>
  <h3>Relationships</h3>
  <ul>${relRows || "<li>No emergent relationships yet.</li>"}</ul>
  <h3>Actions</h3>
  <select id='actionType'><option value='marriage'>Propose Marriage</option><option value='divorce'>Initiate Divorce</option><option value='child'>Try for Child</option><option value='talk'>Talk</option><option value='gossip'>Gossip</option></select>
  <select id='actionTarget'></select>
  <button id='confirmAction'>Confirm</button>`;

  const typeEl = document.getElementById("actionType");
  const targetEl = document.getElementById("actionTarget");
  const refill = () => {
    const candidates = state.characters.filter((x) => x.id !== c.id && x.status !== "dead").filter((x) => {
      if (typeEl.value === "divorce") return c.spouseId === x.id;
      if (typeEl.value === "child") return c.spouseId === x.id || (c.relationships || []).some((r) => r.targetId === x.id && (r.type === "lover" || r.strength > 30));
      if (typeEl.value === "marriage") return !c.spouseId && !x.spouseId && c.age >= 16 && x.age >= 16;
      return true;
    });
    targetEl.innerHTML = candidates.map((x) => `<option value='${x.id}'>${x.firstName} (${x.age})</option>`).join("");
  };
  refill();
  typeEl.onchange = refill;
  document.getElementById("confirmAction").onclick = () => executeAction(state, c.id, typeEl.value, targetEl.value, rerender);
  document.getElementById("saveCharacterName").onclick = () => {
    c.firstName = document.getElementById("renameCharacter").value.trim() || c.firstName;
    rerender();
  };
  document.getElementById("saveFamilyName").onclick = () => {
    const fam = state.familiesById[c.familyId];
    if (!fam) return;
    fam.name = document.getElementById("renameFamily").value.trim() || fam.name;
    rerender();
  };
  modal.classList.remove("hidden");
}

function executeAction(state, sourceId, action, targetId, rerender) {
  const a = state.charactersById[sourceId];
  const b = state.charactersById[targetId];
  if (!a || !b) return;
  if (action === "marriage") {
    if (a.age < 16 || b.age < 16 || a.spouseId || b.spouseId) return;
    a.spouseId = b.id; b.spouseId = a.id; a.maritalStatus = "married"; b.maritalStatus = "married";
    if (a.gender === "female" && b.gender === "male") a.familyId = b.familyId;
    if (b.gender === "female" && a.gender === "male") b.familyId = a.familyId;
    addRel(a, b, "married", 30, "marriage event");
    state.familiesById[a.familyId].reputation += 1;
  }
  if (action === "divorce" && a.spouseId === b.id) {
    a.spouseId = null; b.spouseId = null; a.maritalStatus = "not-married"; b.maritalStatus = "not-married";
    addRel(a, b, "ex", -25, "divorce"); a.characterReputation -= 3; b.characterReputation -= 3;
  }
  if (action === "child") startPregnancy(state, a, b, "player");
  if (action === "talk") addRel(a, b, "acquaintance", Math.random() > 0.5 ? 6 : -4, "talk");
  if (action === "gossip") addRel(a, b, "rival", Math.random() > 0.6 ? 7 : -8, "gossip");
  state.feed.unshift({ text: `${a.firstName} executed ${action} with ${b.firstName}.`, type: "player", time: "now" });
  rerender();
}

function addRel(a, b, type, strength, reason) {
  a.relationships = (a.relationships || []).filter((r) => r.targetId !== b.id);
  b.relationships = (b.relationships || []).filter((r) => r.targetId !== a.id);
  a.relationships.push({ targetId: b.id, type, strength, originReason: reason });
  b.relationships.push({ targetId: a.id, type, strength, originReason: reason });
}

export { titleFor };
