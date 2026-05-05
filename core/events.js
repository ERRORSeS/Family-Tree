export function logEvent(state, text, type = "event", participants = []) {
  const entry = {
    text,
    type,
    participants,
    time: `Year ${state.year}, Month ${state.month}, Day ${state.monthDay} • ${state.phase}`
  };
  state.events.unshift(entry);
  state.feed.unshift(entry);
  state.events = state.events.slice(0, 180);
  state.feed = state.feed.slice(0, 90);
}

export function majorEvent(state, type, location, participants, updates = []) {
  const people = participants.map((c) => `- ${c.displayName} (${c.maritalStatus})`).join("\n");
  const changes = updates.map((u) => `- ${u}`).join("\n");
  const text = `${type.toUpperCase()} EVENT: ${location}\n\nParticipants:\n${people}\n\nRelationships updated:\n${changes || "- none"}`;
  logEvent(state, text, type.toLowerCase(), participants.map((c) => c.id));
}
