import { advancePhase } from "../systems/time.js";
import { decideAction, ensurePersonality } from "./ai.js";
import { propagateGossip } from "./gossip.js";
import { recalculateReputation } from "./reputation.js";
import { logEvent, majorEvent } from "./events.js";
import { resolveMarriages } from "../systems/marriage.js";
import { updateHealth } from "../systems/health.js";
import { maybeTriggerScandal } from "../systems/scandal.js";

export function tickSimulation(state, units = 1) {
  state.cycleFlags = { monthly: false, yearly: false };
  advancePhase(state, units);
  for (const c of state.characters) {
    ensurePersonality(c);
    updateHealth(c);
    c.currentActivity = decideAction(state, c);
    c.flags ??= {};
    c.flags.scandalRisk = Math.max(0, c.personality.jealousy + c.personality.riskTolerance - c.personality.morality);
    const scandal = maybeTriggerScandal(state, c);
    if (scandal) logEvent(state, scandal, "scandal", [c.id]);
  }

  const marriage = resolveMarriages(state);
  if (marriage) logEvent(state, marriage, "marriage");
  propagateGossip(state);

  if (state.cycleFlags.monthly) {
    recalculateReputation(state);
    logEvent(state, "Monthly cycle: reputations recalculated, romance progressed, pregnancy checks processed.", "monthly");
  }
  if (state.cycleFlags.yearly) {
    state.characters.forEach((c) => { c.age += 1; });
    logEvent(state, "Yearly cycle: aging, inheritance updates, marriage market refresh, scandal resolution pass.", "yearly");
    const attendees = state.characters.slice(0, 3);
    if (attendees.length) majorEvent(state, "Ball", "Grand Society Hall", attendees, ["Attraction shifts", "Rivalry pressure adjusted"]);
  }

  logEvent(state, `The ${state.phase.toLowerCase()} passes with ${state.characters.length} nobles in motion.`, "tick");
}
