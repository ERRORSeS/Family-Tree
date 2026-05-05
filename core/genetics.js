const hair = ["ash","light blonde","yellow blonde","brown-gold","brown","dark brown","black","red"];
const skin = ["very pale","pale","medium","olive"];
const eyeType = ["wide-doe","siren","doe","tired"];
const eyeColor = ["black","dark brown","light brown","greenish","green","emerald","light blue","blue","dark blue","deep blue"];
const nose = ["straight","aquiline","soft","narrow"];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function assignLooks(characters) {
  for (const c of characters) {
    c.looks = { hair: pick(hair), skin: pick(skin), eyes: pick(eyeType), eyeColor: pick(eyeColor), nose: pick(nose) };
  }
}

export function computeBeauty(character) {
  let beauty = character.beautyBase;
  if (character.age >= 14 && character.age <= 25) beauty += 1;
  if (character.age > 40) beauty -= 2;
  return Math.max(0, Math.min(10, beauty + (Math.random() * 2 - 1)));
}
