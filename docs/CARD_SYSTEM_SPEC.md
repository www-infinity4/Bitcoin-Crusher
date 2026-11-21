# Quantaφ Card System Specification

**Purpose**: Translate the conceptual card ideas into concrete UI components, data requirements, interaction rules, and a minimal JSON schema for each card type. This document is the single source of truth for designers, developers, and automated tests.

---

## Ticker Card

**Component**: `<quanta-ticker-card>`

**Description**: A high‑visibility market ticker that cycles through all tracked tickers, flashing a fresh chart every 10 seconds.

**Data Source**: Global market ticker API (e.g., `https://api.example.com/market/tickers`).

**Default Behavior**:
- Selects *all* available tickers on load.
- Auto‑cycles every 10 seconds.
- Clicking a chart opens the **Quantaφ Site Viewer** in split‑screen mode and locks the chart.

**User Actions**:
- **Follow Filter** button opens a modal with a checklist of all tracked entities. Users can **Follow All** or toggle individual items.
- **Split‑Screen Lock** as described above.

**Design Tokens**: Uses CSS variables from `oracle-interface.css` – `--card-bg`, `--card-fg`, `--accent-color`.

**Accessibility**: Focus outline on the card, ARIA‑label `"Market ticker card"`, minimum touch target 44 px.

**JSON Schema Snippet**:
```json
{
  "component": "quanta-ticker-card",
  "dataSource": "marketTickerApi",
  "defaultBehavior": {
    "autoCycle": true,
    "cycleIntervalSec": 10,
    "initialSelection": "all"
  }
}
```

---

## Ledger Lore Card

**Component**: `<quanta-ledger-lore-card>`

**Description**: Generates short, fantasy‑style merchant logs or sci‑fi receipts when a user spends Star Coins, rents billboard spots, or performs mock checkouts.

**Data Source**: Internal transaction log (`/api/transactions`) and Star Coin balance service.

**Default Behavior**:
- Listens for transaction events.
- Renders a stylized receipt with item, amount, and narrative text.

**User Actions**:
- None required; the card updates automatically on each transaction.

**Design Tokens**: Reuses `--card-bg` and `--accent-color` for a parchment look.

**Accessibility**: Provides `role="log"` and live region updates.

**JSON Schema Snippet**:
```json
{
  "component": "quanta-ledger-lore-card",
  "dataSource": "transactionLog",
  "defaultBehavior": {
    "autoUpdate": true,
    "format": "fantasy"
  }
}
```

---

## Artifact Appraisal Card

**Component**: `<quanta-artifact-appraisal-card>`

**Description**: Shows a dynamic inventory showcase that recalculates the rarity and "weight" of a user's collection relative to global runner data.

**Data Source**: User asset inventory API (`/api/user/assets`) and global rarity service.

**Default Behavior**:
- Pulls the user's asset list on mount.
- Calculates rarity scores and displays them in a sortable table.

**User Actions**:
- Click column headers to sort.
- Hover for tooltip details.

**Design Tokens**: Uses `--card-bg`, `--card-fg`, and `--highlight-color`.

**Accessibility**: Table markup with proper `<th scope="col">` and keyboard navigation support.

**JSON Schema Snippet**:
```json
{
  "component": "quanta-artifact-appraisal-card",
  "dataSource": "userAssets",
  "defaultBehavior": {
    "showRarity": true,
    "sortable": true
  }
}
```

---

## Gravity Well Card

**Component**: `<quanta-gravity-well-card>`

**Description**: Heat‑map visualization of where users hover longest (e.g., green arms, black shoes, toggle buttons). The card influences the priority of the owner job queue based on dwell time.

**Data Source**: Front‑end interaction telemetry (`/api/telemetry/hover`) aggregated per UI element.

**Default Behavior**:
- Receives live hover‑duration data.
- Renders a heat‑map overlay on the main page layout.
- Emits priority‑adjustment events for the job queue.

**User Actions**:
- Hovering naturally drives the visualization; no explicit clicks required.

**Design Tokens**: Gradient colors from `--heatmap-cold` to `--heatmap-hot` defined in `oracle-interface.css`.

**Accessibility**: Provides a toggle to disable heat‑map for users with motion sensitivity.

**JSON Schema Snippet**:
```json
{
  "component": "quanta-gravity-well-card",
  "dataSource": "hoverTelemetry",
  "defaultBehavior": {
    "liveUpdate": true,
    "affectsJobQueue": true
  }
}
```
