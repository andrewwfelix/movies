#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Index Page Generator
 * Rebuilds index.html from the master PAGES data array.
 * Add new pages here and re-run to update the homepage.
 *
 * Usage:
 *   node script_update_index.js
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------ //
// MASTER PAGE DATA
// Add new pages here. Sections group cards on the homepage.
// ------------------------------------------------------------------ //

const SECTIONS = [
  {
    heading: '2026 Adaptations',
    pages: [
      { file: 'project-hail-mary.html', image: 'project-hail-mary.jpg', genre: 'Science Fiction', title: 'Project Hail Mary', author: 'Andy Weir &mdash; Ryan Gosling stars', footer: 'In theaters March 20, 2026 &middot; Book Wins' },
      { file: 'the-odyssey.html', image: 'the-odyssey.jpg', genre: 'Epic / Classic', title: 'The Odyssey', author: 'Homer &mdash; dir. Christopher Nolan', footer: 'In theaters July 17, 2026 &middot; Too Close to Call' },
      { file: 'verity.html', image: 'verity.jpg', genre: 'Psychological Thriller', title: 'Verity', author: 'Colleen Hoover &mdash; Anne Hathaway stars', footer: 'In theaters October 2, 2026 &middot; Book Wins' },
      { file: 'hunger-games-sunrise.html', image: 'hunger-games-sunrise.jpg', genre: 'Dystopian Fiction', title: 'Hunger Games: Sunrise on the Reaping', author: 'Suzanne Collins &mdash; Joseph Zada stars', footer: 'In theaters November 20, 2026 &middot; Too Close to Call' },
      { file: 'narnia-magicians-nephew.html', image: 'narnia-magicians-nephew.jpg', genre: 'Fantasy', title: 'Narnia: The Magician\'s Nephew', author: 'C.S. Lewis &mdash; dir. Greta Gerwig', footer: 'In theaters November 26, 2026 &middot; Book Wins' },
      { file: 'hamnet.html', image: 'hamnet.jpg', genre: 'Historical Fiction', title: 'Hamnet', author: 'Maggie O\'Farrell &mdash; Jessie Buckley stars', footer: 'In theaters December 2025 / early 2026 &middot; Book Wins' },
      { file: 'remarkably-bright-creatures.html', image: 'remarkably-bright-creatures.jpg', genre: 'Literary Fiction', title: 'Remarkably Bright Creatures', author: 'Shelby Van Pelt &mdash; Sally Field stars', footer: 'Streaming May 8, 2026 &middot; Book Wins' },
      { file: 'devil-wears-prada.html', image: 'devil-wears-prada.jpg', genre: 'Comedy / Drama', title: 'The Devil Wears Prada', author: 'Lauren Weisberger &mdash; Meryl Streep stars', footer: 'In theaters May 1, 2026 &middot; Book Wins' },
    ]
  },
  {
    heading: 'Recently Released',
    pages: [
      { file: 'wuthering-heights.html', image: 'wuthering-heights.jpg', genre: 'Gothic Romance', title: 'Wuthering Heights', author: 'Emily Bront&euml; &mdash; Margot Robbie stars', footer: 'In theaters February 13, 2026 &middot; Book Wins' },
    ]
  },
  {
    heading: 'Thrillers &amp; Page-Turners',
    pages: [
      { file: 'gone-girl.html', image: 'gone-girl.jpg', genre: 'Psychological Thriller', title: 'Gone Girl', author: 'Gillian Flynn &mdash; dir. David Fincher', footer: 'Film: 2014 &middot; Book Wins' },
      { file: 'girl-on-the-train.html', image: 'girl-on-the-train.jpg', genre: 'Psychological Thriller', title: 'The Girl on the Train', author: 'Paula Hawkins &mdash; Emily Blunt stars', footer: 'Film: 2016 &middot; Book Wins' },
      { file: 'big-little-lies.html', image: 'big-little-lies.jpg', genre: 'Domestic Thriller', title: 'Big Little Lies', author: 'Liane Moriarty &mdash; Kidman &amp; Witherspoon', footer: 'HBO: 2017 &middot; Screen Wins' },
      { file: 'no-country-for-old-men.html', image: 'no-country-for-old-men.jpg', genre: 'Crime / Neo-Western', title: 'No Country for Old Men', author: 'Cormac McCarthy &mdash; dir. Coen Brothers', footer: 'Film: 2007 &middot; Too Close to Call' },
      { file: 'the-shining.html', image: 'the-shining.jpg', genre: 'Horror / Psychological', title: 'The Shining', author: 'Stephen King &mdash; dir. Stanley Kubrick', footer: 'Film: 1980 &middot; Book Wins' },
      { file: 'where-the-crawdads-sing.html', image: 'where-the-crawdads_sing.jpg', genre: 'Mystery / Literary Fiction', title: 'Where the Crawdads Sing', author: 'Delia Owens &mdash; Daisy Edgar-Jones stars', footer: 'Film: 2022 &middot; Book Wins' },
    ]
  },
  {
    heading: 'Literary Fiction &amp; Drama',
    pages: [
      { file: 'atonement.html', image: 'atonement.jpg', genre: 'Literary Fiction', title: 'Atonement', author: 'Ian McEwan &mdash; dir. Joe Wright', footer: 'Film: 2007 &middot; Book Wins' },
      { file: 'never-let-me-go.html', image: 'never-let-me-go.jpg', genre: 'Literary Fiction / Sci-Fi', title: 'Never Let Me Go', author: 'Kazuo Ishiguro &mdash; Carey Mulligan stars', footer: 'Film: 2010 &middot; Book Wins' },
      { file: 'kite-runner.html', image: 'kite-runner.jpg', genre: 'Literary Fiction', title: 'The Kite Runner', author: 'Khaled Hosseini &mdash; dir. Marc Forster', footer: 'Film: 2007 &middot; Book Wins' },
      { file: 'room.html', image: 'room.jpg', genre: 'Literary Fiction', title: 'Room', author: 'Emma Donoghue &mdash; Brie Larson stars', footer: 'Film: 2015 &middot; Too Close to Call' },
      { file: 'wild.html', image: 'wild.jpg', genre: 'Memoir / Adventure', title: 'Wild', author: 'Cheryl Strayed &mdash; Reese Witherspoon stars', footer: 'Film: 2014 &middot; Book Wins' },
      { file: 'normal-people.html', image: 'normail-people.jpg', genre: 'Literary Fiction / Romance', title: 'Normal People', author: 'Sally Rooney &mdash; Paul Mescal stars', footer: 'Hulu/BBC: 2020 &middot; Too Close to Call' },
      { file: 'pachinko.html', image: 'Pachinko.jpg', genre: 'Historical Fiction / Family Saga', title: 'Pachinko', author: 'Min Jin Lee &mdash; Apple TV+ series', footer: 'Apple TV+: 2022 &middot; Book Wins' },
      { file: 'beloved.html', image: 'beloved.jpg', genre: 'Literary Fiction / Historical', title: 'Beloved', author: 'Toni Morrison &mdash; Oprah Winfrey stars', footer: 'Film: 1998 &middot; Book Wins' },
    ]
  },
  {
    heading: 'Classics Worth Revisiting',
    pages: [
      { file: 'dune.html', image: 'dune.jpg', genre: 'Science Fiction', title: 'Dune', author: 'Frank Herbert &mdash; dir. Denis Villeneuve', footer: 'Film: 2021&ndash;2024 &middot; Book Wins' },
      { file: 'the-martian.html', image: 'the-martian.jpg', genre: 'Science Fiction', title: 'The Martian', author: 'Andy Weir &mdash; Matt Damon stars', footer: 'Film: 2015 &middot; Too Close to Call' },
      { file: 'the-road.html', image: 'the-road.jpg', genre: 'Literary Fiction / Post-Apocalyptic', title: 'The Road', author: 'Cormac McCarthy &mdash; Viggo Mortensen stars', footer: 'Film: 2009 &middot; Book Wins' },
      { file: 'one-flew-over-the-cuckoos-nest.html', image: 'one-flew-over-the-cuckoos-next.jpg', genre: 'Literary Fiction / Drama', title: "One Flew Over the Cuckoo's Nest", author: 'Ken Kesey &mdash; Jack Nicholson stars', footer: 'Film: 1975 &middot; Too Close to Call' },
      { file: 'frankenstein.html', image: 'frankenstein.jpg', genre: 'Gothic Fiction / Horror', title: 'Frankenstein', author: 'Mary Shelley &mdash; dir. Guillermo del Toro', footer: 'Netflix: 2025 &middot; Book Wins' },
      { file: 'schindlers-list.html', image: 'schindlers-list.jpg', genre: 'Historical Fiction / Drama', title: "Schindler's List", author: 'Thomas Keneally &mdash; dir. Steven Spielberg', footer: 'Film: 1993 &middot; Screen Wins' },
      { file: 'lonesome-dove.html', image: 'lonesome-dove.jpg', genre: 'Western / Epic', title: 'Lonesome Dove', author: 'Larry McMurtry &mdash; Robert Duvall stars', footer: 'Miniseries: 1989 &middot; Book Wins' },
      { file: 'the-odyssey.html', image: 'the-odyssey.jpg', genre: 'Epic / Classic', title: 'The Odyssey', author: 'Homer &mdash; dir. Christopher Nolan', footer: 'In theaters July 17, 2026 &middot; Too Close to Call' },
    ]
  }
];

