export function propagateGossip(state) {
  const rumors = state.events.filter(e => /rumor|scandal|lover|engagement|cheating|divorce|affair/i.test(e.text));
  if (!rumors.length) return;
  const base = rumors[Math.floor(Math.random() * rumors.length)].text;
  const mutationBits = ["now whispered in salons", "retold at tea", "denied by witnesses", "embellished by rivals"];
  const mutation = `${base} (${mutationBits[Math.floor(Math.random() * mutationBits.length)]})`;
  if (Math.random() < 0.7) state.feed.unshift({ text: mutation, type: "gossip", time: `Year ${state.year}` });

  for (const fam of state.families) {
    const socialArmor = fam.reputation > 65 ? 0.2 : 0.6;
    fam.reputation = Math.max(0, fam.reputation - socialArmor);
  }
}
