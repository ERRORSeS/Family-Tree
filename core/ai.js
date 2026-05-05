const actions = ["attending ball", "visiting family", "writing letter", "meeting lover", "gossiping", "resting", "recovering illness", "pursuing suitor", "rejecting suitor", "managing estate", "attending tea"];

export function ensurePersonality(character) {
  character.personality ??= {
    ambition: character.ambition ?? 5,
    loyalty: 5,
    jealousy: 5,
    charm: 5,
    morality: 5,
    socialHunger: 5,
    riskTolerance: 5
  };
}

export function decideAction(state, character) {
  ensurePersonality(character);
  if (["Critical", "Dying", "Ill"].includes(character.health)) return "recovering illness";
  const p = character.personality;
  const scandalRisk = character.flags?.scandalRisk ?? 0;
  const reputationDanger = Math.max(0, 50 - (state.familiesById[character.familyId]?.reputation ?? 50));
  const relationshipInfluence = (character.relationships || []).length;
  const familyPressure = state.familiesById[character.familyId]?.marriagePressure ?? 0;
  const decisionScore = p.ambition + p.socialHunger + p.riskTolerance + relationshipInfluence + familyPressure - scandalRisk - reputationDanger;

  if (decisionScore > 20) return character.genderRole === "male" ? "managing estate" : "attending tea";
  if (p.jealousy >= 8) return "gossiping";
  if (p.morality >= 8) return "visiting family";
  return actions[Math.floor(Math.random() * actions.length)];
}
