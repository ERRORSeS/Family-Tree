export function renderFamilies(state, handlers) {
  const view = document.getElementById("mainView");
  view.innerHTML = "<h2>Families</h2>";
  if (!state.families.length) {
    view.innerHTML += "<p>No families yet. Go to Actions and create one.</p>";
    return;
  }

  for (const fam of state.families) {
    const card = document.createElement("div");
    card.className = "family-card panel";
    const selected = state.activeFamilyId === fam.id;
    card.innerHTML = `<button class='family-header'>${selected ? "✅" : "▸"} ${fam.name}</button><div>Wealth: ${fam.wealth} | Reputation: ${fam.reputation}</div>`;
    card.querySelector(".family-header").onclick = () => handlers.onSelectFamily(fam.id);

    const chars = state.characters.filter((c) => c.familyId === fam.id && c.status !== "dead");
    const groups = {
      married: chars.filter((c) => c.maritalStatus === "married"),
      "not-married": chars.filter((c) => c.maritalStatus !== "married" && c.maritalStatus !== "widowed" && c.age >= 16),
      widowed: chars.filter((c) => c.maritalStatus === "widowed"),
      kids: chars.filter((c) => c.age < 16)
    };

    Object.entries(groups).forEach(([k, arr]) => {
      const d = document.createElement("details");
      d.innerHTML = `<summary>${k[0].toUpperCase() + k.slice(1)} (${arr.length})</summary>`;
      arr.forEach((c) => {
        const p = document.createElement("div");
        p.className = "person";
        p.textContent = `• ${c.firstName} (${c.age})`;
        p.onclick = () => handlers.onCharacterClick(c.id);
        d.appendChild(p);
      });
      card.appendChild(d);
    });

    if (selected) {
      const editor = document.createElement("div");
      editor.innerHTML = `<h4>Character Creation (all traits visible)</h4>
      <input id='name-${fam.id}' placeholder='Name'> <select id='gender-${fam.id}'><option>female</option><option>male</option></select>
      <input id='age-${fam.id}' type='number' value='18' min='0'>
      <label>Beauty <input id='beauty-${fam.id}' type='range' min='0' max='10' value='5'></label>
      <label>Ambition <input id='amb-${fam.id}' type='range' min='0' max='10' value='5'></label>
      <label>Jealousy <input id='jeal-${fam.id}' type='range' min='0' max='10' value='5'></label>
      <label>Charm <input id='charm-${fam.id}' type='range' min='0' max='10' value='5'></label>
      <label>Morality <input id='mor-${fam.id}' type='range' min='0' max='10' value='5'></label>
      <label>Intelligence <input id='intel-${fam.id}' type='range' min='0' max='10' value='5'></label>
      <label>Social Hunger <input id='social-${fam.id}' type='range' min='0' max='10' value='5'></label>
      <button id='add-${fam.id}'>Add Character</button>`;
      card.appendChild(editor);

      setTimeout(() => {
        const addBtn = document.getElementById(`add-${fam.id}`);
        if (!addBtn) return;
        addBtn.onclick = () => handlers.onCreateCharacter({
          firstName: document.getElementById(`name-${fam.id}`).value || "Unnamed",
          gender: document.getElementById(`gender-${fam.id}`).value,
          age: Number(document.getElementById(`age-${fam.id}`).value),
          beauty: Number(document.getElementById(`beauty-${fam.id}`).value),
          intelligence: Number(document.getElementById(`intel-${fam.id}`).value),
          personality: {
            ambition: Number(document.getElementById(`amb-${fam.id}`).value),
            jealousy: Number(document.getElementById(`jeal-${fam.id}`).value),
            charm: Number(document.getElementById(`charm-${fam.id}`).value),
            morality: Number(document.getElementById(`mor-${fam.id}`).value),
            intelligence: Number(document.getElementById(`intel-${fam.id}`).value),
            socialHunger: Number(document.getElementById(`social-${fam.id}`).value),
            loyalty: 5,
            riskTolerance: 5
          }
        });
      });
    }

    view.appendChild(card);
  }
}
