import { decideAction } from "./ai.js";
import { propagateGossip } from "./gossip.js";
import { recalculateReputation } from "./reputation.js";
import { executeBirth, logEvent, generateEvent, updateRelationshipState } from "./events.js";

function processPregnancies(state) {
  const due = [];
  for (const c of state.characters) {
    if (c.status === "dead" || !c.pregnancy) continue;
    c.pregnancy.daysLeft -= 1;
    if (c.pregnancy.daysLeft <= 0) due.push(c);
  }
  due.forEach((mother) => {
    const father = state.charactersById[mother.pregnancy.fatherId];
    executeBirth(state, mother, father);
    mother.pregnancy = null;
  });
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
    generateEvent(state);
    updateRelationshipState(state);
    propagateGossip(state);
    logEvent(state, "Daily cycle: visits, gossip spread, and subtle relationship shifts.", "daily");
  }
  if (scope === "month") {
    recalculateReputation(state);
    logEvent(state, "Monthly cycle: reputation recalculation, romance progression, pregnancy checks.", "monthly");
  }
  if (scope === "year") {
    state.characters.forEach((c) => c.age += 1);
    recalculateReputation(state);
    logEvent(state, "Yearly cycle: aging, inheritance updates, marriage market refresh.", "yearly");
  }
}
