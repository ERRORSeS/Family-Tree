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
    return `<li>${t.firstName} — ${r.type} (${r.originReason || "interaction"})</li>`;
  }).join("");

  el.innerHTML = `<h2>${titleFor(c)} ${c.firstName}</h2>
  <h3>Identity</h3>
  <p>Gender: ${c.gender} | Age: ${c.age} | Family: ${family} | Origin Family: ${state.familiesById[c.originFamilyId]?.name || family} | Character Reputation: ${c.characterReputation ?? 0}</p>
  <h3>Stats</h3>
  <p>Beauty: ${c.beauty ?? 5} | Intelligence: ${c.intelligence ?? 5}</p>
  <p>Traits: ${Object.entries(c.personality || {}).map(([k,v]) => `${k}:${v}`).join(", ")}</p>
  <h3>Relationships</h3>
  <ul>${relRows || "<li>No emergent relationships yet.</li>"}</ul>
  <h3>Actions</h3>
  <select id='actionType'><option value='marriage'>Propose Marriage</option><option value='divorce'>Initiate Divorce</option><option value='child'>Try for Child</option><option value='influence'>Influence Relationship</option></select>
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
  modal.classList.remove("hidden");
}

function executeAction(state, sourceId, action, targetId, rerender) {
  const a = state.charactersById[sourceId];
  const b = state.charactersById[targetId];
  if (!a || !b) return;
  if (action === "marriage") {
    if (a.age < 16 || b.age < 16 || a.spouseId || b.spouseId) return;
    a.spouseId = b.id; b.spouseId = a.id; a.maritalStatus = "married"; b.maritalStatus = "married";
    addRel(a, b, "married", 30, "marriage event");
    state.familiesById[a.familyId].reputation += 1;
  }
  if (action === "divorce" && a.spouseId === b.id) {
    a.spouseId = null; b.spouseId = null; a.maritalStatus = "not-married"; b.maritalStatus = "not-married";
    addRel(a, b, "ex", -25, "divorce"); a.characterReputation -= 3; b.characterReputation -= 3;
  }
  if (action === "child") {
    const success = Math.random() < 0.5;
    if (success) {
      const child = { id: `c${Date.now()}`, firstName: `Child${state.characters.length + 1}`, gender: Math.random() > 0.5 ? "male" : "female", age: 0, status: "alive", familyId: a.familyId, originFamilyId: a.familyId, maritalStatus: "not-married", beauty: 5, health: "Healthy", intelligence: Math.round((a.intelligence + b.intelligence) / 2), personality: { ambition: 5, jealousy: 5, charm: 5, morality: 5, intelligence: 5, socialHunger: 5, loyalty: 5, riskTolerance: 5 }, characterReputation: 0, relationships: [] };
      state.characters.push(child); state.charactersById[child.id] = child;
    }
  }
  if (action === "influence") addRel(a, b, "friend", 8, "influence action");
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
