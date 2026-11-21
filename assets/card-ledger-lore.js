function render(container, data) {
  const el = document.createElement('div');
  el.className = 'card-ledger';
  el.textContent = 'Ledger Lore Card – placeholder';
  container.appendChild(el);
}

module.exports = { render };
