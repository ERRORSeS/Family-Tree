import { computeBeauty, inheritFeature, inheritScalar } from "./genetics.js";

const EVENT_TYPES = ["social", "romantic", "conflict", "family", "scandal", "rare"];
const EVENT_POOL = {
  social: ["bonding moment", "awkward interaction", "supportive gesture", "public disagreement"],
  romantic: ["mutual attraction", "one-sided interest", "rejection", "jealousy triggered", "awkward interaction"],
  conflict: ["argument", "rivalry escalation", "public embarrassment"],
  family: ["inheritance tension", "parental pressure", "sibling rivalry"],
  scandal: ["affair discovered", "rumor spread", "reputation collapse"],
  rare: ["sudden death", "unexpected pregnancy", "dramatic breakup", "inheritance shock"]
};

const RELATIONSHIP_MAP = {
  social: ["Friendly", "Close", "Protective"],
  romantic: ["Romantic Interest", "Secret Attraction", "Obsessed"],
  conflict: ["Suspicious", "Rival", "Enemy"],
  family: ["Protective", "Close", "Suspicious"],
  scandal: ["Suspicious", "Rival", "Enemy"],
  rare: ["Close", "Rival", "Protective"]
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const eventTypeLabel = (type) => type.toUpperCase().replace(/_/g, " ");
const isCloseRelative = (a, b) => {
  const aParents = new Set(a?.parents || []);
  const bParents = new Set(b?.parents || []);
  if ([...aParents].some((p) => bParents.has(p))) return true;
  if (aParents.has(b?.id) || bParents.has(a?.id)) return true;
  return false;
};

function calcPriority({ participants = 2, repImpact = 0, relationshipShift = 0, riskLevel = "low" } = {}) {
  let score = 0;
  score += participants >= 3 ? 2 : participants >= 2 ? 1 : 0;
  score += Math.abs(repImpact) >= 6 ? 2 : Math.abs(repImpact) >= 2 ? 1 : 0;
  score += Math.abs(relationshipShift) >= 20 ? 2 : Math.abs(relationshipShift) >= 8 ? 1 : 0;
  score += riskLevel === "high" ? 2 : riskLevel === "medium" ? 1 : 0;
  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

function toSeverity(priority) {
  return priority[0].toUpperCase() + priority.slice(1);
}

function formatEventEntry({ type, severity, who, whatHappened, resultLines }) {
  const compactResults = resultLines.slice(0, 2).join("; ");
  return {
    fullText: `${eventTypeLabel(type)} — ${severity}\nWho: ${who.join(", ")}\nWhat Happened: ${whatHappened}\nResult: ${compactResults}`,
    shortText: `${eventTypeLabel(type)} — ${severity} | ${whatHappened} | ${compactResults}`
  };
}

function buildEvent(state, { type = "event", participants = [], priority = "low", whatHappened = "Update occurred", resultLines = [], outcome = "Success", visibility = "public" }) {
  const who = participants.map((id) => state.charactersById[id]?.firstName || "Unknown");
  const severity = toSeverity(priority);
  const formatted = formatEventEntry({ type, severity, who, whatHappened, resultLines });
  return {
    type,
    participants,
    who,
    outcome,
    priority,
    severity,
    visibility,
    whatHappened,
    resultLines,
    text: priority === "high" ? formatted.fullText : formatted.shortText,
    shortText: formatted.shortText,
    fullText: formatted.fullText,
    time: `Y${state.year} M${state.month} D${state.monthDay}`
  };
}

export function pushEvent(state, event) {
  state.events.unshift(event);
  state.events = state.events.slice(0, 500);
}

export function flushVisibleEvents(state) {
  const cap = state.maxVisibleEventsPerDay || 3;
  const pending = state.pendingVisibleEvents || [];
  const ranked = ["high", "medium"].flatMap((priority) => pending.filter((e) => e.priority === priority));
  state.feed = [...ranked.slice(0, cap), ...(state.feed || [])].slice(0, 120);
  state.pendingVisibleEvents = [];
}

export function logEvent(state, payload) {
  const event = buildEvent(state, payload);
  pushEvent(state, event);
  if (event.priority !== "low" && event.resultLines?.length) {
    state.pendingVisibleEvents = state.pendingVisibleEvents || [];
    state.pendingVisibleEvents.push(event);
  }
}

function addMemory(character, memory) {
  character.memoryLog = character.memoryLog || [];
  character.memoryLog.unshift(memory);
  character.memoryLog = character.memoryLog.slice(0, 30);
}

function createRelationship(state, aId, bId, type, reason, strengthDelta = 5, visibility = "public", traitDelta = {}) {
  const a = state.charactersById[aId]; const b = state.charactersById[bId];
  if (!a || !b || a.status === "dead" || b.status === "dead") return;
  for (const [src, tgt] of [[a, b], [b, a]]) {
    const current = (src.relationships || []).find((r) => r.targetId === tgt.id);
    const updatedStrength = clamp((current?.strength || 0) + strengthDelta, -100, 100);
    const updatedAttraction = clamp((current?.attraction || 0) + (traitDelta.attraction ?? 0), -100, 100);
    const updatedTrust = clamp((current?.trust ?? 50) + (traitDelta.trust ?? 0), 0, 100);
    const updatedFamiliarity = clamp((current?.familiarity ?? 10) + (traitDelta.familiarity ?? 0), 0, 100);
    src.relationships = (src.relationships || []).filter((r) => r.targetId !== tgt.id);
    src.relationships.push({ targetId: tgt.id, type, strength: updatedStrength, attraction: updatedAttraction, trust: updatedTrust, familiarity: updatedFamiliarity, visibility, originReason: reason });
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
  const ageFactor = (person) => {
    const age = person.age || 18;
    if (age < 18 || age > 50) return 0.35;
    if (age <= 35) return 1;
    return clamp(1 - ((age - 35) * 0.045), 0.45, 1);
  };
  const ageChance = (ageFactor(parentA) + ageFactor(parentB)) / 2;
  return clamp(((fertilityOf(parentA) + fertilityOf(parentB)) / 2 + relationship * 0.35 + health * 0.15 - scandalPenalty) * ageChance, 0.02, 0.95);
}

function pregnancyRisk(parentA, parentB) {
  const avgAge = ((parentA.age || 18) + (parentB.age || 18)) / 2;
  const unhealthy = [parentA.health, parentB.health].filter((h) => h !== "Healthy").length;
  if (avgAge > 40 || unhealthy === 2) return "high";
  if (avgAge > 33 || unhealthy === 1) return "medium";
  return "low";
}

export function startPregnancy(state, parentA, parentB, via = "ai") {
  return attemptChild(state, parentA, parentB, via);
}

export function attemptChild(state, parentA, parentB, via = "ai") {
  if (!parentA || !parentB || parentA.status === "dead" || parentB.status === "dead") return false;
  if (parentA.gender === parentB.gender) return false;
  const mother = parentA.gender === "female" ? parentA : parentB.gender === "female" ? parentB : null;
  const father = mother?.id === parentA.id ? parentB : parentA;
  if (!mother || !father || mother.pregnancy) return false;
  if (mother.spouseId !== father.id || father.spouseId !== mother.id) return false;
  const family = state.familiesById[mother.familyId];
  const chance = conceptionChance(mother, father, family);
  const relationshipShift = Math.random() < 0.8 ? 2 : -2;
  createRelationship(state, mother.id, father.id, relationshipShift > 0 ? "Romantic Interest" : "Suspicious", "child-attempt", relationshipShift, "private");
  if (Math.random() >= chance) {
    logEvent(state, {
      type: "child attempt",
      participants: [mother.id, father.id],
      priority: "medium",
      whatHappened: `${mother.firstName} tried for a child with ${father.firstName}`,
      resultLines: ["Outcome: Failure (no pregnancy)", `Relationship ${relationshipShift >= 0 ? "improved" : "worsened"} (${relationshipShift >= 0 ? "+" : ""}${relationshipShift})`],
      outcome: "Failure",
      visibility: via === "ai" ? "private" : "public"
    });
    return false;
  }
  const monthsRemaining = 9 + Math.floor(Math.random() * 2);
  const daysRemaining = Math.floor(Math.random() * 31);
  const riskLevel = pregnancyRisk(mother, father);
  mother.pregnancy = { parentA: mother.id, parentB: father.id, startDate: `${state.year}-${state.month}-${state.monthDay}`, monthsRemaining, daysRemaining, riskLevel, status: "active", outcome: "pending", complications: [] };
  state.pregnancies = state.pregnancies || [];
  state.pregnancies.push(mother.pregnancy);
  logEvent(state, {
    type: "child attempt",
    participants: [mother.id, father.id],
    priority: "medium",
    whatHappened: `${mother.firstName} tried for a child with ${father.firstName}`,
    resultLines: [`Outcome: Success (pregnancy started, ${riskLevel} risk)`, `Relationship ${relationshipShift >= 0 ? "improved" : "worsened"} (${relationshipShift >= 0 ? "+" : ""}${relationshipShift})`],
    outcome: "Success",
    visibility: via === "ai" ? "private" : "public"
  });
  return true;
}

export function executeBirth(state, mother, father) {
  return completePregnancy(state, mother?.pregnancy, mother, father);
}

export function completePregnancy(state, pregnancy, mother, father) {
  if (!mother?.pregnancy || !father || mother.status === "dead" || father.status === "dead") return;
  const risk = pregnancy?.riskLevel || "low";
  const failThreshold = risk === "high" ? 0.1 : risk === "medium" ? 0.05 : 0.02;
  if (Math.random() < failThreshold) {
    createRelationship(state, mother.id, father.id, "Suspicious", "pregnancy-loss", -10, "private");
    const fam = state.familiesById[mother.familyId]; if (fam) fam.reputation -= 1;
    logEvent(state, { type: "birth", participants: [mother.id, father.id], priority: "high", whatHappened: "Pregnancy failed.", resultLines: ["Outcome: No child", "Relationship strain and minor reputation impact"], outcome: "Failure" });
    mother.pregnancy = null;
    if (state.pregnancies) state.pregnancies = state.pregnancies.filter((p) => p !== pregnancy);
    return;
  }
  const child = { id: `c${Date.now()}${Math.floor(Math.random() * 1000)}`, firstName: `Child${state.characters.length + 1}`, gender: Math.random() > 0.5 ? "male" : "female", age: 0, familyId: mother.familyId, originFamilyId: mother.familyId, maritalStatus: "not-married", health: "Healthy", status: "alive", intelligence: inheritScalar(state, mother, father, "intelligence", 0, 10), personality: ["ambition", "jealousy", "charm", "morality", "intelligence", "socialHunger", "loyalty", "riskTolerance"].reduce((acc, key) => ({ ...acc, [key]: inheritScalar(state, mother, father, key, 0, 10) }), {}), characterReputation: 0, relationships: [], parents: [mother.id, father.id], looks: { hair: inheritFeature(state, mother, father, "hair"), eyes: inheritFeature(state, mother, father, "eyes"), eyeColor: inheritFeature(state, mother, father, "eyeColor"), skin: inheritFeature(state, mother, father, "skin"), faceType: inheritFeature(state, mother, father, "faceType"), nose: inheritFeature(state, mother, father, "nose") } };
  child.beautyBase = inheritScalar(state, mother, father, "beauty", 0, 10); child.beauty = computeBeauty(child); child.fertility = clamp(0.25 + Math.random() * 0.6, 0, 1);
  state.characters.push(child); state.charactersById[child.id] = child;
  const fam = state.familiesById[mother.familyId]; const repDelta = child.gender === "male" ? 2 : 1;
  if (fam) { fam.reputation += repDelta; fam.children = fam.children || []; fam.children.push(child.id); }
  const marriedBirth = mother.spouseId === father.id && father.spouseId === mother.id;
  if (marriedBirth) {
    mother.characterReputation = (mother.characterReputation ?? 0) + 2;
    father.characterReputation = (father.characterReputation ?? 0) + 2;
  } else {
    mother.characterReputation = (mother.characterReputation ?? 0) - 12;
    father.characterReputation = (father.characterReputation ?? 0) - 12;
    if (fam) fam.reputation -= 10;
    logEvent(state, { type: "scandal", participants: [mother.id, father.id], priority: "high", whatHappened: "A child was born outside of marriage.", resultLines: ["Severe reputation damage", "Gossip spread widely", "Future marriage prospects reduced"], outcome: "Success", visibility: "public" });
  }
  createRelationship(state, mother.id, father.id, "Protective", "childbirth", 15);
  createRelationship(state, mother.id, child.id, "Protective", "parent-child", 35);
  createRelationship(state, father.id, child.id, "Protective", "parent-child", 35);
  logEvent(state, { type: "birth", participants: [mother.id, father.id, child.id], priority: "high", whatHappened: "A child was born.", resultLines: ["Outcome: Successful birth", "New child added to family"], outcome: "Success" });
  mother.pregnancy = null;
  if (state.pregnancies) state.pregnancies = state.pregnancies.filter((p) => p !== pregnancy);
}

export function updateRelationshipState(state) {
  state.characters.forEach((c) => {
    c.relationships = (c.relationships || []).map((r) => ({
      ...r,
      strength: clamp((r.strength ?? 0) + (Math.random() > 0.5 ? 1 : -1), -100, 100),
      trust: clamp((r.trust ?? 50) + (Math.random() > 0.55 ? 1 : -1), 0, 100),
      familiarity: clamp((r.familiarity ?? 10) + 1, 0, 100),
      attraction: clamp((r.attraction ?? 0) + (Math.random() > 0.75 ? 1 : 0), -100, 100)
    }));
  });
}

function executeDeath(state, character) {
  character.status = "dead";
  for (const c of state.characters) {
    if (c.spouseId === character.id) {
      c.spouseId = null; c.maritalStatus = "widowed";
      c.relationships = (c.relationships || []).map((r) => r.targetId === character.id ? { ...r, type: "Enemy", originReason: "death" } : r);
    }
  }
  character.spouseId = null; character.maritalStatus = "deceased";
  logEvent(state, { type: "death", participants: [character.id], priority: "high", whatHappened: `${character.firstName} died unexpectedly.`, resultLines: ["New status: deceased", "Spouses become widowed"], outcome: "Success" });
}

function maybeTriggerHealthDecline(state, character) {
  if (character.status === "dead") return false;
  const ageRisk = character.age >= 50 ? Math.min(0.015 + ((character.age - 50) * 0.0012), 0.07) : 0;
  const healthRisk = character.health === "Critical" ? 0.02 : character.health === "Ill" ? 0.008 : character.health === "Dying" ? 0.05 : 0;
  if (Math.random() >= ageRisk + healthRisk) return false;
  character.healthDecline = true;
  logEvent(state, { type: "health decline", participants: [character.id], priority: "medium", whatHappened: "Their health has worsened.", resultLines: ["Increased risk of death"], outcome: "Success" });
  return true;
}

export function generateEvent(state) {
  const living = state.characters.filter((c) => c.status !== "dead" && c.age >= 10);
  if (living.length < 2) return;
  if (living.length) {
    const candidate = randomFrom(living);
    maybeTriggerHealthDecline(state, candidate);
    const declineFactor = candidate.healthDecline ? 1 : 0;
    const deathRisk = (candidate.age >= 50 ? Math.min(0.0008 + ((candidate.age - 50) * 0.0003), 0.012) : 0.0001) + (candidate.health === "Dying" ? 0.015 : candidate.health === "Critical" ? 0.006 : 0) + (declineFactor * 0.004);
    if (Math.random() < deathRisk) return executeDeath(state, candidate);
  }
  const category = randomFrom(EVENT_TYPES);
  const p1 = randomFrom(living);
  const pool = living.filter((c) => c.id !== p1.id);
  const weighted = pool.sort((a, b) => (((p1.relationships || []).find((r) => r.targetId === b.id)?.strength || 0) - (((p1.relationships || []).find((r) => r.targetId === a.id)?.strength || 0))));
  const p2 = Math.random() < 0.6 ? weighted[0] : randomFrom(pool);
  if (!p2) return;
  const sameGenderPair = p1.gender === p2.gender;

  let outcome = randomFrom(EVENT_POOL[category]);
  if (sameGenderPair && category === "romantic") outcome = "awkward interaction";
  const key = `${p1.id}:${p2.id}:${category}`;
  const last = state.lastEventByPair?.[key];
  if (last === outcome) {
    const options = EVENT_POOL[category].filter((x) => x !== last);
    outcome = randomFrom(options.length ? options : EVENT_POOL[category]);
  }
  state.lastEventByPair = state.lastEventByPair || {}; state.lastEventByPair[key] = outcome;

  if (category === "rare" && outcome === "sudden death") return executeDeath(state, p1);
  if (category === "rare" && outcome === "unexpected pregnancy" && p1.gender !== p2.gender && !isCloseRelative(p1, p2)) startPregnancy(state, p1, p2, "rare");

  const repDelta = category === "scandal" || category === "conflict" ? -3 : 2;
  const relationshipShift = category === "romantic" ? 12 : category === "conflict" ? -12 : 6;
  const visibility = category === "romantic" && outcome.includes("secret") ? "secret" : "public";
  const blockedRomance = category === "romantic" && (sameGenderPair || isCloseRelative(p1, p2));
  const relationType = blockedRomance ? "Friendly" : randomFrom(RELATIONSHIP_MAP[category] || ["Friendly"]);
  if (blockedRomance) {
    outcome = "awkward interaction";
  }
  createRelationship(state, p1.id, p2.id, relationType, `${category}:${outcome}`, relationshipShift, visibility);
  if (state.familiesById[p1.familyId]) state.familiesById[p1.familyId].reputation += repDelta;
  if (state.familiesById[p2.familyId]) state.familiesById[p2.familyId].reputation += repDelta;

  const priority = calcPriority({ participants: 2, repImpact: repDelta, relationshipShift, riskLevel: category === "rare" ? "high" : category === "scandal" ? "medium" : "low" });
  const mergedWhat = category === "social" ? "Spent time together socially." : `${eventTypeLabel(category)} variation: ${outcome}.`;
  const result = [
    `Relationship ${relationshipShift >= 0 ? "improved" : "worsened"} (${relationshipShift >= 0 ? "+" : ""}${relationshipShift})`,
    `Family reputation ${repDelta >= 0 ? "+" : ""}${repDelta}`,
    `Relationship type: ${relationType} (${visibility})`
  ];

  addMemory(p1, `${category}: ${outcome} with ${p2.firstName}`);
  addMemory(p2, `${category}: ${outcome} with ${p1.firstName}`);
  logEvent(state, { type: category, participants: [p1.id, p2.id], priority, whatHappened: mergedWhat, resultLines: result, outcome: "Success", visibility });
}
