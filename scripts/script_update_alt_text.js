#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Alt-Text Updater
 * Replaces generic image alt-text with keyword-rich descriptions
 * for better Google Image search visibility.
 *
 * Usage:
 *   node update_alt_text.js
 *
 * Run from your site's root directory.
 * Creates a /backup_alt/ folder first so you can revert if needed.
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------ //
// ALT TEXT DATA
// One entry per page: filename, book alt, trailer alt
// ------------------------------------------------------------------ //

const ALT_TEXT_MAP = {
  'atonement.html': {
    bookAlt: 'Atonement book cover Ian McEwan 2001',
    trailerAlt: 'Atonement 2007 film dir. Joe Wright official trailer',
  },
  'big-little-lies.html': {
    bookAlt: 'Big Little Lies book cover Liane Moriarty 2014',
    trailerAlt: 'Big Little Lies HBO 2017 Nicole Kidman Reese Witherspoon official trailer',
  },
  'dune.html': {
    bookAlt: 'Dune book cover Frank Herbert 1965',
    trailerAlt: 'Dune 2021 film dir. Denis Villeneuve official trailer',
  },
  'girl-on-the-train.html': {
    bookAlt: 'The Girl on the Train book cover Paula Hawkins 2015',
    trailerAlt: 'The Girl on the Train 2016 film Emily Blunt official trailer',
  },
  'gone-girl.html': {
    bookAlt: 'Gone Girl book cover Gillian Flynn 2012',
    trailerAlt: 'Gone Girl 2014 film dir. David Fincher official trailer',
  },
  'hamnet.html': {
    bookAlt: 'Hamnet book cover Maggie O\'Farrell 2020',
    trailerAlt: 'Hamnet 2026 film Jessie Buckley official trailer',
  },
  'hunger-games-sunrise.html': {
    bookAlt: 'Hunger Games Sunrise on the Reaping book cover Suzanne Collins 2025',
    trailerAlt: 'Hunger Games Sunrise on the Reaping 2026 film Ralph Fiennes official trailer',
  },
  'kite-runner.html': {
    bookAlt: 'The Kite Runner book cover Khaled Hosseini 2003',
    trailerAlt: 'The Kite Runner 2007 film dir. Marc Forster official trailer',
  },
  'narnia-magicians-nephew.html': {
    bookAlt: 'Narnia The Magician\'s Nephew book cover C.S. Lewis',
    trailerAlt: 'Narnia The Magician\'s Nephew 2026 Netflix dir. Greta Gerwig official trailer',
  },
  'never-let-me-go.html': {
    bookAlt: 'Never Let Me Go book cover Kazuo Ishiguro 2005',
    trailerAlt: 'Never Let Me Go 2010 film Carey Mulligan official trailer',
  },
  'no-country-for-old-men.html': {
    bookAlt: 'No Country for Old Men book cover Cormac McCarthy 2005',
    trailerAlt: 'No Country for Old Men 2007 film dir. Coen Brothers official trailer',
  },
  'project-hail-mary.html': {
    bookAlt: 'Project Hail Mary book cover Andy Weir 2021',
    trailerAlt: 'Project Hail Mary 2026 film Ryan Gosling official trailer',
  },
  'remarkably-bright-creatures.html': {
    bookAlt: 'Remarkably Bright Creatures book cover Shelby Van Pelt 2022',
    trailerAlt: 'Remarkably Bright Creatures 2026 Netflix Sally Field official trailer',
  },
  'room.html': {
    bookAlt: 'Room book cover Emma Donoghue 2010',
    trailerAlt: 'Room 2015 film Brie Larson official trailer',
  },
  'the-martian.html': {
    bookAlt: 'The Martian book cover Andy Weir 2011',
    trailerAlt: 'The Martian 2015 film Matt Damon dir. Ridley Scott official trailer',
  },
  'the-odyssey.html': {
    bookAlt: 'The Odyssey book cover Homer ancient epic',
    trailerAlt: 'The Odyssey 2026 film dir. Christopher Nolan official trailer',
  },
  'the-shining.html': {
    bookAlt: 'The Shining book cover Stephen King 1977',
    trailerAlt: 'The Shining 1980 film dir. Stanley Kubrick Jack Nicholson official trailer',
  },
  'verity.html': {
    bookAlt: 'Verity book cover Colleen Hoover 2018',
    trailerAlt: 'Verity 2026 film Anne Hathaway official trailer',
  },
  'wild.html': {
    bookAlt: 'Wild book cover Cheryl Strayed 2012',
    trailerAlt: 'Wild 2014 film Reese Witherspoon dir. Jean-Marc Vallée official trailer',
  },
  'wuthering-heights.html': {
    bookAlt: 'Wuthering Heights book cover Emily Brontë 1847',
    trailerAlt: 'Wuthering Heights 2026 film dir. Emerald Fennell official trailer',
  },
};

// ------------------------------------------------------------------ //
// HELPERS
// ------------------------------------------------------------------ //

function backupFiles(htmlFiles, backupDir) {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  htmlFiles.forEach(file => {
    fs.copyFileSync(file, path.join(backupDir, path.basename(file)));
  });
  console.log(`✅ Backed up ${htmlFiles.length} files to /backup_alt/\n`);
}

function updateAltText(content, bookAlt, trailerAlt) {
  // Update book cover alt text
  content = content.replace(
    /(<img class="book-cover"[^>]*alt=")[^"]*(")/,
    `$1${bookAlt}$2`
  );

  // Update trailer thumbnail alt text
  content = content.replace(
    /(<img src="https:\/\/img\.youtube[^>]*alt=")[^"]*(")/,
    `$1${trailerAlt}$2`
  );

  return content;
}

// ------------------------------------------------------------------ //
// MAIN
// ------------------------------------------------------------------ //

function main() {
  const root = process.cwd();
  const backupDir = path.join(root, 'backup_alt');

  const htmlFiles = Object.keys(ALT_TEXT_MAP)
    .map(f => path.join(root, f))
    .filter(f => fs.existsSync(f));

  if (htmlFiles.length === 0) {
    console.error('❌ No matching HTML files found. Make sure you\'re running this from your site root.');
    process.exit(1);
  }

  console.log(`Found ${htmlFiles.length} HTML files to process.\n`);
  backupFiles(htmlFiles, backupDir);

  const updated = [];
  const skipped = [];

  htmlFiles.forEach(filepath => {
    const filename = path.basename(filepath);
    const { bookAlt, trailerAlt } = ALT_TEXT_MAP[filename];
    const original = fs.readFileSync(filepath, 'utf8');
    const updated_content = updateAltText(original, bookAlt, trailerAlt);

    if (updated_content !== original) {
      fs.writeFileSync(filepath, updated_content, 'utf8');
      console.log(`  ✅ Updated ${filename}`);
      updated.push(filename);
    } else {
      console.log(`  ⏭  No changes needed in ${filename}`);
      skipped.push(filename);
    }
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${updated.length} files updated, ${skipped.length} skipped.`);
  if (updated.length) {
    console.log('\nUpdated:');
    updated.forEach(f => console.log(`  • ${f}`));
  }
  console.log('\nOriginals saved in /backup_alt/ — delete once verified.');
}

main();
