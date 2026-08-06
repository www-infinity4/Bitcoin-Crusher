/* Bitcoin Crusher — Z-compatible functional color knowledge graph */
/* global window, localStorage */
window.TOKEN_GRAPH = (() => {
  "use strict";
  const STORAGE_KEY = "inf_kg", SEARCH_KEY = "inf_sc";
  const COLORS = {
    ENGINEERING: { color: "#16a34a", meaning: "Engineering / tools" },
    IMPORT: { color: "#2563eb", meaning: "Value-adding input" },
    ASSIMILATION: { color: "#7c3aed", meaning: "Shared builder or project content" },
    DATA: { color: "#facc15", meaning: "Extracted and downloadable data" },
    INVESTIGATE: { color: "#ec4899", meaning: "Investigative work" },
    ROUTES: { color: "#dc2626", meaning: "Better or updated paths" },
  };
  const STOPWORDS = new Set("a an and are as at be by for from has have in into is it of on or that the their this to was were will with your".split(" "));
  function emptyGraph() { return { schema: "z-token-graph/v2", nodes: {}, edges: {}, touches: [], updatedAt: null }; }
  function load() { try { return Object.assign(emptyGraph(), JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); } catch (_) { return emptyGraph(); } }
  function save(g) { g.updatedAt = new Date().toISOString(); localStorage.setItem(STORAGE_KEY, JSON.stringify(g)); return g; }
  function norm(v) { return [...new Set((v || []).map(x => String(x || "").toLowerCase().trim()).filter(Boolean))]; }
  function sourceKeys(b) { return norm((b.sources || []).map(s => s.doi || s.id || s.url)); }
  function overlap(a, b) { const r = new Set(b); return a.filter(x => r.has(x)); }
  function edgeKey(a, b) { return [a, b].sort().join("::"); }
  function inbound(g, id) { return Object.values(g.edges).filter(e => e.to === id || e.from === id).length; }
  function traversals(g, id) { return Object.values(g.edges).filter(e => e.to === id || e.from === id).reduce((n, e) => n + (e.clicks || 0), 0); }
  function setFunction(node, name) { const f = COLORS[name] || COLORS.INVESTIGATE; node.tokenFunction = name in COLORS ? name : "INVESTIGATE"; node.tokenColor = f.color; node.colorMeaning = f.meaning; }
  function recalculate(g, id) { const n = g.nodes[id]; if (n) n.tokenValue = 1 + inbound(g, id) + traversals(g, id); }
  function touch(g, type, data) { g.touches.push(Object.assign({ type, at: new Date().toISOString() }, data)); g.touches = g.touches.slice(-1000); }

  function registerBrief(brief) {
    if (!brief || !brief.tokenId) return null;
    const g = load(), id = brief.tokenId, old = g.nodes[id] || {};
    g.nodes[id] = Object.assign(old, { tokenNumber: id, tokenValue: old.tokenValue || 1,
      tokenDateTime: old.tokenDateTime || brief.generatedAt || new Date().toISOString(), title: brief.title,
      userInput: brief.userInput || "", hash: brief.hash, contentsHash: brief.hash,
      keywords: norm(brief.keywords), sources: sourceKeys(brief), evidenceStatus: brief.evidenceStatus, clicks: old.clicks || 0 });
    setFunction(g.nodes[id], (brief.sources || []).length ? "DATA" : "INVESTIGATE");
    let linked = false;
    Object.values(g.nodes).forEach(other => {
      if (other.tokenNumber === id) return;
      const sharedKeywords = overlap(g.nodes[id].keywords, other.keywords || []), sharedSources = overlap(g.nodes[id].sources, other.sources || []);
      if (!sharedKeywords.length && !sharedSources.length) return;
      linked = true; const key = edgeKey(id, other.tokenNumber);
      g.edges[key] = g.edges[key] || { from: other.tokenNumber, to: id, clicks: 0, createdAt: new Date().toISOString() };
      Object.assign(g.edges[key], { routeColor: COLORS.ROUTES.color, routeFunction: "ROUTES", sharedKeywords, sharedSources });
      g.edges[key].strength = sharedKeywords.length + sharedSources.length * 3 + g.edges[key].clicks;
      recalculate(g, other.tokenNumber);
    });
    if (linked) setFunction(g.nodes[id], "ASSIMILATION");
    recalculate(g, id); touch(g, "REGISTER", { tokenNumber: id, contentsHash: brief.hash, function: g.nodes[id].tokenFunction });
    save(g); return g.nodes[id];
  }

  function recordClick(from, to, word) {
    const g = load(), key = edgeKey(from, to), e = g.edges[key]; if (!e || !g.nodes[from] || !g.nodes[to]) return null;
    e.clicks = (e.clicks || 0) + 1; e.strength = (e.sharedKeywords || []).length + (e.sharedSources || []).length * 3 + e.clicks;
    g.nodes[to].clicks = (g.nodes[to].clicks || 0) + 1; recalculate(g, from); recalculate(g, to);
    localStorage.setItem(SEARCH_KEY, String((Number(localStorage.getItem(SEARCH_KEY)) || 0) + 1));
    touch(g, "ROUTE", { from, to, word: word || null, contentsHash: g.nodes[to].contentsHash }); save(g); return { edge: e, target: g.nodes[to] };
  }
  function related(id) { const g = load(); return Object.values(g.edges).filter(e => e.from === id || e.to === id).map(edge => ({ edge, node: g.nodes[edge.from === id ? edge.to : edge.from] })).filter(x => x.node).sort((a, b) => b.edge.strength - a.edge.strength); }
  function promoteEngineering(id) { const g = load(), n = g.nodes[id]; if (!n) return null; setFunction(n, "ENGINEERING"); touch(g, "ENGINEERING", { tokenNumber: id, contentsHash: n.contentsHash }); save(g); return n; }
  function wordMode(node) { const shared = new Set(related(node.tokenNumber).flatMap(x => x.edge.sharedKeywords || [])); return String(node.userInput || "").split(/(\s+)/).map(raw => { const word = raw.toLowerCase().replace(/[^a-z0-9-]/g, ""); if (!word || STOPWORDS.has(word)) return { text: raw, neutral: true }; let fn = node.tokenFunction; if (shared.has(word)) fn = "ASSIMILATION"; return { text: raw, word, tokenFunction: fn, color: COLORS[fn].color }; }); }
  function importZ(payload) { const incoming = typeof payload === "string" ? JSON.parse(payload) : payload, g = load(); if (incoming.nodes) Object.assign(g.nodes, incoming.nodes); if (incoming.edges) Object.assign(g.edges, incoming.edges); Object.values(g.nodes).forEach(n => { setFunction(n, "IMPORT"); recalculate(g, n.tokenNumber); touch(g, "IMPORT", { tokenNumber: n.tokenNumber, contentsHash: n.contentsHash || n.hash }); }); return save(g); }
  return { COLORS, load, registerBrief, recordClick, related, promoteEngineering, wordMode, importZ, exportZ: () => JSON.stringify(load(), null, 2) };
})();
