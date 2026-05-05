const types = ["Ball", "Visit", "Wedding", "Birth", "Death", "Scandal", "Affair Exposed", "Inheritance Dispute", "Rival Confrontation", "Social Promotion"];

export function logEvent(state, text, type = "event", participants = []) {
  const entry = { text, type, participants, time: `Y${state.year} M${state.month} D${state.monthDay}` };
  state.events.unshift(entry);
  state.feed.unshift(entry);
  state.events = state.events.slice(0, 300);
  state.feed = state.feed.slice(0, 120);
}

export function generateEvent(state) {
  if (state.characters.length < 2) return;
  const type = types[Math.floor(Math.random() * types.length)];
  const p1 = state.characters[Math.floor(Math.random() * state.characters.length)];
  const p2 = state.characters.find((c) => c.id !== p1.id) || p1;
  const delta = Math.random() > 0.5 ? 2 : -2;
  p1.characterReputation = Math.max(-100, Math.min(100, (p1.characterReputation || 0) + delta));
  const fam = state.familiesById[p1.familyId]; if (fam) fam.reputation += delta > 0 ? 1 : -1;
  logEvent(state, `${type}: ${p1.firstName} and ${p2.firstName} shifted social standing (${delta > 0 ? "+" : ""}${delta}).`, type.toLowerCase(), [p1.id, p2.id]);
}
