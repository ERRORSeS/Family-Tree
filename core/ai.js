export function decideAction(state, character) {
  character.personality ??= { ambition: 5, loyalty: 5, jealousy: 5, charm: 5, morality: 5, intelligence: 5, socialHunger: 5, riskTolerance: 5 };
  const p = character.personality;
  const rep = character.characterReputation ?? 0;
  const relCount = (character.relationships || []).length;
  const score = p.ambition + p.socialHunger + p.riskTolerance + relCount + Math.max(0, rep / 20) - p.morality;
  if (score > 20) return "pursuing status";
  if (p.jealousy > 7) return "spreading gossip";
  if (rep < -20) return "repairing reputation";
  return "social visit";
}
