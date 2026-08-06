/* Bitcoin Crusher — Z-compatible color token knowledge graph */
/* global window, localStorage */
window.TOKEN_GRAPH = (() => {
  "use strict";
  const STORAGE_KEY = "inf_kg";
  const SEARCH_KEY = "inf_sc";

  const STAGES = [
    { name: "LEARNING", color: "#2563eb", min: 0 },
    { name: "SEARCHING", color: "#06b6d4", min: 2 },
    { name: "REASONING", color: "#7c3aed", min: 4 },
    { name: "INFORMED", color: "#16a34a", min: 7 },
    { name: "ANALYTICAL", color: "#f59e0b", min: 11 },
    { name: "MONGOOSE-COLD", color: "#94a3b8", min: 17 },
    { name: "VECTOR-TRUTH", color: "#f8fafc", min: 25 },
  ];

  function emptyGraph() { return { schema: "z-token-graph/v1", nodes: {}, edges: {}, updatedAt: null }; }
  function load() { try { return Object.assign(emptyGraph(), JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); } catch (_) { return emptyGraph(); } }
  function save(graph) { graph.updatedAt = new Date().toISOString(); localStorage.setItem(STORAGE_KEY, JSON.stringify(graph)); return graph; }
  function norm(values) { return [...new Set((values || []).map(v => String(v || "").toLowerCase().trim()).filter(Boolean))]; }
  function sourceKeys(brief) { return norm((brief.sources || []).map(s => s.doi || s.id || s.url)); }
  function overlap(a, b) { const right = new Set(b); return a.filter(x => right.has(x)); }
  function edgeKey(a, b) { return [a, b].sort().join("::"); }
  function inbound(graph, id) { return Object.values(graph.edges).filter(e => e.to === id || e.from === id).length; }
  function traversals(graph, id) { return Object.values(graph.edges).filter(e => e.to === id || e.from === id).reduce((n, e) => n + (e.clicks || 0), 0); }
  function stageFor(value) { return STAGES.reduce((stage, item) => value >= item.min ? item : stage, STAGES[0]); }

  function recalculate(graph, id) {
    const node = graph.nodes[id]; if (!node) return;
    node.tokenValue = 1 + inbound(graph, id) + traversals(graph, id);
    const stage = stageFor(node.tokenValue);
    node.tokenColor = stage.color;
    node.stage = stage.name;
  }

  function registerBrief(brief) {
    if (!brief || !brief.tokenId) return null;
    const graph = load(), id = brief.tokenId;
    const node = graph.nodes[id] || {};
    graph.nodes[id] = Object.assign(node, {
      tokenNumber: id,
      tokenValue: node.tokenValue || 1,
      tokenColor: node.tokenColor || STAGES[0].color,
      tokenDateTime: node.tokenDateTime || brief.generatedAt || new Date().toISOString(),
      stage: node.stage || STAGES[0].name,
      title: brief.title,
      userInput: brief.userInput || "",
      hash: brief.hash,
      keywords: norm(brief.keywords),
      sources: sourceKeys(brief),
      evidenceStatus: brief.evidenceStatus,
      clicks: node.clicks || 0,
    });
    Object.values(graph.nodes).forEach(other => {
      if (other.tokenNumber === id) return;
      const sharedTerms = overlap(graph.nodes[id].keywords, other.keywords || []);
      const sharedSources = overlap(graph.nodes[id].sources, other.sources || []);
      if (!sharedTerms.length && !sharedSources.length) return;
      const key = edgeKey(id, other.tokenNumber);
      graph.edges[key] = graph.edges[key] || { from: other.tokenNumber, to: id, clicks: 0, createdAt: new Date().toISOString() };
      graph.edges[key].sharedKeywords = sharedTerms;
      graph.edges[key].sharedSources = sharedSources;
      graph.edges[key].strength = sharedTerms.length + (sharedSources.length * 3) + graph.edges[key].clicks;
      recalculate(graph, other.tokenNumber);
    });
    recalculate(graph, id);
    save(graph);
    return graph.nodes[id];
  }

  function recordClick(from, to) {
    const graph = load(), key = edgeKey(from, to), edge = graph.edges[key];
    if (!edge || !graph.nodes[from] || !graph.nodes[to]) return null;
    edge.clicks = (edge.clicks || 0) + 1;
    edge.strength = (edge.sharedKeywords || []).length + ((edge.sharedSources || []).length * 3) + edge.clicks;
    graph.nodes[to].clicks = (graph.nodes[to].clicks || 0) + 1;
    recalculate(graph, from); recalculate(graph, to);
    localStorage.setItem(SEARCH_KEY, String((Number(localStorage.getItem(SEARCH_KEY)) || 0) + 1));
    save(graph);
    return { edge, target: graph.nodes[to] };
  }

  function related(id) {
    const graph = load();
    return Object.values(graph.edges).filter(e => e.from === id || e.to === id).map(edge => {
      const otherId = edge.from === id ? edge.to : edge.from;
      return { edge, node: graph.nodes[otherId] };
    }).filter(x => x.node).sort((a, b) => b.edge.strength - a.edge.strength);
  }

  function importZ(payload) {
    const incoming = typeof payload === "string" ? JSON.parse(payload) : payload;
    const graph = load();
    if (incoming.nodes) Object.assign(graph.nodes, incoming.nodes);
    if (incoming.edges) Object.assign(graph.edges, incoming.edges);
    Object.keys(graph.nodes).forEach(id => recalculate(graph, id));
    return save(graph);
  }

  return { STAGES, load, registerBrief, recordClick, related, importZ, exportZ: () => JSON.stringify(load(), null, 2) };
})();
