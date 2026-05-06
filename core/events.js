import { computeBeauty, inheritFeature, inheritScalar } from "./genetics.js";

const EVENT_TYPES = ["social", "romantic", "conflict", "family", "scandal", "rare"];
const EVENT_POOL = {
  social: ["successful interaction", "awkward interaction", "ignored attempt", "unexpected connection"],
  romantic: ["attraction increase", "rejection", "secret interest", "jealousy triggered"],
  conflict: ["argument", "rivalry escalation", "public embarrassment"],
  family: ["inheritance tension", "parental pressure", "sibling rivalry"],
  scandal: ["affair discovered", "rumor spread", "reputation collapse"],
  rare: ["sudden death", "unexpected pregnancy", "dramatic breakup", "inheritance shock"]
};
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function calcSeverityLevel({ participants = 2, repImpact = 0, relationshipShift = 0, riskLevel = "low" } = {}) {
  let score = 0;
  score += participants >= 3 ? 2 : participants >= 2 ? 1 : 0;
  score += Math.abs(repImpact) >= 6 ? 2 : Math.abs(repImpact) >= 2 ? 1 : 0;
  score += Math.abs(relationshipShift) >= 20 ? 2 : Math.abs(relationshipShift) >= 8 ? 1 : 0;
  score += riskLevel === "high" ? 2 : riskLevel === "medium" ? 1 : 0;
  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

function formatEvent(type, participants, outcome, severity, effects) {
  return [
    `${type}`,
    `Participants: ${participants.join(", ")}`,
    `Outcome: ${outcome}`,
    `Severity: ${severity[0].toUpperCase() + severity.slice(1)}`,
    `Effects: ${effects}`
  ].join(" | ");
}

export function logEvent(state, { type = "event", participants = [], outcome = "Success", severity = "low", effects = "None", text }) {
  const names = participants.map((id) => state.charactersById[id]?.firstName || "Unknown");
  const entry = {
    text: text || formatEvent(type, names, outcome, severity, effects),
    type,
    participants,
    outcome,
    severityLevel: severity,
    effects,
    time: `Y${state.year} M${state.month} D${state.monthDay}`
  };
  state.events.unshift(entry);
  state.feed.unshift(entry);
  state.events = state.events.slice(0, 300);
  state.feed = state.feed.slice(0, 120);
}


function addMemory(character, memory) {
  character.memoryLog = character.memoryLog || [];
  character.memoryLog.unshift(memory);
  character.memoryLog = character.memoryLog.slice(0, 30);
}

function createRelationship(state, aId, bId, type, reason, strengthDelta = 5) {
  const a = state.charactersById[aId]; const b = state.charactersById[bId];
  if (!a || !b || a.status === "dead" || b.status === "dead") return;
  for (const [src, tgt] of [[a, b], [b, a]]) {
    src.relationships = (src.relationships || []).filter((r) => r.targetId !== tgt.id);
    src.relationships.push({ targetId: tgt.id, type, strength: clamp(strengthDelta, -100, 100), originReason: reason });
  }
}

function fertilityOf(character) {
  if (typeof character.fertility !== "number") character.fertility = clamp(0.35 + Math.random() * 0.5, 0, 1);
  return character.fertility;
}

function conceptionChance(parentA, parentB, family) {
  const relStrength = (parentA.relationships || []).find((r) => r.targetId === parentB?.id)?.strength ?? 0;
  const relationship = clamp((relStrength + 100) / 200, 0, 1);
  const health = ((parentA.health === "Healthy" ? 1 : 0.65) + (parentB.health === "Healthy" ? 1 : 0.65)) / 2;
  const scandalPenalty = clamp(((family?.scandal || 0) / 100) + ((family?.gossipLevel || 0) / 200), 0, 0.35);
  return clamp((fertilityOf(parentA) + fertilityOf(parentB)) / 2 + relationship * 0.35 + health * 0.15 - scandalPenalty, 0.02, 0.95);
}

function pregnancyRisk(parentA, parentB) {
  const avgAge = ((parentA.age || 18) + (parentB.age || 18)) / 2;
  const unhealthy = [parentA.health, parentB.health].filter((h) => h !== "Healthy").length;
  if (avgAge > 40 || unhealthy === 2) return "high";
  if (avgAge > 33 || unhealthy === 1) return "medium";
  return "low";
}

export function startPregnancy(state, parentA, parentB, via = "ai") {
  if (!parentA || !parentB || parentA.status === "dead" || parentB.status === "dead") return false;
  const mother = parentA.gender === "female" ? parentA : parentB.gender === "female" ? parentB : null;
  const father = mother?.id === parentA.id ? parentB : parentA;
  if (!mother || !father || mother.pregnancy) return false;

  const family = state.familiesById[mother.familyId];
  const chance = conceptionChance(mother, father, family);
  const success = Math.random() < chance;
  if (!success) {
    createRelationship(state, mother.id, father.id, "strained", "conception-failed", -4);
    logEvent(state, { type: "Childbirth", participants: [mother.id, father.id], outcome: "Failure", severity: "low", effects: "No pregnancy; relationship tension increased." });
    return false;
  }

  const duration = 270 + Math.floor((Math.random() * 41) - 20);
  const riskLevel = pregnancyRisk(mother, father);
  mother.pregnancy = { parentA: mother.id, parentB: father.id, startDate: `${state.year}-${state.month}-${state.monthDay}`, duration, daysLeft: duration, riskLevel, outcome: "pending", complications: [] };
  const sev = calcSeverityLevel({ participants: 2, riskLevel, relationshipShift: 8 });
  logEvent(state, { type: "Childbirth", participants: [mother.id, father.id], outcome: "Success", severity: sev, effects: `Pregnancy started (${duration} days, risk ${riskLevel}).` });
  return true;
}

export function executeBirth(state, mother, father) {
  if (!mother?.pregnancy || !father || mother.status === "dead" || father.status === "dead") return;
  const risk = mother.pregnancy.riskLevel || "low";
  const failRoll = Math.random();
  const failThreshold = risk === "high" ? 0.22 : risk === "medium" ? 0.12 : 0.05;

  if (failRoll < failThreshold) {
    mother.pregnancy.outcome = "failed";
    mother.characterReputation = (mother.characterReputation || 0) - 1;
    father.characterReputation = (father.characterReputation || 0) - 1;
    createRelationship(state, mother.id, father.id, "strained", "pregnancy-loss", -10);
    const fam = state.familiesById[mother.familyId];
    if (fam) fam.reputation -= 1;
    logEvent(state, { type: "Childbirth", participants: [mother.id, father.id], outcome: "Failure", severity: calcSeverityLevel({ participants: 2, repImpact: -1, relationshipShift: -10, riskLevel: risk }), effects: "Pregnancy loss; relationship strain; family reputation -1." });
    return;
  }

  const child = { id: `c${Date.now()}${Math.floor(Math.random() * 1000)}`, firstName: `Child${state.characters.length + 1}`, gender: Math.random() > 0.5 ? "male" : "female", age: 0, familyId: mother.familyId, originFamilyId: mother.familyId, maritalStatus: "not-married", health: "Healthy", status: "alive", intelligence: inheritScalar(state, mother, father, "intelligence", 0, 10), personality: ["ambition", "jealousy", "charm", "morality", "intelligence", "socialHunger", "loyalty", "riskTolerance"].reduce((acc, key) => ({ ...acc, [key]: inheritScalar(state, mother, father, key, 0, 10) }), {}), characterReputation: 0, relationships: [], parents: [mother.id, father.id], looks: { hair: inheritFeature(state, mother, father, "hair"), eyes: inheritFeature(state, mother, father, "eyes"), eyeColor: inheritFeature(state, mother, father, "eyeColor"), skin: inheritFeature(state, mother, father, "skin"), faceType: inheritFeature(state, mother, father, "faceType"), nose: inheritFeature(state, mother, father, "nose") } };
  child.beautyBase = inheritScalar(state, mother, father, "beauty", 0, 10);
  child.beauty = computeBeauty(child);
  child.fertility = clamp(0.25 + Math.random() * 0.6, 0, 1);

  state.characters.push(child); state.charactersById[child.id] = child;
  const fam = state.familiesById[mother.familyId];
  let repDelta = child.gender === "male" ? 2 : 1;
  if (fam) { fam.reputation += repDelta; fam.children = fam.children || []; fam.children.push(child.id); }
  createRelationship(state, mother.id, father.id, "bonded", "childbirth", 15);
  logEvent(state, { type: "Childbirth", participants: [mother.id, father.id, child.id], outcome: "Success", severity: calcSeverityLevel({ participants: 3, repImpact: repDelta, relationshipShift: 15, riskLevel: risk }), effects: `Child created (${child.firstName}, ${child.gender}); family reputation +${repDelta}.` });
}

export function updateRelationshipState(state) { state.characters.forEach((c) => { c.relationships = (c.relationships || []).map((r) => ({ ...r, strength: clamp((r.strength ?? 0) + (Math.random() > 0.5 ? 1 : -1), -100, 100) })); }); }

function executeDeath(state, character) {
  character.status = "dead";
  for (const c of state.characters) {
    if (c.spouseId === character.id) {
      c.spouseId = null;
      c.maritalStatus = "widowed";
      c.relationships = (c.relationships || []).map((r) => r.targetId === character.id ? { ...r, type: "deceased spouse", originReason: "death" } : r);
      c.characterReputation = (c.characterReputation || 0) - 1;
      addMemory(c, `Lost spouse ${character.firstName}`);
    }
  }
  character.spouseId = null;
  character.maritalStatus = "deceased";
  addMemory(character, "Died suddenly");
  logEvent(state, { type: "Death", participants: [character.id], outcome: "Success", severity: "high", effects: "Spouse statuses updated to widowed; marriage links removed." });
}

export function generateEvent(state) {
  const living = state.characters.filter((c) => c.status !== "dead" && c.age >= 10);
  if (living.length < 2) return;
  const category = randomFrom(EVENT_TYPES);
  const p1 = randomFrom(living);
  const p2 = living.find((c) => c.id !== p1.id && c.age >= 10);
  if (!p2) return;

  let outcome = randomFrom(EVENT_POOL[category]);
  const last = state.lastEventByPair?.[`${p1.id}:${p2.id}`];
  if (last === outcome) {
    const options = EVENT_POOL[category].filter((x) => x !== last);
    outcome = randomFrom(options.length ? options : EVENT_POOL[category]);
  }
  state.lastEventByPair = state.lastEventByPair || {};
  state.lastEventByPair[`${p1.id}:${p2.id}`] = outcome;

  if (category === "rare" && outcome === "sudden death") return executeDeath(state, p1);
  if (category === "rare" && outcome === "unexpected pregnancy") startPregnancy(state, p1, p2, "rare");

  const repDelta = category === "scandal" || category === "conflict" ? -3 : 2;
  const relationshipShift = category === "romantic" ? 12 : category === "conflict" ? -12 : 6;
  createRelationship(state, p1.id, p2.id, category === "romantic" ? "lover" : category === "conflict" ? "rival" : "friend", category, relationshipShift);
  if (state.familiesById[p1.familyId]) state.familiesById[p1.familyId].reputation += repDelta;
  if (state.familiesById[p2.familyId]) state.familiesById[p2.familyId].reputation += repDelta;
  addMemory(p1, `${category}: ${outcome} with ${p2.firstName}`);
  addMemory(p2, `${category}: ${outcome} with ${p1.firstName}`);
  logEvent(state, { type: category[0].toUpperCase() + category.slice(1), participants: [p1.id, p2.id], outcome: "Success", severity: calcSeverityLevel({ participants: 2, repImpact: repDelta, relationshipShift, riskLevel: category === "rare" ? "high" : category === "scandal" ? "medium" : "low" }), effects: `${outcome}; relationship and reputation updated.` });
}
