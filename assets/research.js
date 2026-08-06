/* Bitcoin Crusher — source-first research engine */
/* global window, localStorage, crypto */
window.RESEARCH = (() => {
  "use strict";

  const DOMAIN_TERMS = {
    BTC: ["Bitcoin", "cryptography", "blockchain"],
    DIAM: ["diamond", "materials science", "crystallography"],
    INF: ["mathematics", "information theory", "complex systems"],
    BLOCK: ["solid state physics", "nanotechnology", "polymers"],
    STAR: ["astrophysics", "stellar evolution", "nuclear fusion"],
    MARIO: ["mycology", "biochemistry", "fungal biology"],
    CROWN: ["metallurgy", "electrochemistry", "surface science"],
    PUMP: ["aerospace", "fluid dynamics", "thermodynamics"],
    BAG: ["biophysics", "molecular biology", "proteomics"],
    FIRE: ["combustion", "plasma physics", "thermodynamics"],
    GOLD: ["gold", "catalysis", "noble metal chemistry"],
    MOON: ["lunar science", "tidal mechanics", "planetary science"],
  };

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function makeAbortSignal(ms) {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      return AbortSignal.timeout(ms);
    }
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }

  function termsForSpin(spinData) {
    const userInput = clean(spinData.userResearchInput || "");
    const labels = spinData.symbolLabels || [];
    const symbolTerms = labels.flatMap((label) => DOMAIN_TERMS[label] || []);
    return unique([userInput, ...symbolTerms]).slice(0, 8);
  }

  function abstractFromIndex(index) {
    if (!index) return "";
    const words = [];
    Object.entries(index).forEach(([word, positions]) => {
      positions.forEach((position) => { words[position] = word; });
    });
    return clean(words.join(" "));
  }

  function normalizeDoi(value) {
    return clean(value).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").toLowerCase();
  }

  function normalizeOpenAlex(work) {
    const location = work.primary_location || {};
    const source = location.source || {};
    return {
      id: work.id,
      title: clean(work.title),
      authors: (work.authorships || []).map((item) => item.author && item.author.display_name).filter(Boolean),
      journal: source.display_name || "Venue metadata unavailable",
      year: work.publication_year || null,
      doi: normalizeDoi(work.doi),
      url: location.landing_page_url || work.doi || work.id,
      abstract: abstractFromIndex(work.abstract_inverted_index),
      citedBy: work.cited_by_count || 0,
      provider: "OpenAlex",
      fullTextReviewed: false,
    };
  }

  function normalizeCrossref(work) {
    const date = work.published || work.issued || {};
    const parts = date["date-parts"] || [[null]];
    return {
      id: work.DOI || work.URL,
      title: clean((work.title || [])[0]),
      authors: (work.author || []).map((author) => clean([author.given, author.family].filter(Boolean).join(" "))).filter(Boolean),
      journal: clean((work["container-title"] || [])[0]) || "Venue metadata unavailable",
      year: parts[0][0] || null,
      doi: normalizeDoi(work.DOI),
      url: work.URL || (work.DOI ? "https://doi.org/" + work.DOI : ""),
      abstract: clean((work.abstract || "").replace(/<[^>]+>/g, " ")),
      citedBy: work["is-referenced-by-count"] || 0,
      provider: "Crossref",
      fullTextReviewed: false,
    };
  }

  function dedupe(records) {
    const found = new Map();
    records.forEach((record) => {
      if (!record.title) return;
      const key = record.doi || record.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const current = found.get(key);
      if (!current || (!current.abstract && record.abstract)) found.set(key, record);
    });
    return [...found.values()].sort((a, b) => (b.citedBy - a.citedBy) || ((b.year || 0) - (a.year || 0)));
  }

  async function searchScholarly(query, limit = 12) {
    const openAlexUrl = "https://api.openalex.org/works?search=" + encodeURIComponent(query) + "&per-page=" + limit;
    const crossrefUrl = "https://api.crossref.org/works?query=" + encodeURIComponent(query) +
      "&rows=" + limit + "&select=DOI,title,author,published,issued,container-title,URL,abstract,is-referenced-by-count,type";
    const settled = await Promise.allSettled([
      fetch(openAlexUrl, { signal: makeAbortSignal(9000) }).then((response) => {
        if (!response.ok) throw new Error("OpenAlex " + response.status);
        return response.json();
      }),
      fetch(crossrefUrl, { signal: makeAbortSignal(9000) }).then((response) => {
        if (!response.ok) throw new Error("Crossref " + response.status);
        return response.json();
      }),
    ]);
    const records = [];
    if (settled[0].status === "fulfilled") {
      records.push(...(settled[0].value.results || []).map(normalizeOpenAlex));
    }
    if (settled[1].status === "fulfilled") {
      const items = ((settled[1].value.message || {}).items) || [];
      records.push(...items.map(normalizeCrossref));
    }
    return dedupe(records);
  }

  function reference(record, index) {
    const authors = record.authors.join(", ") || "Author metadata unavailable";
    const locator = record.doi ? "https://doi.org/" + record.doi : record.url;
    return `[${index + 1}] ${authors} (${record.year || "n.d."}). ${record.title}. ${record.journal}. ${locator}`;
  }

  function pendingBrief(spinData) {
    const userInput = clean(spinData.userResearchInput || "");
    const keywords = termsForSpin(spinData);
    const topic = userInput || keywords.slice(0, 4).join(", ") || "interdisciplinary research";
    return {
      schema: "infinity-research-brief/v1",
      userInput,
      title: "Research token: " + topic.slice(0, 120),
      authors: [],
      journal: "Source discovery pending",
      year: new Date().getFullYear(),
      doi: "",
      impactFactor: "Not assigned",
      keywords,
      abstract: "This spin created a research question and search queue. No publication, experiment, measurement, or conclusion has been generated or claimed.",
      introduction: "The reel symbols are being used only to select search terms. They are not scientific evidence.",
      methods: "Pending retrieval from OpenAlex and Crossref.",
      results: "No results yet. Scholarly records must be retrieved and inspected first.",
      discussion: "No discussion yet. Researcher theory must remain separate from published evidence.",
      conclusion: "Pending source review.",
      references: [],
      sources: [],
      domains: keywords,
      tokenValue: spinData.score || 0,
      simulatedGameScore: spinData.score || 0,
      spinNumber: spinData.spinNumber || 0,
      generatedAt: new Date().toISOString(),
      searchEnriched: false,
      evidenceStatus: "pending-source-retrieval",
      fullTextsReviewed: 0,
    };
  }

  function generateResearchArticle(spinData) {
    return pendingBrief(spinData || {});
  }

  async function sha256(value) {
    if (!crypto || !crypto.subtle) return "unavailable";
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function catalogBrief(brief) {
    try {
      const key = "infinityResearchCatalog";
      const catalog = JSON.parse(localStorage.getItem(key) || "[]");
      if (!catalog.some((item) => item.hash === brief.hash)) {
        catalog.unshift({
          hash: brief.hash,
          title: brief.title,
          createdAt: brief.generatedAt,
          sourceCount: brief.sources.length,
          spinNumber: brief.spinNumber,
          brief,
        });
      }
      localStorage.setItem(key, JSON.stringify(catalog.slice(0, 500)));
    } catch (_) {
      // Catalog persistence is optional; the brief remains exportable.
    }
  }

  async function enrichWithSearch(article) {
    const query = (article.keywords || []).slice(0, 6).join(" ");
    const sources = query ? await searchScholarly(query, 12) : [];
    const primary = sources[0] || null;
    const abstractSources = sources.filter((source) => source.abstract);
    const enriched = Object.assign({}, article, {
      searchEnriched: true,
      sources,
      evidenceStatus: sources.length ? "indexed-records-retrieved" : "no-indexed-records-found",
      fullTextsReviewed: 0,
      references: sources.map(reference),
    });
    if (primary) {
      enriched.title = "Evidence brief: " + (article.keywords || []).slice(0, 4).join(", ");
      enriched.authors = primary.authors;
      enriched.journal = primary.journal;
      enriched.year = primary.year;
      enriched.doi = primary.doi;
      enriched.abstract = abstractSources.length
        ? abstractSources.slice(0, 3).map((source, index) => `[${sources.indexOf(source) + 1}] ${source.abstract}`).join(" ")
        : "Scholarly metadata was retrieved, but none of the selected index records supplied an abstract. Read the publications before drafting findings.";
      enriched.introduction = `Source discovery returned ${sources.length} unique scholarly records for the spin-selected keywords.`;
      enriched.methods = "Records were retrieved from OpenAlex and Crossref, normalized, and deduplicated by DOI or normalized title. No full text has been marked reviewed.";
      enriched.results = `${abstractSources.length} records include indexed abstracts; ${sources.length - abstractSources.length} are metadata-only. Citation counts are discovery signals, not proof of correctness.`;
      enriched.discussion = "The indexed abstracts can support an initial evidence map. Detailed claims, methods, and limitations require full-text review.";
      enriched.conclusion = "A source-backed research package has been created. It remains provisional until the underlying publications are read and claim-level citations are recorded.";
      enriched.archiveSources = sources.slice(0, 6).map((source) => ({
        id: source.id,
        title: source.title,
        description: `${source.provider} record · ${source.abstract ? "indexed abstract" : "metadata only"} · full text not verified`,
        url: source.url,
      }));
    }
    enriched.hash = await sha256({
      schema: enriched.schema,
      userInput: enriched.userInput,
      keywords: enriched.keywords,
      generatedAt: enriched.generatedAt,
      spinNumber: enriched.spinNumber,
      sources: enriched.sources,
    });
    enriched.tokenId = "research-" + enriched.hash.slice(0, 16);
    if (window.TOKEN_GRAPH) {
      const node = window.TOKEN_GRAPH.registerBrief(enriched);
      if (node) {
        enriched.tokenNumber = node.tokenNumber;
        enriched.tokenValue = node.tokenValue;
        enriched.tokenColor = node.tokenColor;
        enriched.tokenDateTime = node.tokenDateTime;
        enriched.knowledgeStage = node.stage;
      }
    }
    catalogBrief(enriched);
    return enriched;
  }

  async function searchDDG(query) {
    try {
      const url = "https://api.duckduckgo.com/?q=" + encodeURIComponent(query) + "&format=json&no_html=1&skip_disambig=1";
      const response = await fetch(url, { signal: makeAbortSignal(7000) });
      if (!response.ok) return null;
      const data = await response.json();
      return {
        abstract: data.AbstractText || "",
        source: data.AbstractSource || "DuckDuckGo",
        url: data.AbstractURL || "",
        relatedTopics: (data.RelatedTopics || []).slice(0, 4).map((item) => item.Text || "").filter(Boolean),
      };
    } catch (_) {
      return null;
    }
  }

  async function searchArchive(query) {
    try {
      const url = "https://archive.org/advancedsearch.php?q=" + encodeURIComponent(query) +
        "&fl[]=identifier&fl[]=title&fl[]=description&rows=4&output=json";
      const response = await fetch(url, { signal: makeAbortSignal(7000) });
      if (!response.ok) return [];
      const data = await response.json();
      return (((data.response || {}).docs) || []).map((item) => ({
        id: item.identifier || "",
        title: clean(item.title),
        description: clean(item.description).slice(0, 250),
        url: "https://archive.org/details/" + (item.identifier || ""),
      }));
    } catch (_) {
      return [];
    }
  }

  function esc(value) {
    return clean(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
    })[character]);
  }

  function buildExportHTML(records) {
    const cards = records.map(({ spinData, article }) => {
      const research = article || {};
      return `<article><h2>${esc(research.title || "Research pending")}</h2>
        <p><b>Spin:</b> #${spinData.spinNumber} · simulated score ${spinData.score || 0}</p>
        <p><b>Evidence status:</b> ${esc(research.evidenceStatus || "pending")}</p>
        <p>${esc(research.abstract || "No research brief available.")}</p>
        <ol>${(research.references || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ol>
        <p><b>SHA-256:</b> ${esc(research.hash || "not calculated")}</p></article>`;
    }).join("\n");
    return `<!doctype html><html><head><meta charset="utf-8"><title>Bitcoin Crusher Research Export</title>
      <style>body{font:16px/1.6 system-ui;max-width:900px;margin:auto;padding:24px}article{border-top:1px solid #aaa;padding:18px 0}</style>
      </head><body><h1>Bitcoin Crusher Research Export</h1><p>Game scores are simulated and separate from research evidence, Bitcoin revenue, and currency.</p>${cards}</body></html>`;
  }

  function downloadExport(records) {
    const blob = new Blob([buildExportHTML(records)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bitcoin-crusher-research-export.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 200);
  }

  return {
    generateResearchArticle,
    enrichWithSearch,
    searchScholarly,
    searchDDG,
    searchArchive,
    downloadExport,
  };
})();
