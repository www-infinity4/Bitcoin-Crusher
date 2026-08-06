# Browser Testing

## Automated integrity test

Open `tests/research-integrity.test.html` through GitHub Pages or any local static server.

The page uses controlled fixtures instead of live APIs and verifies:

- pending research packages contain no invented authors or DOI;
- spin score is explicitly represented as a simulated game score;
- OpenAlex and Crossref responses normalize correctly;
- duplicate DOI records collapse into one source;
- real source identifiers appear in the bibliography;
- abstract-level evidence remains labeled provisional;
- no full text is silently marked reviewed;
- each finalized package receives a 64-character SHA-256 digest;
- no simulated score is represented as Bitcoin revenue.

The expected result is `11 / 11 passed`.

## Manual main-interface test

1. Open `index.html` from the product branch deployment.
2. Confirm the navigation contains **Real Research Workspace**.
3. Spin once.
4. Confirm the first research state says `pending-source-retrieval` and contains no author, journal impact factor, or DOI claim.
5. Wait for source lookup to finish.
6. Confirm the interface reports the number of real sources and the evidence status.
7. Open the research viewer and verify every bibliography entry links to an OpenAlex, Crossref, or DOI record.
8. Confirm the console reports a SHA-256 package hash.
9. Download the receipt and verify `simulatedGameScore`, `evidenceStatus`, `sources`, `references`, and `hash` are present.
10. Confirm the game score is never labeled Bitcoin revenue, money earned, wallet balance, or scientific proof.
11. Open the full research workspace, search user-defined keywords, select sources, build a brief, and export both Markdown and JSON.

## Live-source limitations

OpenAlex, Crossref, DuckDuckGo, or Archive.org can be temporarily unavailable or rate-limited. A failed lookup must leave the package labeled pending; it must never trigger invented replacement content.
