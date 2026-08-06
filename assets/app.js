/* =====================================================================
   Bitcoin Crusher — ∞ Infinity Slot Machine
   app.js — spin logic, reel animation, research integration,
            auth wiring, AI chat, GitHub API commit
   ===================================================================== */
(() => {
  "use strict";

  /* ------------------------------------------------------------------
     SYMBOLS
  ------------------------------------------------------------------ */
  const SYMBOLS = [
    { emoji: "₿",  label: "BTC",    value: 3,  weight: 8 },
    { emoji: "💎", label: "DIAM",   value: 5,  weight: 6 },
    { emoji: "∞",  label: "INF",    value: 8,  weight: 5 },
    { emoji: "🧱", label: "BLOCK",  value: 4,  weight: 7 },
    { emoji: "⭐", label: "STAR",   value: 2,  weight: 10 },
    { emoji: "🍄", label: "MARIO",  value: 6,  weight: 5 },
    { emoji: "👑", label: "CROWN",  value: 7,  weight: 4 },
    { emoji: "🚀", label: "PUMP",   value: 9,  weight: 3 },
    { emoji: "💰", label: "BAG",    value: 4,  weight: 7 },
    { emoji: "🔥", label: "FIRE",   value: 3,  weight: 9 },
    { emoji: "🥇", label: "GOLD",   value: 10, weight: 2 },
    { emoji: "🌕", label: "MOON",   value: 6,  weight: 5 },
  ];

  const REEL_COUNT = 5;
  const SYMBOL_HEIGHT = 160;

  /* ------------------------------------------------------------------
     STATE
  ------------------------------------------------------------------ */
  let spinCount = 0;
  let totalScore = 0;
  let isSpinning = false;
  let history = [];   // array of { spinData, commitInfo, article }
  let lastArticle = null;
  let cfg = { owner: "", repo: "", branch: "main" };

  /* ------------------------------------------------------------------
     DOM REFS
  ------------------------------------------------------------------ */
  const $ = (id) => document.getElementById(id);
  const strips      = Array.from({ length: REEL_COUNT }, (_, i) => $(`strip${i}`));
  const spinBtn     = $("spinBtn");
  const spinCounterEl = $("spinCounter");
  const scoreCounterEl = $("scoreCounter");
  const resultBar   = $("resultBar");
  const resultText  = $("resultText");
  const consoleLog  = $("consoleLog");
  const historyEl   = $("history");
  const histCountEl = $("histCount");
  const winOverlay  = $("winOverlay");
  const lever       = $("lever");
  const researchIdeaEl = $("researchIdea");
  const researchIdeaStatusEl = $("researchIdeaStatus");

  /* ------------------------------------------------------------------
     WEIGHTED RANDOM SYMBOL PICK
  ------------------------------------------------------------------ */
  const totalWeight = SYMBOLS.reduce((a, s) => a + s.weight, 0);
  function pickSymbol() {
    let r = Math.random() * totalWeight;
    for (const s of SYMBOLS) { r -= s.weight; if (r <= 0) return s; }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  /* ------------------------------------------------------------------
     REEL INIT
  ------------------------------------------------------------------ */
  function buildStrip(stripEl) {
    stripEl.innerHTML = "";
    for (let i = 0; i < 24; i++) {
      const sym = pickSymbol();
      const div = document.createElement("div");
      div.className = "reel-symbol";
      div.innerHTML = `<span>${sym.emoji}</span><span class="sym-label">${sym.label}</span>`;
      stripEl.appendChild(div);
    }
  }
  function initReels() { strips.forEach((s) => buildStrip(s)); }

  /* ------------------------------------------------------------------
     SPIN ANIMATION
  ------------------------------------------------------------------ */
  function animateReel(reelEl, stripEl, finalSymbol, delay, duration) {
    return new Promise((resolve) => {
      setTimeout(() => {
        stripEl.innerHTML = "";
        const count = 20;
        for (let i = 0; i < count; i++) {
          const sym = i === count - 1 ? finalSymbol : pickSymbol();
          const div = document.createElement("div");
          div.className = "reel-symbol";
          div.innerHTML = `<span>${sym.emoji}</span><span class="sym-label">${sym.label}</span>`;
          stripEl.appendChild(div);
        }
        const farY = (count - 2) * SYMBOL_HEIGHT;
        stripEl.style.transition = "none";
        stripEl.style.transform = `translateY(${farY}px)`;
        void stripEl.offsetHeight;
        stripEl.style.transition = `transform ${duration}ms cubic-bezier(.17,.67,.35,1.05)`;
        const endY = -(count - 1) * SYMBOL_HEIGHT;
        stripEl.style.transform = `translateY(${endY}px)`;

        let settled = false;
        function settleReel() {
          if (settled) return;
          settled = true;
          stripEl.innerHTML = "";
          const d = document.createElement("div");
          d.className = "reel-symbol";
          d.innerHTML = `<span>${finalSymbol.emoji}</span><span class="sym-label">${finalSymbol.label}</span>`;
          stripEl.appendChild(d);
          stripEl.style.transition = "none";
          stripEl.style.transform = "translateY(0)";
          reelEl.classList.remove("spinning");
          resolve();
        }
        stripEl.addEventListener("transitionend", settleReel, { once: true });
        setTimeout(settleReel, duration + 500);
      }, delay);
    });
  }

  /* ------------------------------------------------------------------
     EVALUATE RESULT
  ------------------------------------------------------------------ */
  function evaluate(symbols) {
    const counts = {};
    symbols.forEach((s) => { counts[s.label] = (counts[s.label] || 0) + 1; });
    const max = Math.max(...Object.values(counts));
    const total = symbols.reduce((a, s) => a + s.value, 0);
    if (max === 5) return { tier: "jackpot",    label: "🎰 JACKPOT! ALL MATCH!",        score: total * 50 };
    if (max === 4) return { tier: "win-big",    label: "💎 MEGA WIN — 4 of a kind!",    score: total * 12 };
    if (max === 3) return { tier: "win-medium", label: "⭐ BIG WIN — 3 of a kind!",     score: total * 5  };
    if (max === 2) return { tier: "win-small",  label: "✅ WIN — pair found!",           score: total * 2  };
    return           { tier: "lose",          label: "🔄 No match. Spin again.",        score: 0          };
  }

  /* ------------------------------------------------------------------
     AUTH TOKEN
  ------------------------------------------------------------------ */
  function getAuthToken() { return (window.BITCOIN_CRUSHER_TOKEN || "").trim(); }

  /* ------------------------------------------------------------------
     GITHUB API — TRIGGER SAVE-SPIN WORKFLOW
  ------------------------------------------------------------------ */
  async function commitSpinRecord(spinData) {
    const token = getAuthToken();
    const { owner, repo, branch } = cfg;
    if (!token || !owner || !repo) {
      log("⚠️  GHP secret not available — skipping repo commit (local spin only).", "warn");
      return null;
    }
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `spins/spin-${ts}.json`;
    if (!/^spins\/spin-[\dT-]+\.json$/.test(filename)) {
      log("❌ Invalid spin filename — aborting commit.", "err");
      return null;
    }
    const targetBranch = branch || "main";
    const dispatchUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/save-spin.yml/dispatches`;
    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    try {
      log(`📡 Submitting spin → ${filename}`, "");
      const res = await fetch(dispatchUrl, {
        method: "POST", headers,
        body: JSON.stringify({
          ref: targetBranch,
          inputs: { spin_data: JSON.stringify(spinData, null, 2), filename },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        log(`❌ GitHub API error ${res.status}: ${err.message || res.statusText}`, "err");
        return null;
      }
      const actionsUrl = `https://github.com/${owner}/${repo}/actions`;
      log(`✅ Spin queued → ${filename} (workflow running…)`, "ok");
      return { sha: null, url: actionsUrl, filename };
    } catch (e) {
      log(`❌ Network error: ${e.message}`, "err");
      return null;
    }
  }

  /* ------------------------------------------------------------------
     COIN BURST
  ------------------------------------------------------------------ */
  function burstCoins(count = 6) {
    const machine = $("machine");
    const emojis = ["💰", "💎", "₿", "⭐", "🥇", "🪙"];
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const el = document.createElement("div");
        el.className = "coin-burst";
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = `${10 + Math.random() * 80}%`;
        el.style.top  = `${20 + Math.random() * 50}%`;
        machine.appendChild(el);
        el.addEventListener("animationend", () => el.remove(), { once: true });
      }, i * 80);
    }
  }

  /* ------------------------------------------------------------------
     LEVER
  ------------------------------------------------------------------ */
  function pullLever() {
    lever.classList.add("pulled");
    setTimeout(() => lever.classList.remove("pulled"), 500);
  }

  /* ------------------------------------------------------------------
     LOGGER
  ------------------------------------------------------------------ */
  function log(msg, type = "") {
    const ts   = new Date().toLocaleTimeString();
    const line = `[${ts}] ${msg}\n`;
    if (type === "err")  consoleLog.innerHTML += `<span class="log-err">${escHtml(line)}</span>`;
    else if (type === "ok")   consoleLog.innerHTML += `<span class="log-ok">${escHtml(line)}</span>`;
    else if (type === "warn") consoleLog.innerHTML += `<span class="log-warn">${escHtml(line)}</span>`;
    else consoleLog.textContent += line;
    consoleLog.scrollTop = consoleLog.scrollHeight;
  }

  function escHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  }

  /* ------------------------------------------------------------------
     RESEARCH PANEL — show preview after spin
  ------------------------------------------------------------------ */
  function renderResearchPreview(article) {
    const panel   = $("researchPanel");
    const preview = $("researchPreview");
    const meta    = $("researchPanelMeta");
    if (!panel || !preview || !article) return;
    meta.textContent = `${article.tokenId || "token pending"} · ${article.evidenceStatus || "pending"} · ${(article.sources || []).length} real source${(article.sources || []).length === 1 ? "" : "s"}`;
    preview.innerHTML = `
      <div class="res-title">${escHtml(article.title)}</div>
      <div class="res-meta">
        <span>👥 ${escHtml((article.authors || []).join(", "))}</span>
        <span>📰 ${escHtml(article.journal)} (${article.year})</span>
        <span>DOI: ${escHtml(article.doi)}</span>
      </div>
      <div class="res-keywords">${(article.keywords || []).map((k) => `<span class="res-kw">${escHtml(k)}</span>`).join("")}</div>
      <div class="res-abstract">${escHtml(article.abstract)}</div>
    `;
    panel.style.display = "";
  }

  /* ------------------------------------------------------------------
     RESEARCH MODAL — show full article
  ------------------------------------------------------------------ */
  function showResearchModal(article) {
    if (!article) return;
    const body = $("researchModalBody");
    const extCtx = article.externalContext
      ? `<div class="res-section"><h4>🦆 DuckDuckGo Context <span class="res-source">(${escHtml(article.externalContext.source)})</span></h4>
          <p>${escHtml(article.externalContext.abstract)}</p>
          ${article.externalContext.url ? `<a class="res-link" href="${escHtml(article.externalContext.url)}" target="_blank" rel="noopener noreferrer">↗ Read more</a>` : ""}
          ${(article.externalContext.relatedTopics || []).length ? `<div class="res-related">${article.externalContext.relatedTopics.map((t) => `<span class="res-kw">${escHtml(t)}</span>`).join("")}</div>` : ""}
        </div>` : "";

    const archSrc = (article.archiveSources || []).length
      ? `<div class="res-section"><h4>🗄️ Archive.org Sources</h4>
          <ul class="res-refs">${article.archiveSources.map((s) => `<li><a class="res-link" href="${escHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escHtml(s.title || s.id)}</a>${s.description ? " — " + escHtml(s.description) : ""}</li>`).join("")}</ul>
        </div>` : "";

    body.innerHTML = `
      <div class="res-title-big">${escHtml(article.title)}</div>
      <div class="res-meta-big">
        <span>👥 ${escHtml((article.authors || []).join(", "))}</span>
        <span>📰 ${escHtml(article.journal)} ${article.year}</span>
        <span>Evidence: ${escHtml(article.evidenceStatus || "pending")}</span>\n        <span>Sources: ${(article.sources || []).length}</span>
        <span>DOI: ${escHtml(article.doi)}</span>
        <span>Spin #${article.spinNumber} · Score: ${article.tokenValue}</span>
        ${article.searchEnriched ? '<span class="res-badge enriched">🌐 Search Enriched</span>' : ""}
      </div>
      <div class="res-keywords">${(article.keywords || []).map((k) => `<span class="res-kw">${escHtml(k)}</span>`).join("")}</div>
      <div class="res-section"><h4>Abstract</h4><p>${escHtml(article.abstract)}</p></div>
      <div class="res-section"><h4>1. Introduction</h4><p>${escHtml(article.introduction)}</p></div>
      <div class="res-section"><h4>2. Materials &amp; Methods</h4><p>${escHtml(article.methods)}</p></div>
      <div class="res-section"><h4>3. Results</h4><p>${escHtml(article.results)}</p></div>
      <div class="res-section"><h4>4. Discussion</h4><p>${escHtml(article.discussion)}</p></div>
      <div class="res-section"><h4>5. Conclusion</h4><p>${escHtml(article.conclusion)}</p></div>
      ${extCtx}
      ${archSrc}
      <div class="res-section"><h4>References</h4>
        <ul class="res-refs">${(article.references || []).map((r) => `<li>${escHtml(r)}</li>`).join("")}</ul>
      </div>
    `;
    const overlay = $("researchOverlay");
    overlay.removeAttribute("aria-hidden");
    overlay.style.display = "flex";
  }

  function closeResearchModal() {
    const overlay = $("researchOverlay");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.display = "none";
  }

  /* ------------------------------------------------------------------
     DOWNLOAD RECEIPT
  ------------------------------------------------------------------ */
  function downloadReceipt(spinData, commitInfo, article) {
    const receipt = Object.assign({}, spinData, {
      receipt: true,
      commitFilename: commitInfo ? commitInfo.filename : null,
      commitSha: commitInfo ? commitInfo.sha : null,
      commitUrl: commitInfo ? commitInfo.url : null,
      researchArticle: article || null,
    });
    const blob = new Blob([JSON.stringify(receipt, null, 2) + "\n"], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const ts   = new Date(spinData.timestamp).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const a    = document.createElement("a");
    a.href = url; a.download = `receipt-spin-${ts}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    log(`📥 Receipt downloaded: receipt-spin-${ts}.json`, "ok");
  }

  /* ------------------------------------------------------------------
     EXPORT ALL SPINS
  ------------------------------------------------------------------ */
  function exportAllSpins() {
    if (!history.length) { log("ℹ️  No spins to export yet.", "warn"); return; }
    window.RESEARCH.downloadExport(history);
    log(`📦 Exported ${history.length} spin${history.length !== 1 ? "s" : ""} as HTML report.`, "ok");
  }

  /* ------------------------------------------------------------------
     HISTORY RENDER
  ------------------------------------------------------------------ */
  function addHistoryItem(spinData, commitInfo, article) {
    history.unshift({ spinData, commitInfo, article });
    histCountEl.textContent = `${history.length} spin${history.length !== 1 ? "s" : ""}`;

    const item = document.createElement("div");
    const isJackpot = spinData.tier === "jackpot";
    const isWin = spinData.tier !== "lose";
    item.className = `hist-item${isJackpot ? " jackpot-item" : ""}`;

    const resultClass = isJackpot ? "jackpot" : isWin ? "win" : "";
    const commitHtml = commitInfo
      ? commitInfo.sha
        ? `<div class="hist-commit">📝 <a href="${escHtml(commitInfo.url)}" target="_blank" rel="noreferrer">${escHtml(commitInfo.sha)}</a> — ${escHtml(commitInfo.filename)}</div>`
        : `<div class="hist-commit">📡 <a href="${escHtml(commitInfo.url)}" target="_blank" rel="noreferrer">queued</a> — ${escHtml(commitInfo.filename)}</div>`
      : `<div class="hist-commit" style="color:var(--muted2)">⚡ local only</div>`;

    const artSnippet = article
      ? `<div class="hist-research">🔬 ${escHtml(article.title.slice(0, 80))}${article.title.length > 80 ? "…" : ""}</div>`
      : "";

    item.innerHTML = `
      <div class="hist-symbols">${spinData.symbols.join(" ")}</div>
      <div class="hist-result ${resultClass}">${escHtml(spinData.result)}</div>
      <div class="hist-time">Spin #${spinData.spinNumber} · +${spinData.score} pts · ${new Date(spinData.timestamp).toLocaleTimeString()}</div>
      ${artSnippet}
      ${commitHtml}
    `;

    // Buttons
    const receiptBtn = document.createElement("button");
    receiptBtn.className = "btn btn-xs btn-ghost hist-receipt-btn";
    receiptBtn.textContent = "📥 Receipt";
    receiptBtn.addEventListener("click", () => downloadReceipt(spinData, commitInfo, article));
    item.appendChild(receiptBtn);

    if (article) {
      const viewBtn = document.createElement("button");
      viewBtn.className = "btn btn-xs btn-ghost hist-receipt-btn";
      viewBtn.textContent = "🔬 Research";
      viewBtn.addEventListener("click", () => showResearchModal(article));
      item.appendChild(viewBtn);
    }

    if (!historyEl.children.length) historyEl.appendChild(item);
    else historyEl.insertBefore(item, historyEl.firstChild);

    runAiAnalysis();
  }

  /* ------------------------------------------------------------------
     MAIN SPIN FUNCTION
  ------------------------------------------------------------------ */
  async function spin() {
    if (isSpinning) return;
    const userResearchInput = researchIdeaEl ? researchIdeaEl.value.trim() : "";
    if (!userResearchInput) {
      resultText.textContent = "Enter YOUR IDEA OR SEARCH TOPIC before spinning.";
      if (researchIdeaStatusEl) {
        researchIdeaStatusEl.textContent = "Research words are required so the token has a real subject.";
        researchIdeaStatusEl.className = "auth-msg err";
      }
      if (researchIdeaEl) researchIdeaEl.focus();
      log("⚠️ Enter your own research words before spinning.", "warn");
      return;
    }
    if (researchIdeaStatusEl) {
      researchIdeaStatusEl.textContent = "Input captured. The spin will research and tokenize these words.";
      researchIdeaStatusEl.className = "auth-msg ok";
    }
    isSpinning = true;
    spinBtn.disabled = true;

    pullLever();
    resultBar.className = "result-bar";
    resultText.textContent = "Spinning…";
    winOverlay.textContent = "";
    winOverlay.className = "win-overlay";

    const finalSymbols = Array.from({ length: REEL_COUNT }, () => pickSymbol());
    log(`🎰 SPIN #${spinCount + 1} — rolling reels…`);

    const BASE_DURATION = 900;
    const promises = strips.map((strip, i) => {
      const reelEl = $(`reel${i}`);
      reelEl.classList.add("spinning");
      return animateReel(reelEl, strip, finalSymbols[i], i * 220, BASE_DURATION + i * 180);
    });
    await Promise.all(promises);

    spinCount++;
    spinCounterEl.textContent = spinCount;

    const evalResult = evaluate(finalSymbols);
    totalScore += evalResult.score;
    scoreCounterEl.textContent = totalScore;

    resultBar.className = `result-bar ${evalResult.tier !== "lose" ? evalResult.tier : ""}`;
    resultText.textContent = evalResult.label;

    if (evalResult.tier === "jackpot") {
      winOverlay.textContent = "🎰 JACKPOT! 🎰";
      winOverlay.className = "win-overlay show";
      burstCoins(14);
      setTimeout(() => { winOverlay.className = "win-overlay"; }, 2800);
    } else if (evalResult.tier === "win-big")    burstCoins(8);
    else if (evalResult.tier === "win-medium")   burstCoins(4);

    const spinData = {
      spinNumber: spinCount,
      timestamp: new Date().toISOString(),
      symbols: finalSymbols.map((s) => s.emoji),
      symbolLabels: finalSymbols.map((s) => s.label),
      symbolValues: finalSymbols.map((s) => s.value),
      userResearchInput,
      result: evalResult.label,
      tier: evalResult.tier,
      score: evalResult.score,
      totalScore,
      repo: cfg.owner && cfg.repo ? `${cfg.owner}/${cfg.repo}` : "unset",
      deviceId: deviceId.join(" "),
    };

    log(`   Result: ${evalResult.label} (+${evalResult.score} pts, total: ${totalScore})`);

    // 1. Generate research article immediately (sync)
    let article = null;
    try {
      article = window.RESEARCH.generateResearchArticle(spinData);
      log(`🔬 Research token generated: "${article.title.slice(0, 60)}…"`, "ok");
      renderResearchPreview(article);
      lastArticle = article;
    } catch (e) {
      log(`⚠️  Research generation failed: ${e.message}`, "warn");
    }

    // Attach article to spin data for commit
    if (article) spinData.researchArticle = article;

    // 2. Retrieve and catalog real scholarly records before saving.
    if (article) {
      try {
        log("🌐 Searching OpenAlex and Crossref for real sources…");
        article = await window.RESEARCH.enrichWithSearch(article);
        lastArticle = article;
        spinData.researchArticle = article;
        renderResearchPreview(article);
        log(`✅ Research token ${article.tokenId || "pending"}: ${(article.sources || []).length} sources · SHA-256 ${article.hash || "unavailable"}`, "ok");
      } catch (e) {
        log(`⚠️ Source retrieval failed; saving a clearly labeled pending queue: ${e.message}`, "warn");
      }
    }

    // 3. Save only after the evidence package is finalized or labeled pending.
    const commitInfo = await commitSpinRecord(spinData);
    addHistoryItem(spinData, commitInfo, article);
    // 4. Update auth stats if logged in
    const user = window.AUTH ? window.AUTH.currentUser() : null;
    if (user) {
      window.AUTH.updateUserStats(user.username, spinCount, totalScore);
      if (article) {
        window.AUTH.addTokenToUser(user.username, {
          spinNumber: spinData.spinNumber,
          timestamp: spinData.timestamp,
          tier: spinData.tier,
          score: spinData.score,
          title: article.title,
          userInput: article.userInput,
          tokenId: article.tokenId,
          hash: article.hash,
          doi: article.doi,
        });
      }
    }

    isSpinning = false;
    spinBtn.disabled = false;
  }

  /* ------------------------------------------------------------------
     AI RESEARCH CHAT
  ------------------------------------------------------------------ */
  const chatLog  = $("chatLog");
  const chatInput = $("chatInput");

  function appendChatMsg(role, text) {
    const div = document.createElement("div");
    div.className = `chat-msg ${role}`;
    const avatar = role === "ai" ? "🤖" : "👤";
    div.innerHTML = `<span class="chat-avatar">${avatar}</span><span class="chat-bubble">${escHtml(text)}</span>`;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function appendChatHtml(role, html) {
    const div = document.createElement("div");
    div.className = `chat-msg ${role}`;
    const avatar = role === "ai" ? "🤖" : "👤";
    div.innerHTML = `<span class="chat-avatar">${avatar}</span><span class="chat-bubble">${html}</span>`;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  async function handleChat() {
    const rawInput = chatInput.value.trim();
    if (!rawInput) return;
    chatInput.value = "";

    // Show user message
    appendChatMsg("user", rawInput);

    // Thinking indicator
    const thinkDiv = document.createElement("div");
    thinkDiv.className = "chat-msg ai chat-thinking";
    thinkDiv.innerHTML = `<span class="chat-avatar">🤖</span><span class="chat-bubble">🔍 Searching…</span>`;
    chatLog.appendChild(thinkDiv);
    chatLog.scrollTop = chatLog.scrollHeight;

    let responseHtml = "";

    try {
      const [ddgResult, archiveResult] = await Promise.allSettled([
        window.RESEARCH.searchDDG(rawInput),
        window.RESEARCH.searchArchive(rawInput),
      ]);

      const parts = [];

      if (ddgResult.status === "fulfilled" && ddgResult.value && ddgResult.value.abstract) {
        const d = ddgResult.value;
        parts.push(`<strong>🦆 ${escHtml(d.source || "DuckDuckGo")}:</strong><br>${escHtml(d.abstract)}`);
        if (d.url) parts.push(`<a class="chat-link" href="${escHtml(d.url)}" target="_blank" rel="noopener noreferrer">↗ Read more</a>`);
        if (d.relatedTopics && d.relatedTopics.length) {
          parts.push(`<br><strong>Related:</strong> ${d.relatedTopics.map((t) => `<span class="res-kw">${escHtml(t.slice(0, 60))}</span>`).join(" ")}`);
        }
      }

      if (archiveResult.status === "fulfilled" && archiveResult.value.length > 0) {
        const items = archiveResult.value.slice(0, 3);
        parts.push(`<br><strong>🗄️ Archive.org Sources:</strong><br>${items.map((s) => `• <a class="chat-link" href="${escHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escHtml(s.title || s.id)}</a>`).join("<br>")}`);
      }

      if (!parts.length) {
        parts.push(`No live source summary was returned for "<em>${escHtml(rawInput)}</em>". No answer was invented. Try narrower keywords or open the <a class="chat-link" href="research-workspace.html">full research workspace</a> to search OpenAlex and Crossref.`);
      }

      responseHtml = parts.join("<br>");
    } catch (e) {
      responseHtml = `⚠️ Search error: ${escHtml(e.message)}. Please try again.`;
    }

    // Remove thinking indicator, add real response
    thinkDiv.remove();
    appendChatHtml("ai", responseHtml);

    // Save conversation if logged in
    const user = window.AUTH ? window.AUTH.currentUser() : null;
    if (user) {
      const aiText = responseHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      window.AUTH.saveConversation(user.username, rawInput, aiText).catch(() => {});
    }
  }

  /* ------------------------------------------------------------------
     CONFIG
  ------------------------------------------------------------------ */
  function readInputsToCfg() {
    cfg.owner  = $("cfgOwner").value.trim()  || cfg.owner;
    cfg.repo   = $("cfgRepo").value.trim()   || cfg.repo;
    cfg.branch = $("cfgBranch").value.trim() || "main";
    updateRepoLink();
  }
  function pushCfgToInputs() {
    $("cfgOwner").value  = cfg.owner;
    $("cfgRepo").value   = cfg.repo;
    $("cfgBranch").value = cfg.branch;
    updateRepoLink();
  }
  function updateRepoLink() {
    const link = $("repoLink");
    const row  = $("repoLinkRow");
    if (cfg.owner && cfg.repo && link) {
      link.href = `https://github.com/${cfg.owner}/${cfg.repo}`;
      if (row) row.style.display = "";
    } else if (row) { row.style.display = "none"; }
  }
  const CFG_KEY = "bitcoin_crusher_cfg_v1";
  function saveCfg() {
    readInputsToCfg();
    localStorage.setItem(CFG_KEY, JSON.stringify({ owner: cfg.owner, repo: cfg.repo, branch: cfg.branch }));
    log("✅ Config saved.", "ok");
  }
  function loadCfg() {
    const raw = localStorage.getItem(CFG_KEY);
    if (!raw) { log("ℹ️  No saved config found.", "warn"); return; }
    try {
      Object.assign(cfg, JSON.parse(raw));
      pushCfgToInputs();
      log(`✅ Config loaded: ${cfg.owner}/${cfg.repo} (branch: ${cfg.branch})`, "ok");
    } catch (e) {
      localStorage.removeItem(CFG_KEY);
      log(`⚠️  Could not load saved config (${e.message}). It has been cleared.`, "warn");
    }
  }
  function clearCfg() {
    localStorage.removeItem(CFG_KEY);
    cfg = { owner: "", repo: "", branch: "main" };
    pushCfgToInputs();
    log("🧼 Config cleared.", "warn");
  }

  /* ------------------------------------------------------------------
     TICKER
  ------------------------------------------------------------------ */
  function animateTicker() {
    const ticker = $("ticker");
    const messages = [
      "INFINITY SYSTEM ACTIVE — CRUSHING BITCOIN — ∞ ∞ ∞",
      "EVERY SPIN GENERATES A SCIENTIFIC RESEARCH TOKEN",
      "🟡 TOKEN → 👑 WEBSITE → 🔬 RESEARCH → 🦾 TOOLS",
      "B55 GRAVITY ENGINE ENGAGED — SILVER INDEX RISING",
      "₿ BTC → 💎 DIAMOND → 🥇 GOLD → ∞ INFINITY",
      "SIGN IN TO SAVE TOKENS · EVERY SEARCH IS A RECORD",
    ];
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % messages.length;
      ticker.style.opacity = "0";
      setTimeout(() => { ticker.textContent = messages[idx]; ticker.style.opacity = "0.8"; }, 400);
    }, 4000);
  }

  /* ------------------------------------------------------------------
     PREFILL / DEFAULT REPO CONFIG
  ------------------------------------------------------------------ */
  function prefillFromRepoMeta() {
    const m = location.hostname.match(/^([^.]+)\.github\.io$/);
    if (m) {
      cfg.owner = cfg.owner || m[1];
      const pathParts = location.pathname.replace(/^\//, "").split("/");
      if (pathParts[0]) cfg.repo = cfg.repo || pathParts[0];
    }
    cfg.owner  = cfg.owner  || "www-infinity";
    cfg.repo   = cfg.repo   || "Bitcoin-Crusher";
    cfg.branch = cfg.branch || "main";
  }

  /* ------------------------------------------------------------------
     DEVICE IDENTITY
  ------------------------------------------------------------------ */
  const IDENTITY_KEY = "bitcoin_crusher_device_id_v1";
  const ID_PALETTE = [
    "😎","🟦","🟥","🟨","♣️","⬜","🟩","🛸",
    "🌻","💃","🐴","🎷","🔵","🟠","🟤","🟣",
    "⭐","💎","₿","🚀","🔥","🥇","🌕","🧱",
  ];
  function generateRawId() {
    return Array.from({ length: 8 }, () => ID_PALETTE[Math.floor(Math.random() * ID_PALETTE.length)]);
  }
  function loadOrCreateDeviceId() {
    const stored = localStorage.getItem(IDENTITY_KEY);
    if (stored) {
      try {
        const p = JSON.parse(stored);
        if (Array.isArray(p) && p.length === 8) return p;
      } catch (_) {}
    }
    const fresh = generateRawId();
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(fresh));
    return fresh;
  }
  let deviceId = loadOrCreateDeviceId();

  function renderDeviceId() {
    $("identityBlocks").textContent = deviceId.join(" ");
    const ts = localStorage.getItem(IDENTITY_KEY + "_ts") || new Date().toISOString();
    $("identityMeta").textContent = `Signal address · registered ${new Date(ts).toLocaleString()}`;
  }
  function wireIdentity() {
    $("btnCopyId").addEventListener("click", () => {
      navigator.clipboard.writeText(deviceId.join(" ")).then(() => log(`📋 Device ID copied.`, "ok")).catch(() => {});
    });
    $("btnRegenId").addEventListener("click", () => {
      deviceId = generateRawId();
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(deviceId));
      localStorage.setItem(IDENTITY_KEY + "_ts", new Date().toISOString());
      renderDeviceId();
      log("🔄 Device identity regenerated.", "warn");
      aiLog(`♻️  Device ID updated: ${deviceId.join(" ")}`);
    });
    $("identityDisplay").addEventListener("click", () => {
      navigator.clipboard.writeText(deviceId.join(" ")).catch(() => {});
    });
  }

  /* ------------------------------------------------------------------
     AI SIGNAL ANALYSIS
  ------------------------------------------------------------------ */
  const aiLogEl        = $("aiLog");
  const aiDotEl        = $("aiDot");
  const aiStatusTextEl = $("aiStatusText");
  const aiPredictionEl = $("aiPrediction");

  function aiLog(msg) {
    const ts = new Date().toLocaleTimeString();
    aiLogEl.textContent += `[${ts}] ${msg}\n`;
    aiLogEl.scrollTop = aiLogEl.scrollHeight;
  }
  function setAiStatus(state, text) {
    aiDotEl.className = `ai-dot${state ? " " + state : ""}`;
    aiStatusTextEl.textContent = text;
  }
  function computeFrequency(spins) {
    const freq = {};
    for (const { spinData } of spins) {
      for (const sym of spinData.symbolLabels) freq[sym] = (freq[sym] || 0) + 1;
    }
    return freq;
  }
  function topN(freq, n) {
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, count]) => {
      const sym = SYMBOLS.find((s) => s.label === label);
      return { label, emoji: sym ? sym.emoji : "?", count };
    });
  }
  function detectStreak(spins) {
    if (!spins.length) return { type: "none", length: 0 };
    let current = spins[0].spinData.tier !== "lose" ? "win" : "lose";
    let length = 0;
    for (const { spinData } of spins) {
      const isWin = spinData.tier !== "lose";
      if ((isWin && current === "win") || (!isWin && current === "lose")) length++;
      else break;
    }
    return { type: current, length };
  }
  function buildSignalReport(spins) {
    if (spins.length < 3) return "Collecting signal data… spin at least 3 times for analysis.";
    const freq = computeFrequency(spins);
    const hot = topN(freq, 3);
    const streak = detectStreak(spins);
    const winRate = spins.filter((s) => s.spinData.tier !== "lose").length / spins.length;
    const avgScore = spins.reduce((a, s) => a + s.spinData.score, 0) / spins.length;
    const lines = [
      `📊 SIGNAL REPORT — ${spins.length} spins analysed`,
      `Win rate: ${(winRate * 100).toFixed(1)}%  |  Avg score/spin: ${avgScore.toFixed(1)}`,
      `Hot symbols: ${hot.map((h) => `${h.emoji}${h.label}(×${h.count})`).join("  ")}`,
    ];
    if (streak.length >= 2) {
      if (streak.type === "win") lines.push(`🔥 Win streak: ${streak.length} in a row — signal is hot`);
      else lines.push(`❄️  Lose streak: ${streak.length} in a row — pattern shift expected`);
    }
    const lastTier = spins[0].spinData.tier;
    if (lastTier === "jackpot")           lines.push("🎰 JACKPOT detected in last spin — peak signal achieved");
    else if (lastTier === "win-big")      lines.push("💎 Mega-win energy — signal momentum building");
    else if (winRate > 0.55)             lines.push("📈 Signal above average — continue sequence");
    else if (winRate < 0.25 && spins.length >= 5) lines.push("📉 Low signal density — reels recalibrating");
    lines.push(`\n🪪 Device: ${deviceId.join(" ")}`);
    return lines.join("\n");
  }
  function runAiAnalysis() {
    if (!history.length) return;
    setAiStatus("thinking", "Analysing signal patterns…");
    setTimeout(() => {
      const report = buildSignalReport(history);
      aiPredictionEl.textContent = report;
      aiPredictionEl.className = "ai-prediction visible";
      setAiStatus("active", `Signal analysis complete · ${history.length} data point${history.length !== 1 ? "s" : ""}`);
      aiLog(`🤖 Analysis updated after spin #${spinCount}.`);
    }, 600);
  }

  /* ------------------------------------------------------------------
     AUTH UI
  ------------------------------------------------------------------ */
  function updateAuthUI() {
    const user = window.AUTH ? window.AUTH.currentUser() : null;
    const loginBtn  = $("loginBtn");
    const userBadge = $("userBadge");
    const userBadgeName = $("userBadgeName");
    const userBadgeRole = $("userBadgeRole");
    const adminPanel = $("adminPanel");

    if (user) {
      loginBtn.style.display = "none";
      userBadge.style.display = "flex";
      userBadgeName.textContent = user.username;
      userBadgeRole.textContent = user.role === "admin" ? "👑 Admin" : "👤 Member";
      if (adminPanel) adminPanel.style.display = user.role === "admin" ? "" : "none";
      if (user.role === "admin") renderAdminUserList();
    } else {
      loginBtn.style.display = "";
      userBadge.style.display = "none";
      if (adminPanel) adminPanel.style.display = "none";
    }
  }

  function renderAdminUserList() {
    const el = $("adminUserList");
    if (!el || !window.AUTH) return;
    const users = window.AUTH.getUserList();
    if (!users.length) { el.innerHTML = ""; return; }
    el.innerHTML = `<div style="margin-top:12px;font-weight:800;font-size:14px;color:var(--gold)">👥 Users (${users.length})</div>
      <div style="margin-top:8px;display:grid;gap:6px">` +
      users.map((u) => `<div style="background:rgba(0,0,0,.3);border-radius:8px;padding:8px 12px;font-size:12px;font-family:var(--mono)">
        <strong>${escHtml(u.username)}</strong> (${escHtml(u.role)}) · ${escHtml(u.email)} · spins: ${u.spinCount} · score: ${u.totalScore}
      </div>`).join("") + "</div>";
  }

  function openLoginModal() {
    const overlay = $("loginOverlay");
    overlay.removeAttribute("aria-hidden");
    overlay.style.display = "flex";
    $("loginUser").focus();
  }
  function closeLoginModal() {
    const overlay = $("loginOverlay");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.display = "none";
  }

  function wireAuth() {
    const overlay = $("loginOverlay");

    // Tab switching
    $("tabLogin").addEventListener("click", () => {
      $("tabLogin").classList.add("active");
      $("tabRegister").classList.remove("active");
      $("loginForm").style.display = "";
      $("registerForm").style.display = "none";
    });
    $("tabRegister").addEventListener("click", () => {
      $("tabRegister").classList.add("active");
      $("tabLogin").classList.remove("active");
      $("loginForm").style.display = "none";
      $("registerForm").style.display = "";
      $("regUser").focus();
    });

    $("loginBtn").addEventListener("click", openLoginModal);
    $("loginClose").addEventListener("click", closeLoginModal);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeLoginModal(); });

    $("btnLogin").addEventListener("click", async () => {
      const msg = $("loginMsg");
      msg.textContent = "Signing in…";
      msg.className = "auth-msg";
      try {
        const u = await window.AUTH.login($("loginUser").value.trim(), $("loginPass").value);
        msg.textContent = `✅ Welcome back, ${u.username}!`;
        msg.className = "auth-msg ok";
        setTimeout(() => {
          closeLoginModal();
          updateAuthUI();
          log(`✅ Signed in as ${u.username} (${u.role}).`, "ok");
          // Save profile to repo on login
          if (getAuthToken() && cfg.owner && cfg.repo) {
            window.AUTH.saveProfileToRepo(u.username, getAuthToken(), cfg.owner, cfg.repo, cfg.branch);
          }
        }, 800);
      } catch (e) {
        msg.textContent = `❌ ${e.message}`;
        msg.className = "auth-msg err";
      }
    });

    $("btnRegister").addEventListener("click", async () => {
      const msg = $("registerMsg");
      msg.textContent = "Creating account…";
      msg.className = "auth-msg";
      try {
        const u = await window.AUTH.register(
          $("regUser").value.trim(),
          $("regEmail").value.trim(),
          $("regPass").value
        );
        msg.textContent = `✅ Account created! Welcome, ${u.username}!`;
        msg.className = "auth-msg ok";
        setTimeout(() => {
          closeLoginModal();
          updateAuthUI();
          log(`✅ Registered and signed in as ${u.username}.`, "ok");
          if (getAuthToken() && cfg.owner && cfg.repo) {
            window.AUTH.saveProfileToRepo(u.username, getAuthToken(), cfg.owner, cfg.repo, cfg.branch);
          }
        }, 800);
      } catch (e) {
        msg.textContent = `❌ ${e.message}`;
        msg.className = "auth-msg err";
      }
    });

    $("logoutBtn").addEventListener("click", () => {
      window.AUTH.logout();
      updateAuthUI();
      log("👋 Signed out.", "warn");
    });

    // Enter key for login
    [$("loginUser"), $("loginPass")].forEach((el) => {
      el.addEventListener("keydown", (e) => { if (e.key === "Enter") $("btnLogin").click(); });
    });
    [$("regUser"), $("regEmail"), $("regPass")].forEach((el) => {
      el.addEventListener("keydown", (e) => { if (e.key === "Enter") $("btnRegister").click(); });
    });
  }

  /* ------------------------------------------------------------------
     HAMBURGER MENU
  ------------------------------------------------------------------ */
  function wireHamburger() {
    const hamBtn     = $("hamBtn");
    const hamDrawer  = $("hamDrawer");
    const hamOverlay = $("hamOverlay");
    const hamClose   = $("hamClose");

    function openHam() {
      hamDrawer.classList.add("open");
      hamOverlay.classList.add("visible");
      hamBtn.setAttribute("aria-expanded", "true");
      hamDrawer.removeAttribute("aria-hidden");
    }
    function closeHam() {
      hamDrawer.classList.remove("open");
      hamOverlay.classList.remove("visible");
      hamBtn.setAttribute("aria-expanded", "false");
      hamDrawer.setAttribute("aria-hidden", "true");
    }
    hamBtn.addEventListener("click", openHam);
    hamClose.addEventListener("click", closeHam);
    hamOverlay.addEventListener("click", closeHam);
  }

  /* ------------------------------------------------------------------
     WIRE EVENTS
  ------------------------------------------------------------------ */
  function wireEvents() {
    spinBtn.addEventListener("click", spin);
    lever.addEventListener("click", () => { if (!isSpinning) spin(); });
    lever.closest(".lever-wrap").addEventListener("click", () => { if (!isSpinning) spin(); });

    $("btnSaveCfg").addEventListener("click", saveCfg);
    $("btnLoadCfg").addEventListener("click", loadCfg);
    $("btnClearCfg").addEventListener("click", clearCfg);
    $("clearLog").addEventListener("click", () => { consoleLog.textContent = ""; });
    $("exportAllBtn").addEventListener("click", exportAllSpins);

    // Research panel
    $("viewResearchBtn").addEventListener("click", () => { if (lastArticle) showResearchModal(lastArticle); });
    $("researchClose").addEventListener("click", closeResearchModal);
    $("researchOverlay").addEventListener("click", (e) => { if (e.target === $("researchOverlay")) closeResearchModal(); });

    // Chat
    $("chatSendBtn").addEventListener("click", handleChat);
    chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } });

    // Keyboard shortcut: space to spin
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !e.target.matches("input,textarea,button")) {
        e.preventDefault();
        if (!isSpinning) spin();
      }
    });

    wireIdentity();
    wireAuth();
    wireHamburger();
  }

  /* ------------------------------------------------------------------
     INIT
  ------------------------------------------------------------------ */
  async function init() {
    prefillFromRepoMeta();
    loadCfg();
    pushCfgToInputs();
    initReels();
    animateTicker();
    wireEvents();

    if (!localStorage.getItem(IDENTITY_KEY + "_ts")) {
      localStorage.setItem(IDENTITY_KEY + "_ts", new Date().toISOString());
    }
    renderDeviceId();
    aiLog(`🪪 Device ID: ${deviceId.join(" ")}`);
    setAiStatus("", "Signal engine ready — awaiting spin data");

    // Ensure admin account is initialised
    if (window.AUTH) {
      await window.AUTH.ensureAdmin();
      updateAuthUI();
    }

    log("🧱 Bitcoin Crusher — Infinity Slot Machine v2 ready.");
    if (window.BITCOIN_CRUSHER_TOKEN && cfg.owner && cfg.repo) {
      log(`✅ Repo: ${cfg.owner}/${cfg.repo} (branch: ${cfg.branch}) — GHP active, spins will be committed.`, "ok");
    } else if (window.BITCOIN_CRUSHER_TOKEN) {
      log("✅ GHP active — spins will be committed once Owner/Repo are configured.", "ok");
    } else {
      log("⚠️  GHP secret not found — spins are local only (no commit will be made).", "warn");
    }
    log("🎰 Hit SPIN & CRUSH (or press Space) to generate a research token!");
    log("🔐 Sign in to save tokens and build your profile in the repo.");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
