function render(container, data) {
  const el = document.createElement('div');
  el.className = 'card-ticker';
  el.textContent = 'Main Ticker Card – placeholder';
  container.appendChild(el);
}

module.exports = { render };
