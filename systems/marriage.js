export function resolveMarriages(state) {
  const singles = state.characters.filter(c => c.age >= 16 && c.maritalStatus === "unmarried" && c.health !== "Deceased");
  if (singles.length < 2 || Math.random() < 0.6) return null;
  const a = singles[Math.floor(Math.random() * singles.length)];
  const b = singles.find(x => x.id !== a.id && x.gender !== a.gender);
  if (!b) return null;
  a.maritalStatus = "married";
  b.maritalStatus = "married";
  state.relationships.push({ a: a.id, b: b.id, type: "Married" });
  return `${a.displayName} and ${b.displayName} announced a marriage contract.`;
}
