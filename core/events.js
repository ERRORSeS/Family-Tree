const EVENT_TYPES = ["birth", "death", "scandal", "marriage", "affair", "visit"];

export function logEvent(state, text, type = "event", participants = []) {
  const entry = { text, type, participants, time: `Y${state.year} M${state.month} D${state.monthDay}` };
  state.events.unshift(entry);
  state.feed.unshift(entry);
  state.events = state.events.slice(0, 300);
  state.feed = state.feed.slice(0, 120);
}

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function createRelationship(state, aId, bId, type, reason, strengthDelta = 5) {
  const a = state.charactersById[aId];
  const b = state.charactersById[bId];
  if (!a || !b || a.status === "dead" || b.status === "dead") return;
  for (const [src, tgt] of [[a, b], [b, a]]) {
    src.relationships = (src.relationships || []).filter((r) => r.targetId !== tgt.id);
    src.relationships.push({ targetId: tgt.id, type, strength: Math.max(-100, Math.min(100, strengthDelta)), originReason: reason });
  }
}

function executeDeath(state, character) {
  character.status = "dead";
  character.maritalStatus = "widowed";
  state.activeCharacterIds = (state.activeCharacterIds || state.characters.map((c) => c.id)).filter((id) => id !== character.id);
  const family = state.familiesById[character.familyId];
  if (family) family.reputation -= character.characterReputation > 20 ? 3 : 1;
  state.characters.forEach((c) => {
    c.relationships = (c.relationships || []).map((r) => r.targetId === character.id ? { ...r, type: "deceased", originReason: "death" } : r);
    if (c.spouseId === character.id) c.maritalStatus = "widowed";
  });
  if (family && family.headId === character.id) {
    const heir = state.characters.find((c) => c.familyId === family.id && c.status !== "dead" && c.age >= 16);
    family.headId = heir?.id || null;
  }
  logEvent(state, `Death: ${character.firstName} died. ${family?.name || "Family"} enters mourning.`, "death", [character.id]);
}

function executeBirth(state, parentA, parentB) {
  const child = {
    id: `c${Date.now()}${Math.floor(Math.random() * 1000)}`,
    firstName: `Child${state.characters.length + 1}`,
    gender: Math.random() > 0.5 ? "male" : "female",
    age: 0,
    familyId: parentA.familyId,
    originFamilyId: parentA.familyId,
    maritalStatus: "not-married",
    health: "Healthy",
    status: "alive",
    intelligence: Math.round(((parentA.intelligence || 5) + (parentB?.intelligence || 5)) / 2 + (Math.random() * 2 - 1)),
    beauty: Math.max(0, Math.min(10, Math.round((((parentA.beauty ?? 5) + (parentB?.beauty ?? 5)) / 2) + (Math.random() * 2 - 1)))),
    personality: ["ambition", "jealousy", "charm", "morality", "intelligence", "socialHunger", "loyalty", "riskTolerance"].reduce((acc, key) => {
      const av = parentA.personality?.[key] ?? 5;
      const bv = parentB?.personality?.[key] ?? 5;
      acc[key] = Math.max(0, Math.min(10, Math.round((av + bv) / 2 + (Math.random() * 2 - 1))));
      return acc;
    }, {}),
    characterReputation: 0,
    relationships: [],
    parents: [parentA.id, parentB?.id].filter(Boolean)
  };
  state.characters.push(child);
  state.charactersById[child.id] = child;
  const married = !!(parentB && parentA.spouseId === parentB.id && parentB.spouseId === parentA.id);
  if (married) {
    if (state.familiesById[parentA.familyId]) state.familiesById[parentA.familyId].reputation += 1;
    createRelationship(state, parentA.id, parentB.id, "married", "birth", 20);
  } else {
    parentA.characterReputation -= 3;
    if (parentB) parentB.characterReputation -= 2;
  }
  logEvent(state, `Birth: ${child.firstName} was born to ${parentA.firstName}${parentB ? ` and ${parentB.firstName}` : ""}.`, "birth", [parentA.id, parentB?.id, child.id].filter(Boolean));
}

function updateRelationsFromEvent(state, p1, p2, type) {
  if (!p1 || !p2) return;
  const map = { visit: ["friend", 6], affair: ["lover", 10], scandal: ["rival", -12], marriage: ["married", 25] };
  const [relType, strength] = map[type] || ["acquaintance", 2];
  createRelationship(state, p1.id, p2.id, relType, type, strength);
}

export function updateRelationshipState(state) {
  state.characters.forEach((c) => {
    c.relationships = (c.relationships || []).map((r) => ({ ...r, strength: Math.max(-100, Math.min(100, (r.strength ?? 0) + (Math.random() > 0.5 ? 1 : -1))) }));
  });
}

export function generateEvent(state) {
  const living = state.characters.filter((c) => c.status !== "dead");
  if (living.length < 2) return;
  const type = randomFrom(EVENT_TYPES);
  const p1 = randomFrom(living);
  const p2 = living.find((c) => c.id !== p1.id);

  if (type === "death") return executeDeath(state, p1);
  if (type === "birth") return executeBirth(state, p1, p2);

  // 1-7 event pipeline
  const participants = [p1, p2].filter(Boolean);
  const valid = participants.length >= 2;
  if (!valid) return;
  p1.characterReputation += type === "scandal" ? -2 : 1;
  p2.characterReputation += type === "scandal" ? -2 : 1;
  updateRelationsFromEvent(state, p1, p2, type);
  if (state.familiesById[p1.familyId]) state.familiesById[p1.familyId].reputation += type === "scandal" ? -1 : 1;
  if (state.familiesById[p2.familyId]) state.familiesById[p2.familyId].reputation += type === "scandal" ? -1 : 1;
  if (state.familiesById[p1.familyId]) state.familiesById[p1.familyId].gossipLevel = (state.familiesById[p1.familyId].gossipLevel || 0) + 1;
  logEvent(state, `${type[0].toUpperCase() + type.slice(1)}: ${p1.firstName} and ${p2.firstName} reshaped court dynamics.`, type, participants.map((p) => p.id));
}
