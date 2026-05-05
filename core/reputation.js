export function recalculateReputation(state) {
  for (const fam of state.families) {
    const members = state.characters.filter((c) => c.familyId === fam.id);
    const avgCharRep = members.length ? members.reduce((a, c) => a + (c.characterReputation || 0), 0) / members.length : 0;
    fam.reputation = Math.max(-100, Math.min(100, fam.reputation + avgCharRep * 0.05 - fam.scandal * 0.1));
  }
  state.globalReputation = state.families.length ? Math.round(state.families.reduce((a, f) => a + f.reputation, 0) / state.families.length) : 0;
}