// ------------------------------------------------------------------ //
// BUILD
// ------------------------------------------------------------------ //

function buildCard(p) {
  return `
    <a class="book-card" href="${p.file}">
      <div class="book-card-img">
        <img src="images/${p.image}" alt="${p.title} cover" loading="lazy">
      </div>
      <div class="book-card-body">
        <span class="card-genre">${p.genre}</span>
        <h3>${p.title}</h3>
        <p class="card-author">${p.author}</p>
      </div>
      <div class="book-card-footer">${p.footer}</div>
    </a>`;
}

function buildSection(section) {
  const cards = section.pages.map(buildCard).join('\n');
  return `
<div class="cards-section">
  <h2>${section.heading}</h2>
  <div class="cards-grid">
    ${cards}
  </div>
</div>`;
}

function buildIndex() {
  const sections = SECTIONS.map(buildSection).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BooksVersusMovies.com &mdash; Honest Book &amp; Movie Comparisons</title>
  <meta name="description" content="Beautiful, honest comparisons of books and their film adaptations. What the book does better, what the movie does better, and whether you should read first.">
  <link rel="stylesheet" href="css/style.css">
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P0DY0XDWVV"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P0DY0XDWVV');
  </script>
</head>
<body>

<header>
  <div class="header-inner">
    <a class="site-logo" href="index.html">Books<span>Versus</span>Movies</a>
    <nav><a href="index.html">All Comparisons</a> &nbsp;&middot;&nbsp; <a href="about.html">About</a></nav>
  </div>
</header>

<div class="home-hero">
  <h1>The book was<br><em>probably</em> better.</h1>
  <p>Honest, in-depth comparisons of books and their film adaptations. What each version does well. What gets lost. Whether to read first.</p>
</div>
${sections}

<footer>
  <p>&copy; 2026 BooksVersusMovies.com &nbsp;&mdash;&nbsp; <a href="about.html">About</a></p>
  <p style="margin-top:0.5rem;font-size:0.75rem;color:#444;">As an Amazon Associate I earn from qualifying purchases.</p>
</footer>

</body>
</html>`;
}

// ------------------------------------------------------------------ //
// MAIN
// ------------------------------------------------------------------ //

function main() {
  const root = process.cwd();
  const output = buildIndex();
  fs.writeFileSync(path.join(root, 'index.html'), output, 'utf8');

  const total = SECTIONS.reduce((sum, s) => sum + s.pages.length, 0);
  console.log(`✅ index.html rebuilt with ${total} pages across ${SECTIONS.length} sections.`);
  SECTIONS.forEach(s => console.log(`   • ${s.heading}: ${s.pages.length} pages`));
}

main();
