import { computeBeauty } from "../core/genetics.js";

export function titleFor(character) {
  if (character.gender === "male") return character.age < 16 ? "Master" : "Sir";
  if (character.noble) return "Lady";
  if (character.age >= 40) return "Madam";
  if (character.maritalStatus === "married") return "Mrs.";
  return "Miss";
}

export function classFor(character) {
  if (character.gender === "male") return character.age < 16 ? "Boy" : "Gentleman";
  if (character.age < 16) return "Girl";
  if (character.age <= 40) return "Lady";
  return "Madam";
}

export function showCharacterModal(state, id) {
  const c = state.charactersById[id];
  const modal = document.getElementById("characterModal");
  const el = document.getElementById("characterContent");
  const beauty = computeBeauty(c).toFixed(1);
  el.innerHTML = `<h2>NAME: ${c.displayName}</h2>
  <p>Gender: ${c.gender}<br>Age: ${c.age}<br>Family (Main): ${state.familiesById[c.familyId].name}<br>Family of Origin: ${state.familiesById[c.originFamilyId].name}<br>Status: ${c.maritalStatus}<br>Health: ${c.health}<br>Class: ${classFor(c)}</p>
  <p>Hair: ${c.looks.hair}<br>Skin: ${c.looks.skin}<br>Eyes: ${c.looks.eyes}<br>Eye Color: ${c.looks.eyeColor}<br>Nose: ${c.looks.nose}</p>
  <p>Beauty: ${beauty} / 10<br>Intelligence: ${c.intelligence} / 10<br>Current Activity: ${c.currentActivity || "resting"}<br>Dress: ${c.dress}</p>`;
  modal.classList.remove("hidden");
}
