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

## Important legacy status

The slot-machine interface on this branch contains an older random article generator in `assets/research.js`. It can invent realistic-looking authors, journals, DOIs, methods, percentages, and conclusions. That legacy output is not real research and must not be presented as verified scholarship.

The new source-first workspace is the replacement path. The next implementation stage is to connect its real source records and catalog schema to the main Bitcoin Crusher interface, then remove the fabricated article path.

## Defensive security research

The main branch also contains [AIR_GAP_SECURITY_RESEARCH_QUEUE.md](AIR_GAP_SECURITY_RESEARCH_QUEUE.md), which documents a defensive-only research program for hardware-wallet trust, covert-channel evidence, safe laboratory testing, and countermeasures.

## Build principles

- Real sources before synthesis.
- Every claim traceable to evidence.
- Clear labels for theory, metadata, abstract-level evidence, and verified full text.
- No invented citations or findings.
- Local-first operation with no OAuth or package installation required.
- Repository-backed cataloging added only through a protected write path.
