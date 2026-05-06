const HAIR_OPTIONS = ["ash","light blonde","yellow blonde","brown-gold","brown","dark brown","black","red"];
const SKIN_OPTIONS = ["very pale","pale","medium","olive"];
const EYE_TYPES = ["wide-doe","siren","doe","tired"];
const EYE_COLORS = ["black","dark brown","light brown","greenish","green","emerald","light blue","blue","dark blue","deep blue"];

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
    card.querySelector(".family-header").ondblclick = () => handlers.onDeleteFamily(fam.id);

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
      <label>Hair <select id='hair-${fam.id}'>${HAIR_OPTIONS.map((o) => `<option>${o}</option>`).join("")}</select></label>
      <label>Skin <select id='skin-${fam.id}'>${SKIN_OPTIONS.map((o) => `<option>${o}</option>`).join("")}</select></label>
      <label>Eye Type <select id='eyes-${fam.id}'>${EYE_TYPES.map((o) => `<option>${o}</option>`).join("")}</select></label>
      <label>Eye Color <select id='eyeColor-${fam.id}'>${EYE_COLORS.map((o) => `<option>${o}</option>`).join("")}</select></label>
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
          },
          looks: {
            hair: document.getElementById(`hair-${fam.id}`).value,
            skin: document.getElementById(`skin-${fam.id}`).value,
            eyes: document.getElementById(`eyes-${fam.id}`).value,
            eyeColor: document.getElementById(`eyeColor-${fam.id}`).value
          }
        });
      });
    }

    view.appendChild(card);
  }
}
