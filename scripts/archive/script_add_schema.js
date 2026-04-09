#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Schema.org Review Markup Injector
 * Adds JSON-LD Review structured data to every comparison page.
 * This enables rich snippets (star ratings, verdict) in Google search results.
 *
 * Usage:
 *   node add_schema.js
 *
 * Run from your site's root directory.
 * Creates a /backup_schema/ folder first so you can revert if needed.
 *
 * Rating scale:
 *   Book Wins        → 5
 *   Too Close to Call → 4
 *   Screen Wins      → 3
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------ //
// PAGE DATA
// ------------------------------------------------------------------ //

const PAGES = [
  {
    file: 'atonement.html',
    name: 'Atonement: Book vs Movie',
    bookTitle: 'Atonement',
    author: 'Ian McEwan',
    director: 'Joe Wright',
    yearBook: '2001',
    yearFilm: '2007',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: 'Joe Wright made one of the most beautiful films of the 2000s and it still cannot do what McEwan does. Read the book — the film will haunt you, but the novel haunts you longer.',
  },
  {
    file: 'big-little-lies.html',
    name: 'Big Little Lies: Book vs HBO Series',
    bookTitle: 'Big Little Lies',
    author: 'Liane Moriarty',
    director: 'Jean-Marc Vallée',
    yearBook: '2014',
    yearFilm: '2017',
    verdict: 'Screen Wins',
    rating: '3',
    reviewBody: 'One of the very few times the adaptation wins outright. Nicole Kidman and Reese Witherspoon elevate the source material into something exceptional. Watch season one.',
  },
  {
    file: 'dune.html',
    name: 'Dune: Book vs Movie',
    bookTitle: 'Dune',
    author: 'Frank Herbert',
    director: 'Denis Villeneuve',
    yearBook: '1965',
    yearFilm: '2021',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: "Villeneuve's adaptation is one of the best science fiction films ever made — and it still can't do what Herbert does. The book is an argument about power and prophecy the films can only gesture toward.",
  },
  {
    file: 'girl-on-the-train.html',
    name: 'The Girl on the Train: Book vs Movie',
    bookTitle: 'The Girl on the Train',
    author: 'Paula Hawkins',
    director: 'Tate Taylor',
    yearBook: '2015',
    yearFilm: '2016',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: "Emily Blunt is excellent but the film loses the two things that made the novel a phenomenon: the London commuter setting and the full claustrophobic intimacy of Rachel's unreliable voice.",
  },
  {
    file: 'gone-girl.html',
    name: 'Gone Girl: Book vs Movie',
    bookTitle: 'Gone Girl',
    author: 'Gillian Flynn',
    director: 'David Fincher',
    yearBook: '2012',
    yearFilm: '2014',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: "Fincher's film is as good as a Gone Girl adaptation could possibly be — and it's still a lesser experience than the novel. Flynn's prose makes you complicit in a way film cannot.",
  },
  {
    file: 'hamnet.html',
    name: 'Hamnet: Book vs Movie',
    bookTitle: 'Hamnet',
    author: "Maggie O'Farrell",
    director: 'Chloé Zhao',
    yearBook: '2020',
    yearFilm: '2026',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: "O'Farrell's novel is a devastating portrait of grief and loss. The film adaptation brings Jessie Buckley to the role but cannot replicate the prose's intimacy.",
  },
  {
    file: 'hunger-games-sunrise.html',
    name: 'Hunger Games: Sunrise on the Reaping — Book vs Movie',
    bookTitle: 'Hunger Games: Sunrise on the Reaping',
    author: 'Suzanne Collins',
    director: 'Francis Lawrence',
    yearBook: '2025',
    yearFilm: '2026',
    verdict: 'Too Close to Call',
    rating: '4',
    reviewBody: 'Collins returns to Panem with a prequel that expands the mythology. The film adaptation with Ralph Fiennes is highly anticipated — too close to call until release.',
  },
  {
    file: 'kite-runner.html',
    name: 'The Kite Runner: Book vs Movie',
    bookTitle: 'The Kite Runner',
    author: 'Khaled Hosseini',
    director: 'Marc Forster',
    yearBook: '2003',
    yearFilm: '2007',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: "Forster's film is sincere and well-intentioned but loses the full claustrophobic intimacy of Amir's guilty conscience. The book is the one that stays with you.",
  },
  {
    file: 'narnia-magicians-nephew.html',
    name: "Narnia: The Magician's Nephew — Book vs Movie",
    bookTitle: "The Magician's Nephew",
    author: 'C.S. Lewis',
    director: 'Greta Gerwig',
    yearBook: '1955',
    yearFilm: '2026',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: "Lewis's creation of Narnia is one of literature's great imaginative achievements. Greta Gerwig's Netflix adaptation is highly anticipated but the book set the standard.",
  },
  {
    file: 'never-let-me-go.html',
    name: 'Never Let Me Go: Book vs Movie',
    bookTitle: 'Never Let Me Go',
    author: 'Kazuo Ishiguro',
    director: 'Mark Romanek',
    yearBook: '2005',
    yearFilm: '2010',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: "Romanek's film is one of the most faithful literary adaptations of its decade and still cannot do what Ishiguro does. Read the book. See the film. Bring tissues to both.",
  },
  {
    file: 'no-country-for-old-men.html',
    name: 'No Country for Old Men: Book vs Movie',
    bookTitle: 'No Country for Old Men',
    author: 'Cormac McCarthy',
    director: 'Joel and Ethan Coen',
    yearBook: '2005',
    yearFilm: '2007',
    verdict: 'Too Close to Call',
    rating: '4',
    reviewBody: 'The closest thing to a genuine tie on this site. The Coens made an adaptation of extraordinary fidelity. Read the book, see the film, argue about which is better. You will both be right.',
  },
  {
    file: 'project-hail-mary.html',
    name: 'Project Hail Mary: Book vs Movie',
    bookTitle: 'Project Hail Mary',
    author: 'Andy Weir',
    director: 'Phil Lord and Christopher Miller',
    yearBook: '2021',
    yearFilm: '2026',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: "Weir's novel is a pure shot of scientific optimism and one of the most purely enjoyable reads of recent years. Ryan Gosling stars in the 2026 film adaptation.",
  },
  {
    file: 'remarkably-bright-creatures.html',
    name: 'Remarkably Bright Creatures: Book vs Movie',
    bookTitle: 'Remarkably Bright Creatures',
    author: 'Shelby Van Pelt',
    director: 'TBA',
    yearBook: '2022',
    yearFilm: '2026',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: "Van Pelt's warm, charming novel narrated partly by an octopus is a genuine crowd-pleaser. The Netflix adaptation with Sally Field is anticipated but the book sets a high bar.",
  },
  {
    file: 'room.html',
    name: 'Room: Book vs Movie',
    bookTitle: 'Room',
    author: 'Emma Donoghue',
    director: 'Lenny Abrahamson',
    yearBook: '2010',
    yearFilm: '2015',
    verdict: 'Too Close to Call',
    rating: '4',
    reviewBody: "Room is the rare adaptation where both versions are essential. Brie Larson and Jacob Tremblay are extraordinary. The novel's first-person narration is irreplaceable; the film's performances are unrepeatable.",
  },
  {
    file: 'the-martian.html',
    name: 'The Martian: Book vs Movie',
    bookTitle: 'The Martian',
    author: 'Andy Weir',
    director: 'Ridley Scott',
    yearBook: '2011',
    yearFilm: '2015',
    verdict: 'Too Close to Call',
    rating: '4',
    reviewBody: "Ridley Scott's film captures Weir's humor and ingenuity with Matt Damon perfectly cast. One of the more faithful and successful sci-fi adaptations in recent memory.",
  },
  {
    file: 'the-odyssey.html',
    name: 'The Odyssey: Book vs Movie',
    bookTitle: 'The Odyssey',
    author: 'Homer',
    director: 'Christopher Nolan',
    yearBook: '800 BC',
    yearFilm: '2026',
    verdict: 'Too Close to Call',
    rating: '4',
    reviewBody: "Homer's epic is the foundation of Western storytelling. Christopher Nolan's 2026 adaptation is one of the most anticipated films of the decade — too close to call until release.",
  },
  {
    file: 'the-shining.html',
    name: 'The Shining: Book vs Movie',
    bookTitle: 'The Shining',
    author: 'Stephen King',
    director: 'Stanley Kubrick',
    yearBook: '1977',
    yearFilm: '1980',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: "One of the rare cases where both versions are genuine masterworks. King's novel is the better horror story. Kubrick's film is the more haunting cultural object. Read both, watch both.",
  },
  {
    file: 'verity.html',
    name: 'Verity: Book vs Movie',
    bookTitle: 'Verity',
    author: 'Colleen Hoover',
    director: 'TBA',
    yearBook: '2018',
    yearFilm: '2026',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: "Hoover's propulsive thriller is one of the most talked-about books of recent years. The 2026 film adaptation with Anne Hathaway has high expectations to meet.",
  },
  {
    file: 'wild.html',
    name: 'Wild: Book vs Movie',
    bookTitle: 'Wild',
    author: 'Cheryl Strayed',
    director: 'Jean-Marc Vallée',
    yearBook: '2012',
    yearFilm: '2014',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: "Witherspoon is exceptional and the film is worth seeing, but Wild is fundamentally a book about what it sounds like inside a particular woman's head. The trail is beautiful on screen. It's essential on the page.",
  },
  {
    file: 'wuthering-heights.html',
    name: 'Wuthering Heights: Book vs Movie',
    bookTitle: 'Wuthering Heights',
    author: 'Emily Brontë',
    director: 'Emerald Fennell',
    yearBook: '1847',
    yearFilm: '2026',
    verdict: 'Book Wins',
    rating: '5',
    reviewBody: "Brontë's only novel remains one of the most original and strange in the English language. Emerald Fennell's 2026 adaptation is one of the most anticipated literary films of the year.",
  },
];

