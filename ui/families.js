export function renderFamilies(state, handlers) {
  const view = document.getElementById("mainView");
  view.innerHTML = "<h2>Families</h2>";
  if (!state.families.length) {
    view.innerHTML += "<p>No families yet. Go to Actions and create the first family.</p>";
    return;
  }

  for (const fam of state.families) {
    const card = document.createElement("div");
    card.className = "family-card panel";
    const selected = state.activeFamilyId === fam.id;
    card.innerHTML = `<button class='family-header'>${selected ? "✅" : "▸"} ${fam.name}</button><div>Wealth: ${fam.wealth} | Reputation: ${fam.reputation}</div>`;
    card.querySelector(".family-header").onclick = () => handlers.onSelectFamily(fam.id);

    if (selected) {
      const editor = document.createElement("div");
      editor.innerHTML = `<h4>Selected Family Controls</h4>
      <button id='wealthUp-${fam.id}'>Modify Wealth +10</button><button id='repUp-${fam.id}'>Modify Reputation +5</button>
      <button id='rename-${fam.id}'>Rename Family</button>
      <h4>Add Character</h4>
      <input id='name-${fam.id}' placeholder='Name'>
      <select id='gender-${fam.id}'><option>female</option><option>male</option></select>
      <input id='age-${fam.id}' type='number' value='18' min='0'>
      <input id='amb-${fam.id}' type='number' value='5' min='0' max='10'>
      <input id='jeal-${fam.id}' type='number' value='5' min='0' max='10'>
      <input id='charm-${fam.id}' type='number' value='5' min='0' max='10'>
      <input id='mor-${fam.id}' type='number' value='5' min='0' max='10'>
      <input id='intel-${fam.id}' type='number' value='5' min='0' max='10'>
      <input id='social-${fam.id}' type='number' value='5' min='0' max='10'>
      <button id='add-${fam.id}'>Add Character</button>`;
      card.appendChild(editor);
      setTimeout(() => {
        document.getElementById(`wealthUp-${fam.id}`).onclick = () => handlers.onModifyFamily("wealth", 10);
        document.getElementById(`repUp-${fam.id}`).onclick = () => handlers.onModifyFamily("reputation", 5);
        document.getElementById(`rename-${fam.id}`).onclick = () => { const n = prompt("New family name:", fam.name); if (n) handlers.onRenameFamily(n); };
        document.getElementById(`add-${fam.id}`).onclick = () => handlers.onCreateCharacter({
          firstName: document.getElementById(`name-${fam.id}`).value || "Unnamed",
          gender: document.getElementById(`gender-${fam.id}`).value,
          age: Number(document.getElementById(`age-${fam.id}`).value),
          personality: { ambition: Number(document.getElementById(`amb-${fam.id}`).value), jealousy: Number(document.getElementById(`jeal-${fam.id}`).value), charm: Number(document.getElementById(`charm-${fam.id}`).value), morality: Number(document.getElementById(`mor-${fam.id}`).value), intelligence: Number(document.getElementById(`intel-${fam.id}`).value), socialHunger: Number(document.getElementById(`social-${fam.id}`).value), loyalty: 5, riskTolerance: 5 },
          intelligence: Number(document.getElementById(`intel-${fam.id}`).value)
        });
      });
    }

    const chars = state.characters.filter((c) => c.familyId === fam.id);
    chars.forEach((c) => {
      const person = document.createElement("div");
      person.className = "person";
      person.textContent = `• ${c.firstName} (${c.gender}, ${c.age})`;
      person.onclick = () => handlers.onCharacterClick(c.id);
      card.appendChild(person);
    });

    view.appendChild(card);
  }
}
