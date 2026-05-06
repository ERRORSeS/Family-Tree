import { decideAction } from "./ai.js";
import { propagateGossip } from "./gossip.js";
import { recalculateReputation } from "./reputation.js";
import { executeBirth, logEvent, generateEvent, updateRelationshipState, startPregnancy, flushVisibleEvents } from "./events.js";

function processPregnancies(state) {
  const due = [];
  for (const c of state.characters) {
    if (c.status === "dead" || !c.pregnancy) continue;
    c.pregnancy.daysLeft -= 1;
    if (Math.random() < 0.02 && c.pregnancy.riskLevel !== "low") c.pregnancy.complications.push("complication");
    if (c.pregnancy.daysLeft <= 0) due.push(c);
  }
  due.forEach((mother) => {
    const father = state.charactersById[mother.pregnancy.parentB];
    executeBirth(state, mother, father);
    mother.pregnancy = null;
  });
}

function runAutonomousActions(state) {
  const adults = state.characters.filter((c) => c.status !== "dead" && c.age >= 16);
  for (const c of adults) {
    const candidates = adults.filter((x) => x.id !== c.id);
    if (!candidates.length) continue;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const attraction = c.attractionScores?.[target.id] ?? Math.floor(Math.random() * 100);
    const loyalty = c.personality?.loyalty ?? 5;
    const compatibleMarriage = c.gender && target.gender && c.gender !== target.gender;
    if (compatibleMarriage && !c.spouseId && !target.spouseId && attraction > 75 && Math.random() < 0.08) {
      c.spouseId = target.id; target.spouseId = c.id; c.maritalStatus = "married"; target.maritalStatus = "married";
      logEvent(state, { type: "marriage", participants: [c.id, target.id], priority: "medium", outcome: "Success", whatHappened: "Marriage formed.", resultLines: ["New status: married"] });
      continue;
    }
    if (c.spouseId && (loyalty < 3 || (c.personality?.jealousy ?? 5) > 8) && Math.random() < 0.04) {
      const spouse = state.charactersById[c.spouseId];
      if (spouse) { c.spouseId = null; spouse.spouseId = null; c.maritalStatus = "not-married"; spouse.maritalStatus = "not-married";
        logEvent(state, { type: "divorce", participants: [c.id, spouse.id], priority: "high", outcome: "Success", whatHappened: "Marriage dissolved.", resultLines: ["New status: not-married", "Relationship reset"] }); }
      continue;
    }
    if (Math.random() < 0.07) startPregnancy(state, c, target, "ai");
  }
}

export function advanceDay(state) {
  state.monthDay += 1;
  if (state.monthDay > 30) { state.monthDay = 1; state.month += 1; advanceMonth(state, true); return; }
  tickSimulation(state, "day");
}

export function advanceMonth(state, fromDay = false) {
  if (!fromDay) { state.month += 1; if (state.month > 12) { state.month = 1; state.year += 1; advanceYear(state, true); return; } }
  tickSimulation(state, "month");
}

export function advanceYear(state, fromMonth = false) {
  if (!fromMonth) state.year += 1;
  tickSimulation(state, "year");
}

export function tickSimulation(state, scope = "day") {
  for (const c of state.characters) {
    if (c.age < 10) { c.currentActivity = "inactive (child)"; continue; }
    c.currentActivity = decideAction(state, c);
  }
  if (scope === "day") {
    processPregnancies(state);
    runAutonomousActions(state);
    generateEvent(state);
    updateRelationshipState(state);
    propagateGossip(state);
    flushVisibleEvents(state);
  }
  if (scope === "month") {
    recalculateReputation(state);

  }
  if (scope === "year") {
    state.characters.forEach((c) => c.age += 1);
    recalculateReputation(state);
logEvent(state, { type: "simulation", priority: "medium", outcome: "Success", whatHappened: "Yearly social cycle completed.", resultLines: ["All characters aged +1", "Reputation recalculated"] });
    flushVisibleEvents(state);
  }
}
