# Source-First Research System

## Purpose

The Bitcoin Crusher research workspace turns user keywords into a traceable research record. It searches actual scholarly indexes, lets the researcher select relevant publications, separates researcher theory from published evidence, hashes the resulting record, and catalogs it for later retrieval.

## Integrity rules

1. Never invent a citation, author, journal, DOI, experiment, measurement, or result.
2. Show the origin of every source record.
3. Deduplicate sources by DOI or normalized title.
4. Label records with no indexed abstract as **metadata only**.
5. Label abstract summaries as **full text not verified** until a person reads the publication.
6. Keep the researcher's theory and notes separate from source claims.
7. Hash each saved brief with SHA-256.
8. Store an exportable local catalog without requiring login, OAuth, package installation, or a server.

## Data sources

- OpenAlex Works API: scholarly metadata, abstracts when indexed, venue, open-access status, and citation count.
- Crossref Works API: DOI registry metadata, author and venue data, publication date, and abstracts when deposited.

An API result is a discovery record, not proof that every conclusion in a paper is correct.

## Workflow

1. Enter keywords and a research question.
2. Search the scholarly indexes.
3. Open promising source records and inspect them.
4. Select the sources relevant to the question.
5. Add optional theory notes, clearly separated from source claims.
6. Build the evidence-labeled brief.
7. Download Markdown or JSON.
8. Save the brief into the browser catalog; the system computes its SHA-256 digest.

## Next build stages

- Add full-text review checkboxes and page/section notes.
- Add repository-backed catalog commits through a protected server endpoint.
- Add topic collections, tags, related-source links, and catalog search.
- Add claim-level citations and contradictory-evidence tracking.
- Add an index page linking every Bitcoin Crusher research collection.
