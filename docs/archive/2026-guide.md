# 2026 Adaptations Guide — Pipeline Integration
===============================================
Goal: Create a recurring, high-value "2026 Adaptations Guide" that can be regenerated monthly.

This becomes a major SEO + email + authority asset.

### Why This Is Valuable
- Timeliness & freshness signals for Google
- Perfect lead magnet for mailing list
- Drives affiliate clicks ("Read before you watch")
- Positions us as the authoritative "what should I experience first" resource

### Proposed Output
- Page: `/2026-adaptations` (or `/upcoming-2026`)
- Monthly version: `/2026-adaptations-april`, etc.
- Includes timeline, quick verdicts, "Read First" recommendations
- Prominent email opt-in

### Files to Create / Modify

#### New Files
- `data/guides/sources.json` — Curated list of trusted sources
- `scripts/prompts/guide-aggregator.txt` — LLM prompt for aggregation
- `scripts/pipeline-guide.js` — Main script to generate the guide
- `data/guides/2026-adaptations.json` — Generated structured data

#### Modifications
- Update `pipeline-render.js` to support guide rendering
- Update `pipeline-browse.js` to feature the guide on homepage
- Add entry in `config/models.json` for guide generation