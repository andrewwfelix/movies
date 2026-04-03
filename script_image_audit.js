#!/usr/bin/env node

/**
 * BooksVersusMovies Asset Auditor & Auto-Fixer
 * ---------------------------------------------
 * Usage:
 *   node audit.js              # audit + fix all .html files in current directory
 *   node audit.js dune.html    # audit + fix a single file
 *   node audit.js --json       # also write audit-report.json
 *   node audit.js --dry-run    # report only, make no changes
 *
 * What it fixes automatically:
 *   - Book cover src → always rewrites to ./images/{slug}.jpg
 *   - YouTube thumbnail → falls back from maxresdefault to hqdefault if needed,
 *     updates the src in the HTML file
 *
 * What it reports but cannot fix:
 *   - Book cover image file missing from ./images/ (you need to download it)
 *   - YouTube ID not found in page
 *   - No affiliate link found
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

// ─── Config ──────────────────────────────────────────────────────────────────

const EXPECTED_TAG    = 'booksvsmovies-20';
const MIN_IMAGE_BYTES = 2000;
const YT_QUALITIES    = ['maxresdefault', 'hqdefault', 'mqdefault', 'sddefault'];

// ─── Colour helpers ──────────────────────────────────────────────────────────

const green  = s => `\x1b[32m${s}\x1b[0m`;
const red    = s => `\x1b[31m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const cyan   = s => `\x1b[36m${s}\x1b[0m`;
const bold   = s => `\x1b[1m${s}\x1b[0m`;
const dim    = s => `\x1b[2m${s}\x1b[0m`;

const PASS  = green('✓');
const FAIL  = red('✗');
const WARN  = yellow('⚠');
const FIXED = cyan('↻');

function pad(str, len) {
  const plain = str.replace(/\x1b\[[0-9;]*m/g, '');
  return plain.length >= len ? str : str + ' '.repeat(len - plain.length);
}

function humanBytes(n) {
  if (n < 1024) return `${n}b`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}kb`;
  return `${(n / 1024 / 1024).toFixed(1)}mb`;
}

// ─── Network ─────────────────────────────────────────────────────────────────

function fetchHead(url) {
  return new Promise(resolve => {
    const req = https.request(url, { method: 'HEAD', timeout: 8000 }, res => {
      const len = parseInt(res.headers['content-length'] || '0', 10);
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, statusCode: res.statusCode, contentLength: len });
    });
    req.on('error', () => resolve({ ok: false, statusCode: 0, contentLength: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, statusCode: 0, contentLength: 0 }); });
    req.end();
  });
}

async function findWorkingYtThumb(ytId) {
  for (const quality of YT_QUALITIES) {
    const url = `https://img.youtube.com/vi/${ytId}/${quality}.jpg`;
    const { ok, contentLength } = await fetchHead(url);
    if (ok && contentLength > MIN_IMAGE_BYTES) return { quality, url };
  }
  return null;
}

// ─── Parsers & fixers ────────────────────────────────────────────────────────

function extractYouTubeId(html) {
  const patterns = [
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/,
    /img\.youtube\.com\/vi\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) return m[1];
  }
  return null;
}

function extractAffiliate(html) {
  const amznTo   = html.match(/href="(https?:\/\/amzn\.to\/[^"]+)"/);
  const amznFull = html.match(/href="(https?:\/\/www\.amazon\.com\/dp\/[^"]+)"/);
  const link = amznTo ? amznTo[1] : (amznFull ? amznFull[1] : null);
  if (!link) return { link: null, hasTag: false, tag: null, isShortened: false };
  const tagMatch    = link.match(/[?&]tag=([^&"]+)/);
  const tag         = tagMatch ? tagMatch[1] : null;
  const isShortened = link.includes('amzn.to');
  return { link, hasTag: isShortened ? null : !!tag, tag, isShortened };
}

function fixBookCoverSrc(html, slug) {
  const canonicalSrc = `./images/${slug}.jpg`;
  let changed  = false;
  let oldSrc   = null;

  // Matches <img class="book-cover" src="..."> in either attribute order
  const updated = html.replace(
    /(<img\b[^>]*\bclass="book-cover"[^>]*\bsrc=")([^"]+)(")|(<img\b[^>]*\bsrc=")([^"]+)("[^>]*\bclass="book-cover"[^>]*>)/g,
    (match, p1, p2, p3, p4, p5, p6) => {
      const before = p1 || p4;
      const src    = p2 || p5;
      const after  = p3 || p6;
      oldSrc = src;
      if (src === canonicalSrc) return match;
      changed = true;
      return `${before}${canonicalSrc}${after}`;
    }
  );

  return { html: updated, changed, oldSrc, newSrc: canonicalSrc };
}

function fixYtThumbSrc(html, ytId, quality) {
  const newUrl  = `https://img.youtube.com/vi/${ytId}/${quality}.jpg`;
  const pattern = new RegExp(`https://img\\.youtube\\.com/vi/${ytId}/[^"]+\\.jpg`, 'g');
  let changed   = false;

  const updated = html.replace(pattern, match => {
    if (match === newUrl) return match;
    changed = true;
    return newUrl;
  });

  return { html: updated, changed, newUrl };
}

// ─── Audit a single file ─────────────────────────────────────────────────────

async function auditFile(filepath, dryRun) {
  let html       = fs.readFileSync(filepath, 'utf8');
  const filename = path.basename(filepath);
  const slug     = filename.replace('.html', '');
  const results  = { filename, checks: [], errors: 0, warnings: 0, filesWritten: 0 };
  let htmlChanged = false;

  // ── 1. Book cover ──────────────────────────────────────────────────────────
  const canonicalSrc  = `./images/${slug}.jpg`;
  const localDiskPath = path.join(process.cwd(), 'images', `${slug}.jpg`);

  const { html: coverFixed, changed: coverSrcChanged, oldSrc } = fixBookCoverSrc(html, slug);

  if (coverSrcChanged) {
    html        = coverFixed;
    htmlChanged = true;
    results.checks.push({
      icon: FIXED, label: 'Book cover',
      detail: `src rewritten  ${dim(oldSrc || '?')} → ${dim(canonicalSrc)}`,
      status: 'fixed',
    });
  }

  if (fs.existsSync(localDiskPath)) {
    const stat = fs.statSync(localDiskPath);
    results.checks.push({
      icon: PASS, label: coverSrcChanged ? '            ' : 'Book cover',
      detail: `${canonicalSrc}  ${dim(humanBytes(stat.size))}`,
      status: 'ok',
    });
  } else {
    results.checks.push({
      icon: FAIL, label: coverSrcChanged ? '            ' : 'Book cover',
      detail: `${canonicalSrc}  FILE MISSING — download and save to ./images/`,
      status: 'error',
    });
    results.errors++;
  }

  // ── 2. YouTube thumbnail ───────────────────────────────────────────────────
  const ytId = extractYouTubeId(html);

  if (!ytId) {
    results.checks.push({ icon: FAIL, label: 'YouTube', detail: 'no YouTube ID found in page', status: 'error' });
    results.errors++;
  } else {
    const currentQualityMatch = html.match(new RegExp(`img\\.youtube\\.com/vi/${ytId}/([^.]+)\\.jpg`));
    const currentQuality = currentQualityMatch ? currentQualityMatch[1] : 'maxresdefault';
    const currentUrl     = `https://img.youtube.com/vi/${ytId}/${currentQuality}.jpg`;

    const { ok, contentLength } = await fetchHead(currentUrl);
    const currentOk = ok && contentLength > MIN_IMAGE_BYTES;

    if (currentOk) {
      results.checks.push({
        icon: PASS, label: 'YouTube',
        detail: `${ytId}  ${dim(currentQuality + '.jpg OK')}`,
        status: 'ok',
      });
    } else {
      const working = await findWorkingYtThumb(ytId);
      if (working) {
        const { html: ytFixed, changed } = fixYtThumbSrc(html, ytId, working.quality);
        if (changed) {
          html        = ytFixed;
          htmlChanged = true;
          results.checks.push({
            icon: FIXED, label: 'YouTube',
            detail: `${ytId}  ${dim(currentQuality + '.jpg')} failed → fixed to ${dim(working.quality + '.jpg')}`,
            status: 'fixed',
          });
        } else {
          results.checks.push({
            icon: PASS, label: 'YouTube',
            detail: `${ytId}  ${dim(working.quality + '.jpg')}`,
            status: 'ok',
          });
        }
      } else {
        results.checks.push({
          icon: FAIL, label: 'YouTube',
          detail: `${ytId}  no working thumbnail found — check the video ID`,
          status: 'error',
        });
        results.errors++;
      }
    }
  }

  // ── 3. Affiliate link ──────────────────────────────────────────────────────
  const { link, hasTag, tag, isShortened } = extractAffiliate(html);

  if (!link) {
    results.checks.push({ icon: FAIL, label: 'Affiliate', detail: 'no Amazon link found', status: 'error' });
    results.errors++;
  } else if (isShortened) {
    results.checks.push({
      icon: PASS, label: 'Affiliate',
      detail: `${link}  ${dim('(shortened — tag unverifiable)')}`,
      status: 'ok',
    });
  } else if (hasTag && tag === EXPECTED_TAG) {
    results.checks.push({ icon: PASS, label: 'Affiliate', detail: `tag=${tag}`, status: 'ok' });
  } else if (hasTag && tag !== EXPECTED_TAG) {
    results.checks.push({ icon: WARN, label: 'Affiliate', detail: `tag=${tag}  expected ${EXPECTED_TAG}`, status: 'warning' });
    results.warnings++;
  } else {
    results.checks.push({ icon: WARN, label: 'Affiliate', detail: 'link present but missing ?tag= parameter', status: 'warning' });
    results.warnings++;
  }

  // ── Write file if changed ──────────────────────────────────────────────────
  if (htmlChanged && !dryRun) {
    fs.writeFileSync(filepath, html, 'utf8');
    results.filesWritten++;
  } else if (htmlChanged && dryRun) {
    results.checks.push({ icon: dim('→'), label: '', detail: dim('(dry-run: changes not written)'), status: 'info' });
  }

  return results;
}

// ─── Output ──────────────────────────────────────────────────────────────────

function printResults(allResults, dryRun) {
  console.log('\n' + bold('BOOKSVERSUSMOVIES — ASSET AUDIT' + (dryRun ? ' (DRY RUN)' : '')));
  console.log('═'.repeat(56));

  for (const r of allResults) {
    const hasFixed  = r.checks.some(c => c.status === 'fixed');
    const fileLabel = r.errors > 0 ? red(r.filename) : r.warnings > 0 ? yellow(r.filename) : hasFixed ? cyan(r.filename) : green(r.filename);

    console.log('\n' + bold(fileLabel));
    for (const c of r.checks) {
      if (!c.label.trim() && !String(c.icon).replace(/\x1b\[[0-9;]*m/g, '').trim()) continue;
      console.log(`  ${c.icon}  ${pad(c.label, 12)}  ${c.detail}`);
    }
    if (r.filesWritten > 0) console.log(`  ${cyan('↻')}  ${dim('file saved to disk')}`);
  }

  console.log('\n' + '═'.repeat(56));

  const totalErrors   = allResults.reduce((n, r) => n + r.errors, 0);
  const totalWarnings = allResults.reduce((n, r) => n + r.warnings, 0);
  const totalFixed    = allResults.reduce((n, r) => n + r.checks.filter(c => c.status === 'fixed').length, 0);
  const totalFiles    = allResults.length;

  const errStr   = totalErrors   > 0 ? red(`${totalErrors} error${totalErrors !== 1 ? 's' : ''}`)         : green('0 errors');
  const warnStr  = totalWarnings > 0 ? yellow(`${totalWarnings} warning${totalWarnings !== 1 ? 's' : ''}`) : green('0 warnings');
  const fixedStr = totalFixed    > 0 ? cyan(`${totalFixed} auto-fixed`)                                    : dim('0 fixes needed');

  console.log(`${bold('SUMMARY')}  ${totalFiles} file${totalFiles !== 1 ? 's' : ''} · ${errStr} · ${warnStr} · ${fixedStr}\n`);

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log(green('  All assets verified. Ready to deploy.\n'));
  } else if (totalErrors > 0) {
    console.log(red('  Fix errors before deploying.\n'));
  } else {
    console.log(yellow('  Warnings are non-blocking but worth reviewing.\n'));
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args      = process.argv.slice(2);
  const writeJson = args.includes('--json');
  const dryRun    = args.includes('--dry-run');
  const fileArgs  = args.filter(a => !a.startsWith('--'));

  const SKIP = new Set(['index.html', 'affiliate_link_finder.html', 'cover_image_fetcher.html', 'link_manager.html']);

  let files;
  if (fileArgs.length > 0) {
    files = fileArgs.filter(f => {
      if (!fs.existsSync(f)) { console.error(red(`File not found: ${f}`)); return false; }
      return true;
    });
  } else {
    files = fs.readdirSync('.').filter(f => f.endsWith('.html') && !SKIP.has(f)).sort();
  }

  if (files.length === 0) {
    console.error(red('No HTML files found to audit.'));
    process.exit(1);
  }

  console.log(dim(`\nAuditing ${files.length} file${files.length !== 1 ? 's' : ''}${dryRun ? ' (dry-run)' : ''}...`));

  const allResults = [];
  for (const f of files) {
    process.stdout.write(dim(`  checking ${f}...`) + ' '.repeat(20) + '\r');
    allResults.push(await auditFile(f, dryRun));
  }

  process.stdout.write(' '.repeat(60) + '\r');
  printResults(allResults, dryRun);

  if (writeJson) {
    const report = {
      generated: new Date().toISOString(),
      dryRun,
      summary: {
        files: allResults.length,
        errors: allResults.reduce((n, r) => n + r.errors, 0),
        warnings: allResults.reduce((n, r) => n + r.warnings, 0),
        autoFixed: allResults.reduce((n, r) => n + r.checks.filter(c => c.status === 'fixed').length, 0),
      },
      files: allResults.map(r => ({
        filename: r.filename,
        errors: r.errors,
        warnings: r.warnings,
        checks: r.checks.map(c => ({
          label: c.label.trim(),
          status: c.status,
          detail: c.detail.replace(/\x1b\[[0-9;]*m/g, ''),
        })),
      })),
    };
    fs.writeFileSync('audit-report.json', JSON.stringify(report, null, 2));
    console.log(dim('  audit-report.json written.\n'));
  }

  process.exit(allResults.some(r => r.errors > 0) ? 1 : 0);
}

main().catch(err => { console.error(red(err.message)); process.exit(1); });
