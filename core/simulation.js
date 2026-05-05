import { advanceTime } from "../systems/time.js";
import { decideAction } from "./ai.js";
import { propagateGossip } from "./gossip.js";
import { recalculateReputation } from "./reputation.js";
import { logEvent } from "./events.js";
import { resolveMarriages } from "../systems/marriage.js";
import { updateHealth } from "../systems/health.js";
import { maybeTriggerScandal } from "../systems/scandal.js";

export function tickSimulation(state) {
  advanceTime(state);
  for (const c of state.characters) {
    updateHealth(c);
    c.currentActivity = decideAction(c);
    const scandal = maybeTriggerScandal(state, c);
    if (scandal) logEvent(state, scandal, "scandal");
  }
  const marriage = resolveMarriages(state);
  if (marriage) logEvent(state, marriage, "marriage");
  propagateGossip(state);
  recalculateReputation(state);
  logEvent(state, `The ${state.phase.toLowerCase()} passes with ${state.characters.length} nobles in motion.`, "tick");
}
