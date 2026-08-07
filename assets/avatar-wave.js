/**
 * c13b0 Avatar Coin Wave Editor v1
 * Marks every safely editable page element with the realm's own portal symbol.
 */
(function () {
  "use strict";

  const script = document.currentScript;
  const config = {
    siteId: script.dataset.site || document.documentElement.dataset.avatarSite || location.hostname + location.pathname,
    siteName: script.dataset.siteName || document.title,
    marker: script.dataset.marker || "★",
    markerName: script.dataset.markerName || "Avatar Coin",
    accent: script.dataset.accent || "#facc15"
  };
  const STORE = "c13b0_avatar_wave:" + config.siteId;
  const CHAIN = STORE + ":chain";
  const IDENTITY = "c13b0_avatar_crown_id";
  const selector = [
    "h1", "h2", "h3", "h4", "p", "label", "legend", "caption",
    ".panel-title", ".panel-hint", ".topbar-name", ".topbar-kicker",
    ".subtitle", ".ham-brand", ".ham-section-label", ".ham-link",
    ".result-text", ".chat-bubble", ".station-type", "footer span", "footer"
  ].join(",");
  let active = null;
  let observer = null;

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (_) { return fallback; }
  }
  function uid(prefix) {
    return prefix + ":" + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  }
  function crownId() {
    let value = localStorage.getItem(IDENTITY);
    if (!value) { value = uid("crown"); localStorage.setItem(IDENTITY, value); }
    return value;
  }
  function keyFor(el) {
    if (el.id) return "id:" + el.id;
    if (el.dataset.avatarKey) return el.dataset.avatarKey;
    const parts = [];
    let node = el;
    while (node && node !== document.body && parts.length < 6) {
      const siblings = node.parentElement ? Array.from(node.parentElement.children).filter((item) => item.tagName === node.tagName) : [];
      parts.unshift(node.tagName.toLowerCase() + ":" + Math.max(0, siblings.indexOf(node)));
      node = node.parentElement;
    }
    return "path:" + parts.join("/");
  }
  function directTextNode(el) {
    return Array.from(el.childNodes).find((node) => node.nodeType === 3 && node.nodeValue.trim()) || null;
  }
  function editable(el) {
    if (!el || el.closest("#avatar-wave-portal") || el.closest(".avatar-wave-marker")) return null;
    if (el.matches("[data-avatar-ignore], input, textarea, select, canvas, video, iframe, script, style")) return null;
    const node = directTextNode(el);
    if (!node || !node.nodeValue.trim()) return null;
    return { node, original: node.nodeValue.trim() };
  }
  function ensureStyle() {
    const style = document.createElement("style");
    style.textContent = `
      .avatar-wave-host{position:relative}
      .avatar-wave-marker{display:inline-grid;place-items:center;min-width:18px;height:18px;margin-left:5px;padding:0 3px;vertical-align:super;border:1px solid color-mix(in srgb, ${config.accent} 55%, transparent);border-radius:999px;background:color-mix(in srgb, ${config.accent} 12%, #05070d);color:${config.accent};font:800 11px/1 system-ui;cursor:pointer;z-index:8}
      .avatar-wave-marker:hover,.avatar-wave-marker:focus-visible{transform:scale(1.16);box-shadow:0 0 10px color-mix(in srgb, ${config.accent} 55%, transparent)}
      #avatar-wave-portal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(2,4,10,.82);backdrop-filter:blur(10px);z-index:2147483000}
      #avatar-wave-portal.open{display:flex}
      .avatar-wave-card{width:min(680px,100%);max-height:92vh;overflow:auto;padding:22px;border:1px solid color-mix(in srgb, ${config.accent} 45%, #334155);border-radius:20px;background:#0c1220;color:#f8fafc;box-shadow:0 30px 90px #000}
      .avatar-wave-head{display:flex;justify-content:space-between;gap:12px;align-items:start}.avatar-wave-head h2{margin:0;font:800 1.35rem/1.2 system-ui}.avatar-wave-target{margin:8px 0 16px;color:${config.accent};font:700 .76rem/1.4 system-ui}
      .avatar-wave-close{border:0;background:transparent;color:#fff;font-size:1.2rem;cursor:pointer}
      .avatar-wave-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.avatar-wave-field{display:grid;gap:5px;color:#cbd5e1;font:700 .7rem/1.3 system-ui}.avatar-wave-field--wide{grid-column:1/-1}
      .avatar-wave-field input,.avatar-wave-field textarea,.avatar-wave-field select{width:100%;padding:10px;border:1px solid #334155;border-radius:9px;background:#111827;color:#fff;font:inherit}
      .avatar-wave-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}.avatar-wave-btn{padding:9px 12px;border:1px solid #475569;border-radius:9px;background:#172033;color:#fff;font:700 .72rem/1 system-ui;cursor:pointer}.avatar-wave-btn.primary{background:${config.accent};border-color:${config.accent};color:#071018}
      .avatar-wave-meta{margin-top:14px;padding:10px;border-radius:10px;background:#111827;color:#94a3b8;font:600 .62rem/1.5 monospace;overflow-wrap:anywhere}.avatar-wave-chain{display:grid;gap:5px;margin-top:10px}.avatar-wave-version{padding:8px;border:1px solid #263244;border-radius:8px;background:#0f172a;color:#cbd5e1;text-align:left;font:600 .66rem/1.3 system-ui;cursor:pointer}
      @media(max-width:560px){#avatar-wave-portal{align-items:flex-end;padding:0}.avatar-wave-card{border-radius:20px 20px 0 0;max-height:94vh}.avatar-wave-grid{grid-template-columns:1fr}.avatar-wave-field--wide{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }
  function ensurePortal() {
    const portal = document.createElement("div");
    portal.id = "avatar-wave-portal";
    portal.innerHTML = `
      <section class="avatar-wave-card" role="dialog" aria-modal="true" aria-labelledby="avatar-wave-title">
        <div class="avatar-wave-head"><div><h2 id="avatar-wave-title">${config.marker} ${config.markerName} page editor</h2><div class="avatar-wave-target" id="avatar-wave-target"></div></div><button class="avatar-wave-close" type="button" aria-label="Close">✕</button></div>
        <div class="avatar-wave-grid">
          <label class="avatar-wave-field avatar-wave-field--wide">Words<textarea id="avatar-wave-text" rows="4" maxlength="4000"></textarea></label>
          <label class="avatar-wave-field">Text color<input id="avatar-wave-color" type="color" value="#ffffff"></label>
          <label class="avatar-wave-field">Text size<select id="avatar-wave-size"><option value="">Page default</option><option value="0.8em">Smaller</option><option value="1em">Regular</option><option value="1.25em">Larger</option><option value="1.6em">Feature</option></select></label>
          <label class="avatar-wave-field">Alignment<select id="avatar-wave-align"><option value="">Page default</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
          <label class="avatar-wave-field">Opportunity label<input id="avatar-wave-label" maxlength="80" placeholder="Lyrics, title, research, artwork…"></label>
        </div>
        <div class="avatar-wave-actions"><button class="avatar-wave-btn" id="avatar-wave-preview" type="button">Preview</button><button class="avatar-wave-btn primary" id="avatar-wave-save" type="button">Save to chain</button><button class="avatar-wave-btn" id="avatar-wave-reset" type="button">Reset item</button><button class="avatar-wave-btn" id="avatar-wave-copy" type="button">Copy chain</button></div>
        <div class="avatar-wave-meta" id="avatar-wave-meta"></div><div class="avatar-wave-chain" id="avatar-wave-chain"></div>
      </section>`;
    document.body.appendChild(portal);
    portal.querySelector(".avatar-wave-close").addEventListener("click", close);
    portal.addEventListener("click", (event) => { if (event.target === portal) close(); });
    portal.querySelector("#avatar-wave-preview").addEventListener("click", preview);
    portal.querySelector("#avatar-wave-save").addEventListener("click", save);
    portal.querySelector("#avatar-wave-reset").addEventListener("click", resetItem);
    portal.querySelector("#avatar-wave-copy").addEventListener("click", copyChain);
    portal.querySelector("#avatar-wave-chain").addEventListener("click", restoreVersion);
  }
  function values() {
    return {
      text: document.querySelector("#avatar-wave-text").value.slice(0, 4000),
      color: document.querySelector("#avatar-wave-color").value,
      size: document.querySelector("#avatar-wave-size").value,
      align: document.querySelector("#avatar-wave-align").value,
      opportunity: document.querySelector("#avatar-wave-label").value.slice(0, 80)
    };
  }
  function applyValue(entry, value) {
    if (!entry || !entry.node || !entry.node.isConnected) return;
    entry.node.nodeValue = value.text + " ";
    entry.el.style.color = value.color || "";
    entry.el.style.fontSize = value.size || "";
    entry.el.style.textAlign = value.align || "";
  }
  function preview() { if (active) applyValue(active, values()); }
  function open(entry) {
    active = entry;
    const saved = read(STORE, {});
    const value = saved[entry.key] || { text: entry.original, color: "#ffffff", size: "", align: "", opportunity: "" };
    document.querySelector("#avatar-wave-target").textContent = "Changing: " + entry.label;
    document.querySelector("#avatar-wave-text").value = value.text || entry.original;
    document.querySelector("#avatar-wave-color").value = /^#[0-9a-f]{6}$/i.test(value.color || "") ? value.color : "#ffffff";
    document.querySelector("#avatar-wave-size").value = value.size || "";
    document.querySelector("#avatar-wave-align").value = value.align || "";
    document.querySelector("#avatar-wave-label").value = value.opportunity || "";
    document.querySelector("#avatar-wave-meta").textContent = crownId() + " · " + config.siteId + " · " + entry.key;
    renderChain();
    document.querySelector("#avatar-wave-portal").classList.add("open");
  }
  function close() { document.querySelector("#avatar-wave-portal").classList.remove("open"); active = null; }
  async function hash(text) {
    if (crypto.subtle) {
      const data = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(data)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return uid("local-hash");
  }
  async function save() {
    if (!active) return;
    const all = read(STORE, {});
    const value = values();
    all[active.key] = value;
    localStorage.setItem(STORE, JSON.stringify(all));
    applyValue(active, value);
    const chain = read(CHAIN, []);
    const previous = chain.length ? chain[chain.length - 1] : null;
    const base = {
      schema: "c13b0/avatar-wave-version/v1", id: uid("avatar-version"), crownId: crownId(),
      siteId: config.siteId, siteName: config.siteName, marker: config.marker,
      targetKey: active.key, targetLabel: active.label, opportunity: value.opportunity || null,
      parentVersionId: previous ? previous.id : null, value, createdAt: new Date().toISOString(),
      status: "local-unpublished"
    };
    base.versionHash = await hash(JSON.stringify(base));
    chain.push(base);
    localStorage.setItem(CHAIN, JSON.stringify(chain.slice(-300)));
    document.querySelector("#avatar-wave-meta").textContent = "Saved · " + base.versionHash.slice(0, 18) + " · local Crown chain";
    renderChain();
  }
  function resetItem() {
    if (!active) return;
    const all = read(STORE, {});
    delete all[active.key];
    localStorage.setItem(STORE, JSON.stringify(all));
    applyValue(active, { text: active.original, color: "", size: "", align: "", opportunity: "" });
    document.querySelector("#avatar-wave-text").value = active.original;
  }
  async function copyChain() {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ schema: "c13b0/avatar-wave-chain/v1", crownId: crownId(), siteId: config.siteId, records: read(CHAIN, []) }, null, 2));
      document.querySelector("#avatar-wave-meta").textContent = "Full attributed design chain copied.";
    } catch (_) { document.querySelector("#avatar-wave-meta").textContent = "The browser blocked copying."; }
  }
  function renderChain() {
    const host = document.querySelector("#avatar-wave-chain");
    const records = read(CHAIN, []).filter((item) => !active || item.targetKey === active.key).slice(-6).reverse();
    host.innerHTML = "";
    records.forEach((record) => {
      const btn = document.createElement("button"); btn.type = "button"; btn.className = "avatar-wave-version"; btn.dataset.versionId = record.id;
      btn.textContent = (record.opportunity || record.targetLabel) + " · " + record.createdAt.replace("T", " ").slice(0, 16) + " · " + record.versionHash.slice(0, 12);
      host.appendChild(btn);
    });
  }
  function restoreVersion(event) {
    const button = event.target.closest("[data-version-id]");
    if (!button || !active) return;
    const record = read(CHAIN, []).find((item) => item.id === button.dataset.versionId);
    if (!record) return;
    document.querySelector("#avatar-wave-text").value = record.value.text;
    document.querySelector("#avatar-wave-color").value = record.value.color || "#ffffff";
    document.querySelector("#avatar-wave-size").value = record.value.size || "";
    document.querySelector("#avatar-wave-align").value = record.value.align || "";
    document.querySelector("#avatar-wave-label").value = record.value.opportunity || "";
    preview();
  }
  function mark(root) {
    const scope = root || document;
    const targets = [];
    if (scope.matches && scope.matches(selector)) targets.push(scope);
    if (scope.querySelectorAll) targets.push(...scope.querySelectorAll(selector));
    targets.forEach((el) => {
      if (el.dataset.avatarWaveMarked === "true") return;
      const info = editable(el);
      if (!info) return;
      el.dataset.avatarWaveMarked = "true";
      const key = keyFor(el);
      el.dataset.avatarKey = key;
      const entry = { el, node: info.node, original: info.original, key, label: info.original.slice(0, 90) };
      const button = document.createElement("button");
      button.type = "button"; button.className = "avatar-wave-marker"; button.textContent = config.marker;
      button.title = "Change " + entry.label; button.setAttribute("aria-label", "Open " + config.markerName + " editor for " + entry.label);
      button.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); open(entry); });
      el.insertAdjacentElement("afterend", button);
      const saved = read(STORE, {})[key];
      if (saved) applyValue(entry, saved);
    });
  }
  function start() {
    ensureStyle(); ensurePortal(); mark(document);
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => { if (node.nodeType === 1) mark(node); }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.documentElement.dataset.avatarSite = config.siteId;
    document.documentElement.dataset.avatarSymbol = config.marker;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
