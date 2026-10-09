# Bitcoin Crusher

Bitcoin Crusher is being rebuilt as an Infinity research and knowledge-catalog product.

## Working research workspace

Open [research-workspace.html](research-workspace.html).

The workspace currently:

- accepts user-defined research keywords and questions;
- searches OpenAlex and Crossref for real scholarly records;
- deduplicates publications by DOI or normalized title;
- shows authors, publication venue, year, DOI, indexed citations, and available abstracts;
- labels metadata-only records and unverified full-text status;
- separates researcher notes and theories from published evidence;
- builds an evidence ledger and bibliography;
- exports the brief as Markdown or JSON;
- hashes saved briefs with SHA-256;
- maintains an exportable local research catalog in the browser.

See [RESEARCH_SYSTEM.md](RESEARCH_SYSTEM.md) for the integrity rules, workflow, data model, and next build stages.

## Research engine status

The older random article generator has been removed from `assets/research.js`. The main slot-machine flow now creates a clearly labeled pending research queue, retrieves real OpenAlex and Crossref records, hashes the finalized evidence package, catalogs it locally, and saves it with the spin record when repository saving is configured.

No invented author, journal, DOI, experiment, percentage, or conclusion is used as research evidence.

## Defensive security research

The main branch also contains [AIR_GAP_SECURITY_RESEARCH_QUEUE.md](AIR_GAP_SECURITY_RESEARCH_QUEUE.md), which documents a defensive-only research program for hardware-wallet trust, covert-channel evidence, safe laboratory testing, and countermeasures.

## Build principles

- Real sources before synthesis.
- Every claim traceable to evidence.
- Clear labels for theory, metadata, abstract-level evidence, and verified full text.
- No invented citations or findings.
- Local-first operation with no OAuth or package installation required.
- Repository-backed cataloging added only through a protected write path.


## Permanent Crusher UX and data contracts (October 2026)

- Daylight Oracle appearance: white/light backgrounds, polished purple research cards. Never replace the original slot with a simplified spin display.
- Preserve the original machine: five fully animated weighted reels, twelve original symbols, physical lever, score tiers, win effects and coin bursts.
- Unlimited user research word bank: no four-slot limit, and never autofill missing words. Every manually entered word or tapped suggestion joins the bank, and tapped suggestion buttons replenish.
- Four at spin time only: choose four distinct words from the bank without consuming them. Fewer than four user-collected words blocks spinning.
- Research Quant provenance: a spin has a unique ID, its four-word query, evidence status, article and source trail. Abstracts are not full-text reviews.
- Collect, expand, build: the article can be developed by the writer, collected and turned into twelve or more purple website-direction cards. AI refinement is optional and source constrained.
- Use existing Builder Reserve. Collected articles and directions are stored privately by wallet in the QuantaPhi Cloudflare D1 research collection and read in Builder Reserve. One-click builder navigation is not a token mint.
- Wallet: only completed unique spin IDs earn +0.1 StarCoin, with authenticated idempotent QuantaPhi and StarQuest receipts. Spin credit is not Share credit and must not increase Share counts.

Public pages: https://quantaphi.org/bitcoin-crusher/ and https://quantaphi.org/builder-reserve/

## Public product identity

- **Product name:** Bitcoin Crusher
- **Repository address:** `www-infinity4/Bitcoin-Crusher`
- **Live hosting:** `https://quantaphi.org/bitcoin-crusher/` via the QuantaPhi Cloudflare site router
- **Product description:** Turn a question into sourced research, a durable hashed record, and a growing knowledge network.

The repository address remains stable even when the public product name, tagline, domain, navigation, and visual presentation are improved.
