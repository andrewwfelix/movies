#!/usr/bin/env node

/**
 * validate-json-schema.js
 * BooksVersusMovies.com — JSON schema validator
 *
 * Validates review JSON files against stage-specific schemas using ajv.
 *
 * Usage:
 *   node scripts/validate-json-schema.js                         (all 2-revised/, schema-revised)
 *   node scripts/validate-json-schema.js --schema greenfield     (greenfield stage 2 output)
 *   node scripts/validate-json-schema.js --schema extracted      (1-extracted/ files)
 *   node scripts/validate-json-schema.js --slug the-godfather
 *   node scripts/validate-json-schema.js --dir pipeline/1-extracted --schema extracted
 *   node scripts/validate-json-schema.js --issues-only
 *   node scripts/validate-json-schema.js --fail-fast
 *
 * Schemas:
 *   data/schemas/schema-extracted.json   after pipeline-extract.js
 *   data/schemas/schema-greenfield.json  after pipeline-generate.js stage 2
 *   data/schemas/schema-revised.json     after all passes complete (default)
 *
 * Exits with code 1 if any files fail validation.
 * Exports validateRecord() for use in other pipeline scripts.
 */

const fs   = require('fs');
const path = require('path');
const Ajv  = require('ajv');

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const SLUG_ARG    = get('--slug', null);
const DIR_ARG     = get('--dir', 'pipeline/2-revised');
const SCHEMA_ARG  = get('--schema', 'revised');
const ISSUES_ONLY = hasFlag('--issues-only');
const FAIL_FAST   = hasFlag('--fail-fast');

const ROOT        = path.resolve(__dirname, '../..');
const SCHEMAS_DIR = path.join(ROOT, 'data', 'schemas');
const SRC_DIR     = path.resolve(ROOT, DIR_ARG);

// ── Load schema ───────────────────────────────────────────────────────────────

function loadSchema(name) {
  const schemaPath = path.join(SCHEMAS_DIR, `schema-${name}.json`);
  if (!fs.existsSync(schemaPath)) {
    console.error(`✗ Schema not found: ${schemaPath}`);
    console.error(`  Available: extracted, greenfield, revised`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

// ── Build validator ───────────────────────────────────────────────────────────

const ajv = new Ajv({ allErrors: true, strict: false });

// Cache compiled validators by schema name
const validators = {};

function getValidator(schemaName) {
  if (!validators[schemaName]) {
    const schema = loadSchema(schemaName);
    validators[schemaName] = ajv.compile(schema);
  }
  return validators[schemaName];
}

// ── Exported validate function ────────────────────────────────────────────────

function validateRecord(record, schemaName = 'revised') {
  const validate = getValidator(schemaName);
  const valid    = validate(record);

  if (valid) return { valid: true, errors: [] };

  const errors = validate.errors.map(e => {
    const field = e.instancePath
      ? e.instancePath.replace(/^\//, '').replace(/\//g, '.')
      : e.params?.missingProperty || 'unknown';
    return `${field}: ${e.message}`;
  });

  return { valid: false, errors };
}

// ── CLI runner ────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`✗ Directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  let files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.json')).sort();

  if (SLUG_ARG) {
    files = files.filter(f => f.replace('.json', '') === SLUG_ARG);
    if (files.length === 0) {
      console.error(`✗ No file found for slug: ${SLUG_ARG}`);
      process.exit(1);
    }
  }

  console.log(`\nvalidate-json-schema.js`);
  console.log(`Schema:  schema-${SCHEMA_ARG}.json`);
  console.log(`Source:  ${SRC_DIR}`);
  console.log(`Files:   ${files.length}`);
  console.log(`${'─'.repeat(60)}`);

  let passed   = 0;
  let failed   = 0;
  const failures = [];

  for (const file of files) {
    const slug = file.replace('.json', '');
    let record;

    try {
      record = JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf8'));
    } catch (e) {
      console.log(`  ✗  ${slug}: JSON parse error — ${e.message}`);
      failed++;
      failures.push({ slug, errors: [`JSON parse error: ${e.message}`] });
      if (FAIL_FAST) { console.log('\nFAIL FAST — stopping.'); process.exit(1); }
      continue;
    }

    const result = validateRecord(record, SCHEMA_ARG);

    if (result.valid) {
      passed++;
      if (!ISSUES_ONLY) console.log(`  ✓  ${slug}`);
    } else {
      failed++;
      failures.push({ slug, errors: result.errors });
      console.log(`  ✗  ${slug}`);
      result.errors.slice(0, 5).forEach(e => console.log(`       ${e}`));
      if (result.errors.length > 5) console.log(`       ... and ${result.errors.length - 5} more`);
      if (FAIL_FAST) { console.log('\nFAIL FAST — stopping.'); process.exit(1); }
    }
  }

  console.log(`${'─'.repeat(60)}`);
  console.log(`  Total:   ${files.length}`);
  console.log(`  Passed:  ${passed}`);
  console.log(`  Failed:  ${failed}`);

  if (failed > 0) {
    console.log(`\nVALIDATION FAILED`);
    process.exit(1);
  } else {
    console.log(`\n✓ All files valid against schema-${SCHEMA_ARG}`);
  }
}

if (require.main === module) {
  run();
}

module.exports = { validateRecord };
