#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Title & Meta Description Updater
 * Updates <title> and <meta name="description"> on all comparison pages
 * with keyword-optimized, click-worthy versions.
 *
 * Usage:
 *   node update_meta.js
 *
 * Run from your site's root directory.
 * Creates a /backup_meta/ folder first so you can revert if needed.
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------ //
// PAGE DATA
// ------------------------------------------------------------------ //

const PAGES = [
  {
    file: 'project-hail-mary.html',
    title: 'Project Hail Mary Book vs Movie: Should You Read First?',
    description: "Andy Weir's novel vs the 2026 Ryan Gosling film — what the book does better and whether to read before you watch.",
  },
  {
    file: 'verity.html',
    title: 'Verity Book vs Movie: Key Differences & Should You Read First',
    description: "Colleen Hoover's thriller vs the 2026 Anne Hathaway film — the ending, the manuscript, and why the book wins.",
  },
  {
    file: 'narnia-magicians-nephew.html',
    title: "Narnia: The Magician's Nephew Book vs Movie 2026",
    description: "C.S. Lewis vs Greta Gerwig's Netflix adaptation — the creation of Narnia and what the film must preserve.",
  },
  {
    file: 'wuthering-heights.html',
    title: "Wuthering Heights Book vs Emerald Fennell's 2026 Film",
    description: "Emily Brontë's only novel vs the most anticipated 2026 adaptation — why the book is stranger than any film can be.",
  },
  {
    file: 'hunger-games-sunrise.html',
    title: 'Hunger Games: Sunrise on the Reaping Book vs Movie 2026',
    description: "Suzanne Collins' prequel vs the 2026 Ralph Fiennes film — key differences and whether to read before November.",
  },
  {
    file: 'hamnet.html',
    title: "Hamnet Book vs Movie: O'Farrell vs Chloé Zhao 2026",
    description: "Maggie O'Farrell's Booker Prize winner vs Jessie Buckley's 2026 film — what the prose does that cinema cannot.",
  },
  {
    file: 'remarkably-bright-creatures.html',
    title: 'Remarkably Bright Creatures Book vs Netflix 2026',
    description: "Shelby Van Pelt's novel vs the Sally Field Netflix adaptation — the octopus, the mystery, and the verdict.",
  },
  {
    file: 'dune.html',
    title: 'Dune Book vs Movie: Key Differences & Should You Read First',
    description: "Frank Herbert's novel vs Villeneuve's 2021–2024 films — Paul's interiority, Chani's role, and why the book still wins.",
  },
  {
    file: 'gone-girl.html',
    title: 'Gone Girl Book vs Movie: Key Differences Explained',
    description: "Gillian Flynn's novel vs Fincher's 2014 film — Amy's voice, Nick's culpability, and why the book makes you complicit.",
  },
  {
    file: 'the-shining.html',
    title: 'The Shining Book vs Movie: King vs Kubrick Explained',
    description: "Stephen King's 1977 novel vs Kubrick's 1980 film — why King hates the adaptation and why Kubrick was right anyway.",
  },
  {
    file: 'no-country-for-old-men.html',
    title: 'No Country for Old Men: Book vs Coen Brothers Film',
    description: "Cormac McCarthy's novel vs the 2007 Coen Brothers film — the closest thing to a tie on this site.",
  },
  {
    file: 'atonement.html',
    title: 'Atonement Book vs Movie: McEwan vs Joe Wright',
    description: "Ian McEwan's novel vs the 2007 Keira Knightley film — the metafictional ending no film can replicate.",
  },
  {
    file: 'kite-runner.html',
    title: 'The Kite Runner Book vs Movie: Key Differences',
    description: "Khaled Hosseini's novel vs the 2007 film — why Amir's guilt hits harder on the page than on screen.",
  },
  {
    file: 'wild.html',
    title: 'Wild Book vs Movie: Cheryl Strayed vs Reese Witherspoon',
    description: "The memoir vs Jean-Marc Vallée's 2014 film — what survives translation and what only the page can carry.",
  },
  {
    file: 'room.html',
    title: 'Room Book vs Movie: Donoghue vs Abrahamson',
    description: "Emma Donoghue's novel vs Brie Larson's 2015 film — one of the rare cases where both versions are essential.",
  },
  {
    file: 'big-little-lies.html',
    title: 'Big Little Lies Book vs HBO: Does the Show Win?',
    description: "Liane Moriarty's novel vs the Kidman and Witherspoon HBO series — one of the rare times the screen version wins.",
  },
  {
    file: 'girl-on-the-train.html',
    title: 'The Girl on the Train Book vs Movie: Key Differences',
    description: "Paula Hawkins' novel vs Emily Blunt's 2016 film — why moving it from London to New York was a mistake.",
  },
  {
    file: 'never-let-me-go.html',
    title: 'Never Let Me Go Book vs Movie: Ishiguro vs Romanek',
    description: "Kazuo Ishiguro's 2005 novel vs Carey Mulligan's 2010 film — why Kathy's voice is irreplaceable on the page.",
  },
  {
    file: 'the-martian.html',
    title: 'The Martian Book vs Movie: Weir vs Ridley Scott',
    description: "Andy Weir's novel vs Matt Damon's 2015 film — one of the more faithful sci-fi adaptations ever made.",
  },
  {
    file: 'the-odyssey.html',
    title: "The Odyssey Book vs Nolan's 2026 Film: Should You Read First?",
    description: "Homer's epic vs Christopher Nolan's most anticipated 2026 film — 3,000 years of story and whether to read first.",
  },
];

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
  console.log(`✅ Backed up ${htmlFiles.length} files to /backup_meta/\n`);
}

function updateMeta(content, title, description) {
  // Replace <title>
  content = content.replace(
    /<title>[^<]*<\/title>/,
    `<title>${title}</title>`
  );

  // Replace <meta name="description">
  content = content.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${description}">`
  );

  return content;
}

// ------------------------------------------------------------------ //
// MAIN
// ------------------------------------------------------------------ //

function main() {
  const root = process.cwd();
  const backupDir = path.join(root, 'backup_meta');

  const existingPages = PAGES.filter(p =>
    fs.existsSync(path.join(root, p.file))
  );

  if (existingPages.length === 0) {
    console.error('❌ No matching HTML files found. Make sure you\'re running this from your site root.');
    process.exit(1);
  }

  console.log(`Found ${existingPages.length} HTML files to process.\n`);
  backupFiles(
    existingPages.map(p => path.join(root, p.file)),
    backupDir
  );

  const updated = [];
  const skipped = [];

  existingPages.forEach(page => {
    const filepath = path.join(root, page.file);
    const original = fs.readFileSync(filepath, 'utf8');
    const newContent = updateMeta(original, page.title, page.description);

    if (newContent !== original) {
      fs.writeFileSync(filepath, newContent, 'utf8');
      console.log(`  ✅ Updated ${page.file}`);
      console.log(`     Title: ${page.title}`);
      updated.push(page.file);
    } else {
      console.log(`  ⏭  No changes in ${page.file}`);
      skipped.push(page.file);
    }
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${updated.length} files updated, ${skipped.length} skipped.`);
  console.log('\nOriginals saved in /backup_meta/ — delete once verified.');
  console.log('\n💡 After deploying, resubmit updated pages in Google Search Console.');
}

main();
