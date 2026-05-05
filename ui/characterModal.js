export function showCharacterModal(state, id, rerender) {
  const c = state.charactersById[id];
  const modal = document.getElementById("characterModal");
  const el = document.getElementById("characterContent");
  const family = state.familiesById[c.familyId]?.name || "Unknown";
  const relRows = (c.relationships || []).map((r) => {
    const t = state.charactersById[r.targetId];
    if (!t) return "";
    return `<li>{${t.firstName} | ${state.familiesById[t.familyId]?.name || "-"} | ${t.gender} | ${t.age}} → ${r.type}</li>`;
  }).join("");
  el.innerHTML = `<h2>${c.firstName}</h2><p>Family: ${family}<br>Gender: ${c.gender}<br>Age: ${c.age}<br>Character Reputation: ${c.characterReputation ?? 0}</p>
  <h3>Relationship Tab</h3><ul>${relRows || "<li>No relationships</li>"}</ul>
  <button id='marryBtn'>Force Marriage</button><button id='divorceBtn'>Divorce</button><button id='childBtn'>Try for Child</button><button id='linkBtn'>Set Relationship</button>`;

  document.getElementById("marryBtn").onclick = () => mutateRelationship(state, c.id, "Married", rerender);
  document.getElementById("divorceBtn").onclick = () => mutateRelationship(state, c.id, "Ex", rerender, -10);
  document.getElementById("childBtn").onclick = () => tryForChild(state, c.id, rerender);
  document.getElementById("linkBtn").onclick = () => setRelationshipPrompt(state, c.id, rerender);
  modal.classList.remove("hidden");
}

function setRelationshipPrompt(state, sourceId, rerender) {
  const targetName = prompt("Target character name:");
  const target = state.characters.find((x) => x.firstName === targetName && x.id !== sourceId);
  if (!target) return;
  const type = prompt("Relationship Type (Married/Lover/Suitor/Friend/Best Friend/Rival/Enemy/Family Member/Ex)", "Friend") || "Friend";
  setRelationship(state, sourceId, target.id, type);
  rerender();
}

function mutateRelationship(state, sourceId, type, rerender, reputationDelta = 4) {
  const other = state.characters.find((x) => x.id !== sourceId);
  if (!other) return;
  setRelationship(state, sourceId, other.id, type);
  updateCharacterReputation(state, sourceId, reputationDelta);
  rerender();
}

function tryForChild(state, sourceId, rerender) {
  const parentA = state.charactersById[sourceId];
  const partnerRel = (parentA.relationships || []).find((r) => r.type === "Married" || r.type === "Lover");
  if (!partnerRel) return;
  const parentB = state.charactersById[partnerRel.targetId];
  if (!parentB) return;
  if (Math.random() > 0.5) return;
  const child = {
    id: `c${Date.now()}`,
    firstName: `Child${state.characters.length + 1}`,
    gender: Math.random() > 0.5 ? "male" : "female",
    age: 0,
    familyId: parentA.familyId,
    maritalStatus: "unmarried",
    health: "Healthy",
    intelligence: Math.round((parentA.intelligence + parentB.intelligence) / 2),
    personality: {
      ambition: mixTrait(parentA, parentB, "ambition"), jealousy: mixTrait(parentA, parentB, "jealousy"), charm: mixTrait(parentA, parentB, "charm"), morality: mixTrait(parentA, parentB, "morality"), intelligence: mixTrait(parentA, parentB, "intelligence"), socialHunger: mixTrait(parentA, parentB, "socialHunger"), loyalty: 5, riskTolerance: 5
    },
    characterReputation: 0,
    relationships: []
  };
  state.characters.push(child); state.charactersById[child.id] = child; rerender();
}

function mixTrait(a, b, key) { const av = a.personality?.[key] ?? 5; const bv = b.personality?.[key] ?? 5; return Math.max(0, Math.min(10, Math.round(av * 0.5 + bv * 0.3 + Math.random() * 2))); }

function setRelationship(state, aId, bId, type) {
  const a = state.charactersById[aId]; const b = state.charactersById[bId];
  a.relationships = (a.relationships || []).filter((r) => r.targetId !== bId); b.relationships = (b.relationships || []).filter((r) => r.targetId !== aId);
  a.relationships.push({ targetId: bId, type }); b.relationships.push({ targetId: aId, type });
}

function updateCharacterReputation(state, id, change) {
  const c = state.charactersById[id]; if (!c) return;
  c.characterReputation = Math.max(-100, Math.min(100, (c.characterReputation || 0) + change));
  if (change < 0) state.feed.unshift({ text: `${c.firstName}'s reputation declined. Gossip spreads.`, type: "gossip", time: "now" });
}

export function titleFor(character) { return character.gender === "male" ? "Sir" : "Lady"; }
