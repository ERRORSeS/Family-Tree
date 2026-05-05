export function recalculateReputation(state) {
  for (const fam of state.families) {
    const members = state.characters.filter(c => c.familyId === fam.id && c.health !== "Deceased");
    const stability = members.filter(c => c.maritalStatus === "married").length;
    fam.reputation = Math.max(0, Math.min(100, fam.reputation + stability * 0.2 - fam.scandal * 0.03));
    fam.status = fam.reputation > 70 ? "Rising" : fam.reputation < 45 ? "Declining" : "Stable";
  }
  state.globalReputation = Math.round(state.families.reduce((a,f) => a + f.reputation, 0) / state.families.length);
}
