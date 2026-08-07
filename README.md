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


## Public product identity

- **Product name:** Bitcoin Crusher
- **Repository address:** `www-infinity4/Bitcoin-Crusher`
- **Suggested domain:** `BitcoinCrusher.com`
- **Domain status:** suggestion only; ownership, DNS, TLS, and deployment are not yet verified
- **Product description:** Turn a question into sourced research, a durable hashed record, and a growing knowledge network.

The repository address remains stable even when the public product name, tagline, domain, navigation, and visual presentation are improved.
