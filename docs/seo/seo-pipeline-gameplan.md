[//]: # (Destination: docs/strategy/seo-pipeline-gameplan.md)
[//]: # (Format: BooksVersusMovies standard markdown v1)
[//]: # (Last updated: 2026-04-19)
[//]: # (Author: RavensEdge AI)

# SEO Pipeline Gameplan

## The Core Principle

Multiple models matter for **independent review**, not task delegation.

The value of running three models is not that Gemini is better at tables or Grok is better at titles. It is that three models trained differently will notice different things. Different training data, different priors, different blind spots. When they agree, that is high-confidence signal. When they disagree, that disagreement is itself signal worth investigating.

The Reminders of Him review demonstrated this clearly. Gemini independently identified the Hoover audience's protective relationship with interiority — the letters, the dual POV — as the specific angle that would resonate with BookTok. Claude identified the same structural issues but framed them more generically. Gemini's audience awareness was a genuine independent insight that improved the final output.

That is what multiple models actually give you.

---

## The Right Mental Model

**Generation** — one model, voice consistency.
Use Claude Sonnet. It maintains editorial voice most consistently across long-form content. Multiple models generating different sections of the same page creates voice fragmentation.

**Review** — multiple models, independent eyes.
Pass the same content to all three models independently. Each scores and suggests without seeing the others' output. Disagreements between models are signal. Consensus is high-confidence direction.

**Adjudication** — one model, final call.
Claude reads all three independent reviews and writes the definitive final version. The adjudicator prompt includes live GSC performance data so it knows when to be conservative (high-performing pages) and when to be aggressive (zero-traffic pages).

---

## Current Pipeline Architecture

```
Step 1 — Generation
  Claude Sonnet generates full page JSON
  Voice consistency enforced at source

Step 2 — Schema Validation
  Pipeline quality gate — character limits, required fields,
  cross-page contamination check, parallel table structure

Step 3 — Render
  Deterministic HTML from validated JSON
  Snippet paragraph, at-a-glance table, bullet list,
  question H2s, OG tags all injected at render time

Step 4 — SEO Review (title + meta)
  Claude Sonnet  → scores title and meta independently
  Gemini 2.5 Pro → scores title and meta independently
  Grok-3         → scores title and meta independently
  Claude adjudicates → writes definitive title and meta
  GSC performance data fed into adjudicator prompt

Step 5 — Full-Page Structural Review (planned)
  Claude Sonnet  → reviews full page JSON, suggests structural fields
  Gemini 2.5 Pro → reviews full page JSON independently
  Grok-3         → reviews full page JSON independently
  Claude adjudicates → generates snippetParagraph, atAGlanceTable,
                       keyDifferencesList, optimizedH2s

Step 6 — Import and Re-render
  Accepted changes written to source JSON
  Pipeline re-renders affected pages
  Applied flag set in review JSON

Step 7 — Monitoring
  Daily GSC analysis script — 28-day and 7-day windows
  Automated outlier detection — CTR drops, position changes
  Morning report with prioritized recommendations
  Nightly processes trigger review queue for flagged pages
```

---

## Model Roles by Task

| Task | Model | Reason |
|------|-------|--------|
| Content generation | Claude Sonnet | Voice consistency, long-form quality |
| Independent title/meta scoring | Sonnet + Gemini + Grok | Different perspectives, disagreement is signal |
| Independent full-page review | Sonnet + Gemini + Grok | Audience awareness varies by model |
| Final adjudication | Claude Sonnet | Knows site voice, reads all three reviews |
| Research / factual grounding | Gemini or Perplexity | Better recent data on films and publishing |
| Bulk cheap tasks at scale | Claude Haiku | Cost optimization for simple field generation |
| GSC morning analysis | Claude Sonnet | Contextual reasoning on performance data |

---

## What Perplexity Got Right and Wrong

**Right:** Multiple models add value. The principle is sound.

**Wrong:** Task delegation is not the mechanism. Assigning Gemini to tables and GPT-4o to titles assumes model specialization that does not meaningfully exist at this granularity. The real mechanism is independent review — same task, different model, compare outputs.

**Wrong:** Voice fragmentation is a real cost Perplexity underweights. A page where Claude wrote the snippet paragraph and GPT-4o wrote the title will read as disconnected. Voice consistency requires single-model generation.

**Right at scale, premature now:** Cost optimization through task decomposition makes sense at 10,000+ pages where token costs are significant. At 171 pages the coordination overhead exceeds the savings. Revisit when volume warrants it.

---

## When to Add More Models

The current three-model review (Sonnet, Gemini, Grok) is the right set for now. Add a fourth model when:

- A specific model demonstrates consistent blind spots on a content type
- A new model releases with meaningfully different training data
- Volume makes cost-per-review significant enough to warrant cheaper alternatives

Do not add models for the sake of adding models. The value is in independent perspectives, not in number of models.

---

## Future Pipeline Additions

```
- [ ] seo-llm-fullpage.js — full page structural review,
      three models independently, Claude adjudicates,
      generates snippetParagraph, atAGlanceTable,
      keyDifferencesList, optimizedH2s

- [ ] seo-gsc-compare.js — cross-reference SEO scores
      against live GSC CTR and impressions data,
      surfaces fix priority by actual traffic opportunity

- [ ] gsc-analysis.js — historical trend analysis,
      outlier detection, position threshold crossings

- [ ] Auto-queue trigger — pages flagged by morning
      analysis automatically queued for review pipeline,
      no manual intervention required

- [ ] Adjudicator GSC integration — pass live CTR and
      position data into seo-llm-apply.js prompt,
      conservative on performers, aggressive on zero-traffic
```

---

## Scale Thresholds

| Page count | Recommended approach |
|------------|---------------------|
| < 500 | Current architecture — three models review, Claude generates and adjudicates |
| 500-2,000 | Add batch caching — skip re-review of pages with accepted changes applied |
| 2,000-10,000 | Consider Haiku for cheap sub-tasks, Sonnet for quality-sensitive generation |
| 10,000+ | Revisit task decomposition — Perplexity's model becomes relevant at this scale |

---

## The One-Sentence Summary

Multiple models matter because they notice different things — not because they are specialized for different tasks. Generate with one, review with many, adjudicate with one.

