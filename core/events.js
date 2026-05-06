import { computeBeauty, inheritFeature, inheritScalar } from "./genetics.js";

const EVENT_TYPES = ["birth", "death", "scandal", "marriage", "affair", "visit"];
const NEGATIVE_SEVERITY = [
  { label: "light", delta: -1 },
  { label: "medium", delta: -4 },
  { label: "severe", delta: -7 },
  { label: "very severe", delta: -10 }
];
const POSITIVE_SEVERITY = [
  { label: "small", delta: 2 },
  { label: "medium", delta: 5 },
  { label: "large", delta: 7 }
];

export function logEvent(state, text, type = "event", participants = []) { const entry = { text, type, participants, time: `Y${state.year} M${state.month} D${state.monthDay}` }; state.events.unshift(entry); state.feed.unshift(entry); state.events = state.events.slice(0, 300); state.feed = state.feed.slice(0, 120); }
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function createRelationship(state, aId, bId, type, reason, strengthDelta = 5) { const a = state.charactersById[aId]; const b = state.charactersById[bId]; if (!a || !b || a.status === "dead" || b.status === "dead") return; for (const [src, tgt] of [[a, b], [b, a]]) { src.relationships = (src.relationships || []).filter((r) => r.targetId !== tgt.id); src.relationships.push({ targetId: tgt.id, type, strength: clamp(strengthDelta, -100, 100), originReason: reason }); } }

function executeDeath(state, character) { character.status = "dead"; character.maritalStatus = "widowed"; const family = state.familiesById[character.familyId]; if (family) family.reputation -= character.characterReputation > 20 ? 3 : 1; state.characters.forEach((c) => { c.relationships = (c.relationships || []).map((r) => r.targetId === character.id ? { ...r, type: "deceased", originReason: "death" } : r); if (c.spouseId === character.id) c.maritalStatus = "widowed"; }); logEvent(state, `Death: ${character.firstName} died. ${family?.name || "Family"} enters mourning.`, "death", [character.id]); }

function childbirthChance(parentA, parentB, familyWealth = 50, householdSize = 0) {
  const avgAge = ((parentA.age ?? 18) + (parentB?.age ?? 18)) / 2;
  const ageCompatibility = avgAge <= 35 ? 35 : avgAge <= 45 ? 15 : 3;
  const relStrength = (parentA.relationships || []).find((r) => r.targetId === parentB?.id)?.strength ?? 10;
  const relationshipStrength = clamp((relStrength + 100) / 5, 0, 40);
  const healthFactor = (parentA.health === "Healthy" ? 12 : 4) + (parentB?.health === "Healthy" ? 8 : 2);
  const stressPenalty = clamp((householdSize - Math.floor(familyWealth / 20)) * 4, 0, 35);
  const scandalPenalty = clamp(((parentA.characterReputation ?? 0) < -20 ? 8 : 0) + ((parentB?.characterReputation ?? 0) < -20 ? 8 : 0), 0, 20);
  return clamp(ageCompatibility + relationshipStrength + healthFactor - stressPenalty - scandalPenalty, 0, 95);
}

export function executeBirth(state, parentA, parentB) {
  if (!parentA || !parentB || parentA.status === "dead" || parentB.status === "dead") return;
  const family = state.familiesById[parentA.familyId];
  const household = state.characters.filter((c) => c.familyId === parentA.familyId && c.status !== "dead").length;
  const chance = childbirthChance(parentA, parentB, family?.wealth ?? 50, household);
  if (Math.random() * 100 > chance) {
    parentA.characterReputation -= 1;
    parentB.characterReputation -= 1;
    createRelationship(state, parentA.id, parentB.id, "strained", "failed-childbirth", -5);
    logEvent(state, `Birth attempt failed for ${parentA.firstName} and ${parentB.firstName}, causing tension.`, "birth", [parentA.id, parentB.id]);
    return;
  }

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
    genetics: { influence: Math.random() },
    intelligence: inheritScalar(state, parentA, parentB, "intelligence", 0, 10),
    personality: ["ambition", "jealousy", "charm", "morality", "intelligence", "socialHunger", "loyalty", "riskTolerance"].reduce((acc, key) => ({ ...acc, [key]: inheritScalar(state, parentA, parentB, key, 0, 10) }), {}),
    characterReputation: 0,
    relationships: [],
    parents: [parentA.id, parentB.id],
    looks: {
      hair: inheritFeature(state, parentA, parentB, "hair"),
      eyes: inheritFeature(state, parentA, parentB, "eyes"),
      eyeColor: inheritFeature(state, parentA, parentB, "eyeColor"),
      skin: inheritFeature(state, parentA, parentB, "skin"),
      faceType: inheritFeature(state, parentA, parentB, "faceType"),
      nose: inheritFeature(state, parentA, parentB, "nose")
    }
  };
  child.beautyBase = inheritScalar(state, parentA, parentB, "beauty", 0, 10);
  child.beauty = computeBeauty(child);

  state.characters.push(child); state.charactersById[child.id] = child;
  const married = !!(parentA.spouseId === parentB.id && parentB.spouseId === parentA.id);
  if (married) {
    if (family) family.reputation += 2;
    createRelationship(state, parentA.id, parentB.id, "married", "birth", 20);
    logEvent(state, `Birth: ${child.firstName} was born in marriage to ${parentA.firstName} and ${parentB.firstName}.`, "birth", [parentA.id, parentB.id, child.id]);
  } else {
    parentA.characterReputation -= 3; parentB.characterReputation -= 3;
    if (family) family.gossipLevel = (family.gossipLevel || 0) + 2;
    if (family) family.reputation -= 2;
    logEvent(state, `Scandalous birth: ${child.firstName} was born to unmarried parents ${parentA.firstName} and ${parentB.firstName}.`, "birth", [parentA.id, parentB.id, child.id]);
  }
}

export function updateRelationshipState(state) { state.characters.forEach((c) => { c.relationships = (c.relationships || []).map((r) => ({ ...r, strength: clamp((r.strength ?? 0) + (Math.random() > 0.5 ? 1 : -1), -100, 100) })); }); }

export function generateEvent(state) { const living = state.characters.filter((c) => c.status !== "dead" && c.age >= 10); if (living.length < 2) return; const type = randomFrom(EVENT_TYPES); const p1 = randomFrom(living); const p2 = living.find((c) => c.id !== p1.id && c.age >= 10);
  if (type === "death") return executeDeath(state, p1);
  if (type === "birth") return executeBirth(state, p1, p2);
  const severity = type === "scandal" ? randomFrom(NEGATIVE_SEVERITY) : randomFrom(POSITIVE_SEVERITY);
  p1.characterReputation += severity.delta; p2.characterReputation += severity.delta;
  createRelationship(state, p1.id, p2.id, type === "marriage" ? "married" : type === "affair" ? "lover" : type === "scandal" ? "rival" : "friend", type, severity.delta * 2);
  if (state.familiesById[p1.familyId]) state.familiesById[p1.familyId].reputation += severity.delta;
  if (state.familiesById[p2.familyId]) state.familiesById[p2.familyId].reputation += severity.delta;
  logEvent(state, `${type[0].toUpperCase() + type.slice(1)} (${severity.label}): ${p1.firstName} and ${p2.firstName} reshaped court dynamics.`, type, [p1.id, p2.id]); }
