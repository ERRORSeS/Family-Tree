export function spreadGossip(state, event) {
  if (!event || Math.random() < 0.35) return;
  const variants = ["embellished", "contradicted", "repeated", "weaponized"];
  const v = variants[Math.floor(Math.random() * variants.length)];
  state.feed.unshift({ text: `Rumor ${v}: ${event.text}`, type: "gossip", time: event.time });
  state.families.forEach((f) => { f.gossipLevel = (f.gossipLevel || 0) + 1; });
}

export function propagateGossip(state) {
  const latest = state.events[0];
  spreadGossip(state, latest);
}
