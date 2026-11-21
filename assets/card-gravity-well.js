function render(container, data) {
  const el = document.createElement('div');
  el.className = 'card-gravity';
  el.textContent = 'Gravity‑Well Card – placeholder';
  container.appendChild(el);
}

module.exports = { render };
