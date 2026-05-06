function formatEntry(e) {
  const header = `${(e.type || "event").toUpperCase()} — (${e.severity || "Medium"})`;
  const who = (e.who || []).slice(0, 2).join(", ") || "—";
  const what = e.whatHappened || e.shortText || e.text || "Update";
  const result = (e.resultLines || []).slice(0, 2).map((line) => `→ ${line}`).join(" ") || "→ No visible impact";
  return `${header}\nWho: ${who}\nWhat Happened: ${what}\nResult: ${result}`;
}

export function renderFeed(state) {
  const ul = document.getElementById("eventFeed");
  ul.innerHTML = "";
  state.feed.slice(0, 18).forEach((e) => {
    const li = document.createElement("li");
    li.className = `feed-item priority-${e.priority || "medium"}`;
    li.textContent = `[${e.time || "now"}] ${formatEntry(e)}`;
    ul.appendChild(li);
  });
}
