export function logEvent(state, text, type = "event") {
  const entry = { text, type, time: `${state.year} ${state.phase}` };
  state.events.unshift(entry);
  state.feed.unshift(entry);
  state.events = state.events.slice(0, 120);
  state.feed = state.feed.slice(0, 60);
}
