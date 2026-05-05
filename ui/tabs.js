export function setupTabs(onChange) {
  const tabs = Array.from(document.querySelectorAll('.tab'));
  tabs.forEach(t => t.onclick = () => {
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    onChange(t.dataset.tab);
  });
}
