# Quantaφ Card System Expansion – Specification

## Overview
This document maps the conceptual cards described in the **Quantaφ Card System Expansion Bundle** to concrete implementation outlines for the **Bitcoin‑Crusher** repository.

| Card | Description | UI Elements | Data Sources | Integration Points |
|------|-------------|-------------|--------------|--------------------|
| **Main Ticker Card** | High‑visibility market ticker that cycles through all tracked tickers every 10 s. | Container `#main-ticker-card`, chart canvas, **Follow Filter** button, **Split‑Screen Lock** interaction. | Global market APIs, internal ticker registry. | Opens chart in the existing **Quantaφ Site Viewer** when locked. |
| **Ledger Lore Card** | Fantasy‑style receipt of Star‑Coin spend, billboard rentals, mock check‑outs. | Container `#ledger-lore-card`, text area for generated lore. | Star‑Coin transaction logs, mock checkout events. | Uses existing **cloud‑wallet-client.js** for transaction data. |
| **Artifact Appraisal Card** | Shows user’s collected digital assets (e.g., purple build cards) with rarity/weight calculations. | Container `#artifact-appraisal-card`, inventory grid, rarity badge. | Runner‑wide asset registry, per‑user collection metadata. | Pulls global rarity stats from the **TV‑Database** module. |
| **Gravity‑Well Card** | Heat‑map visualisation of hover‑time on UI elements (green arms, black shoes, toggles). | Container `#gravity-well-card`, heat‑map canvas. | UI interaction telemetry (mouse‑over duration). | Feeds back into the owner‑job queue priority system. |

## Technical Outline
1. **Specification Markdown** – this file.
2. **Placeholder JS Modules** – one per card under `assets/` exporting a `render(container, data)` function that injects a minimal HTML skeleton.
3. **CSS Styles** – `assets/card-styles.css` defines `.card‑ticker`, `.card‑ledger`, `.card‑artifact`, `.card‑gravity` following the Oracle‑interface palette (white surface, warm ink, red accents, 18 px radius, 44 px touch targets).
4. **Index Page Integration** – add empty `<section>` placeholders with IDs (`main-ticker-card`, `ledger-lore-card`, `artifact-appraisal-card`, `gravity-well-card`) and load the new JS/CSS assets.
5. **GitHub Actions Workflow** – ` .github/workflows/card-system-tests.yml` runs a Node test suite on every push/PR affecting the new assets.
6. **Test Suite** – `tests/card-system.test.cjs` verifies each module exports a `render` function.

All new files are deliberately lightweight placeholders; functional logic will be filled in by subsequent development cycles.
