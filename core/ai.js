const actions = ["attending ball","visiting family","writing letter","meeting lover","gossiping","resting","recovering illness","pursuing suitor","rejecting suitor"];
export function decideAction(character) {
  if (["Critical","Dying","Ill"].includes(character.health)) return "recovering illness";
  const idx = Math.floor(Math.random() * actions.length);
  return actions[idx];
}
