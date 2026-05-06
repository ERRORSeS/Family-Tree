const ACTIONS = ["attend event", "pursue relationship", "gossip", "attempt affair", "avoid others", "strengthen bonds"];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function attractionScore(character, target) {
  const beautyDiff = 10 - Math.abs((character.beauty ?? 5) - (target.beauty ?? 5));
  const charmFactor = (character.personality?.charm ?? 5) + (target.personality?.charm ?? 5);
  const intelMatch = 10 - Math.abs((character.intelligence ?? 5) - (target.intelligence ?? 5));
  const moralityMatch = 10 - Math.abs((character.personality?.morality ?? 5) - (target.personality?.morality ?? 5));
  const ambitionMatch = 10 - Math.abs((character.personality?.ambition ?? 5) - (target.personality?.ambition ?? 5));
  const rankPenalty = Math.abs((character.socialRank ?? 5) - (target.socialRank ?? 5));
  const interactions = (character.relationships || []).find((r) => r.targetId === target.id)?.strength ?? 0;
  return clamp(Math.round((beautyDiff * 2) + charmFactor + intelMatch + moralityMatch + ambitionMatch + interactions - rankPenalty * 3 - 40), -100, 100);
}

export function decideAction(state, character) {
  character.personality ??= { ambition: 5, loyalty: 5, jealousy: 5, charm: 5, morality: 5, intelligence: 5, socialHunger: 5, riskTolerance: 5 };
  if (character.status === "dead" || character.age < 10) return "inactive";
  const livingTargets = state.characters.filter((c) => c.id !== character.id && c.status !== "dead" && c.age >= 10);
  const topAttraction = livingTargets.reduce((best, target) => Math.max(best, attractionScore(character, target)), -100);
  const reputationRisk = Math.max(0, -(character.characterReputation ?? 0));
  const socialPressure = (character.personality.socialHunger ?? 5) + ((character.relationships || []).length / 2);

  const scores = {
    "attend event": socialPressure + (character.personality.charm ?? 5) + (character.personality.ambition ?? 5) - reputationRisk * 0.2,
    "pursue relationship": topAttraction + (character.personality.loyalty ?? 5) + (character.personality.charm ?? 5),
    "gossip": (character.personality.jealousy ?? 5) + (character.personality.socialHunger ?? 5) + (character.personality.riskTolerance ?? 5) - (character.personality.morality ?? 5),
    "attempt affair": topAttraction + (character.personality.riskTolerance ?? 5) - (character.personality.loyalty ?? 5) - (character.personality.morality ?? 5),
    "avoid others": (10 - (character.personality.socialHunger ?? 5)) + reputationRisk * 0.4,
    "strengthen bonds": (character.personality.loyalty ?? 5) + (character.personality.morality ?? 5) + ((character.relationships || []).length > 0 ? 5 : 0)
  };

  return ACTIONS.reduce((best, action) => (scores[action] > scores[best] ? action : best), ACTIONS[0]);
}
