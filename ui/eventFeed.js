export function renderFeed(state) {
  const ul = document.getElementById("eventFeed");
  ul.innerHTML = "";
  state.feed.slice(0, 18).forEach(e => {
    const li = document.createElement("li");
    li.textContent = `[${e.time || "now"}] ${e.text}`;
    ul.appendChild(li);
  });
}
