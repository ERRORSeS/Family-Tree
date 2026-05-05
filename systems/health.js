const states = ["Healthy","Ill","Critical","Dying","Deceased"];
export function updateHealth(character) {
  if (character.health === "Deceased") return;
  const r = Math.random();
  if (r < 0.02) character.health = states[Math.min(states.indexOf(character.health) + 1, 4)];
  else if (r > 0.95) character.health = states[Math.max(states.indexOf(character.health) - 1, 0)];
}
