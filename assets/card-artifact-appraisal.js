function render(container, data) {
  const el = document.createElement('div');
  el.className = 'card-artifact';
  el.textContent = 'Artifact Appraisal Card – placeholder';
  container.appendChild(el);
}

module.exports = { render };
