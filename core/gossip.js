export function propagateGossip(state) {
  const rumors = state.events.filter(e => /rumor|scandal|lover|engagement|cheating/i.test(e.text));
  if (!rumors.length || Math.random() < 0.4) return;
  const base = rumors[Math.floor(Math.random() * rumors.length)].text;
  const mutation = `${base} (now whispered across salons)`;
  state.feed.unshift({ text: mutation, type: "gossip" });
  for (const fam of state.families) fam.reputation = Math.max(0, fam.reputation - 0.4);
}