// ------------------------------------------------------------------ //
// HELPERS
// ------------------------------------------------------------------ //

function buildSchema(page) {
  return `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Review",
    "name": "${page.name}",
    "reviewBody": "${page.reviewBody}",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "${page.rating}",
      "bestRating": "5",
      "worstRating": "3"
    },
    "author": {
      "@type": "Organization",
      "name": "BooksVersusMovies.com"
    },
    "itemReviewed": {
      "@type": "Book",
      "name": "${page.bookTitle}",
      "author": {
        "@type": "Person",
        "name": "${page.author}"
      },
      "datePublished": "${page.yearBook}"
    }
  }
  </script>`;
}

function backupFiles(htmlFiles, backupDir) {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  htmlFiles.forEach(file => {
    fs.copyFileSync(file, path.join(backupDir, path.basename(file)));
  });
  console.log(`✅ Backed up ${htmlFiles.length} files to /backup_schema/\n`);
}

// ------------------------------------------------------------------ //
// MAIN
// ------------------------------------------------------------------ //

function main() {
  const root = process.cwd();
  const backupDir = path.join(root, 'backup_schema');

  const existingPages = PAGES.filter(p => fs.existsSync(path.join(root, p.file)));

  if (existingPages.length === 0) {
    console.error('❌ No matching HTML files found. Make sure you\'re running this from your site root.');
    process.exit(1);
  }

  console.log(`Found ${existingPages.length} HTML files to process.\n`);
  backupFiles(existingPages.map(p => path.join(root, p.file)), backupDir);

  const updated = [];
  const skipped = [];

  existingPages.forEach(page => {
    const filepath = path.join(root, page.file);
    const content = fs.readFileSync(filepath, 'utf8');

    if (content.includes('application/ld+json')) {
      console.log(`  ⏭  Skipping ${page.file} — schema already present`);
      skipped.push(page.file);
      return;
    }

    const schema = buildSchema(page);
    const newContent = content.replace('</head>', `${schema}\n</head>`);

    fs.writeFileSync(filepath, newContent, 'utf8');
    console.log(`  ✅ Updated ${page.file}`);
    updated.push(page.file);
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${updated.length} files updated, ${skipped.length} skipped.`);
  if (updated.length) {
    console.log('\nUpdated:');
    updated.forEach(f => console.log(`  • ${f}`));
  }
  console.log('\nOriginals saved in /backup_schema/ — delete once verified.');
  console.log('\n💡 Test your pages at: https://search.google.com/test/rich-results');
}

main();
