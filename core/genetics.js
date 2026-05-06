const hair = ["ash","light blonde","yellow blonde","brown-gold","brown","dark brown","black","red"];
const skin = ["very pale","pale","medium","olive"];
const eyeType = ["wide-doe","siren","doe","tired"];
const eyeColor = ["black","dark brown","light brown","greenish","green","emerald","light blue","blue","dark blue","deep blue"];
const nose = ["straight","aquiline","soft","narrow"];
const faceType = ["oval", "round", "square", "heart", "long"];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function assignLooks(characters) {
  for (const c of characters) {
    c.looks = { hair: pick(hair), skin: pick(skin), eyes: pick(eyeType), eyeColor: pick(eyeColor), nose: pick(nose), faceType: pick(faceType) };
    c.genetics ??= { influence: Math.random() };
  }
}

export function getAncestralPool(state, parentA, parentB, key) {
  const pool = [];
  for (const id of [parentA?.id, parentB?.id]) {
    const character = state.charactersById[id];
    if (!character) continue;
    const parentIds = character.parents || [];
    for (const grandparentId of parentIds) {
      const gp = state.charactersById[grandparentId];
      if (!gp) continue;
      if (gp[key] != null) pool.push(gp[key]);
      if (gp.looks?.[key] != null) pool.push(gp.looks[key]);
      if (gp.personality?.[key] != null) pool.push(gp.personality[key]);
    }
  }
  return pool;
}

export function inheritScalar(state, parentA, parentB, key, min = 0, max = 10) {
  const roll = Math.random();
  if (roll < 0.5) {
    const aValue = parentA?.[key] ?? parentA?.personality?.[key] ?? 5;
    const bValue = parentB?.[key] ?? parentB?.personality?.[key] ?? 5;
    const aInfluence = (parentA?.genetics?.influence ?? 0.5) + (aValue / 10);
    const bInfluence = (parentB?.genetics?.influence ?? 0.5) + (bValue / 10);
    return clamp(Math.round(aInfluence >= bInfluence ? aValue : bValue), min, max);
  }
  if (roll < 0.8) {
    const av = parentA?.[key] ?? parentA?.personality?.[key] ?? 5;
    const bv = parentB?.[key] ?? parentB?.personality?.[key] ?? 5;
    return clamp(Math.round(((av + bv) / 2) + (Math.random() * 2 - 1)), min, max);
  }
  const ancestral = getAncestralPool(state, parentA, parentB, key);
  if (ancestral.length) return clamp(Math.round(Number(pick(ancestral))), min, max);
  const fallback = ((parentA?.[key] ?? 5) + (parentB?.[key] ?? 5)) / 2;
  return clamp(Math.round(fallback + (Math.random() * 2 - 1)), min, max);
}

export function inheritFeature(state, parentA, parentB, featureKey) {
  const roll = Math.random();
  if (roll < 0.5) {
    const aInfluence = parentA?.genetics?.influence ?? 0.5;
    const bInfluence = parentB?.genetics?.influence ?? 0.5;
    const dominant = aInfluence >= bInfluence ? parentA : parentB;
    return dominant?.looks?.[featureKey] ?? parentA?.looks?.[featureKey] ?? parentB?.looks?.[featureKey];
  }
  if (roll < 0.8) {
    return pick([parentA?.looks?.[featureKey], parentB?.looks?.[featureKey]].filter(Boolean));
  }
  const ancestral = getAncestralPool(state, parentA, parentB, featureKey).filter(Boolean);
  return ancestral.length ? pick(ancestral) : pick([parentA?.looks?.[featureKey], parentB?.looks?.[featureKey]].filter(Boolean));
}

export function computeBeauty(character) {
  const harmony = clamp((character.personality?.charm ?? 5) * 0.7 + (character.personality?.intelligence ?? 5) * 0.3, 0, 10);
  const inherited = clamp((character.beautyBase ?? character.beauty ?? 5), 0, 10);
  const rareTraitMod = ["emerald", "red", "aquiline"].some((trait) => Object.values(character.looks || {}).includes(trait)) ? 0.6 : 0;
  let ageModifier = 0;
  if (character.age >= 16 && character.age <= 25) ageModifier = 1.2;
  else if (character.age > 40) ageModifier = -1.5;
  return clamp(Math.round((harmony * 0.35) + (inherited * 0.55) + rareTraitMod + ageModifier), 0, 10);
}
