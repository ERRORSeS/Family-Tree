export function maybeTriggerScandal(state, character) {
  if (character.currentActivity === "meeting lover" && Math.random() < 0.2) {
    const fam = state.familiesById[character.familyId];
    fam.scandal = Math.min(100, fam.scandal + 10);
    fam.reputation = Math.max(0, fam.reputation - 3);
    return `${character.displayName} was seen in a secret meeting. Scandal erupts.`;
  }
  return null;
}
