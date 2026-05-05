export function renderFamilies(state, onCharacterClick) {
  const view = document.getElementById("mainView");
  view.innerHTML = "";
  for (const fam of state.families) {
    const card = document.createElement("div");
    card.className = "family-card panel";
    const header = document.createElement("button");
    header.className = "family-header";
    header.textContent = `▸ ${fam.name}`;
    const body = document.createElement("div");
    body.className = "family-body";
    body.style.display = "none";
    header.onclick = () => body.style.display = body.style.display === "none" ? "block" : "none";
    const bar = Math.round(fam.reputation/10)*10;
    body.innerHTML = `<div>Reputation: <span class="statbar"><span style="width:${bar}%"></span></span></div>
      <div>Wealth: ${fam.wealth}</div><div>Status: ${fam.status}</div><div>Scandal Level: ${fam.scandal>50?"High":fam.scandal>20?"Medium":"Low"}</div>`;
    ["married","unmarried","widowed","kids"].forEach(section => {
      const sec = document.createElement("div");
      sec.className = "section";
      const list = state.characters.filter(c => c.familyId === fam.id && (section === "kids" ? c.age < 16 : c.maritalStatus === section));
      sec.innerHTML = `<strong>▸ ${section[0].toUpperCase()+section.slice(1)}</strong>`;
      list.forEach(c => {
        const line = document.createElement("div");
        line.className = "person";
        line.textContent = `• ${c.displayName}`;
        line.onclick = () => onCharacterClick(c.id);
        sec.appendChild(line);
      });
      body.appendChild(sec);
    });
    card.append(header, body);
    view.appendChild(card);
  }
}
