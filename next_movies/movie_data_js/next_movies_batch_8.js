#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Page Generator (Batch 8)
 * Final 4 of the 25 new titles:
 *   1. The Perks of Being a Wallflower
 *   2. Ender's Game
 *   3. The Maze Runner
 *   4. Divergent
 *
 * Usage:
 *   node next_movies_batch_8.js
 *
 * Run from /next_movies/ subfolder.
 * Outputs HTML files to current directory.
 * Then: QA, move to root, run sitemap + index scripts.
 */

const fs = require('fs');
const path = require('path');

const PAGES = [
  {
    slug: 'perks-of-being-a-wallflower',
    title: 'The Perks of Being a Wallflower',
    genre: 'Coming of Age / Literary Fiction',
    author: 'Stephen Chbosky',
    bookYear: '1999',
    director: 'Stephen Chbosky',
    filmYear: '2012',
    verdict: 'tie',
    verdictText: 'Too Close to Call',
    affiliateLink: 'https://amzn.to/4c06Rna',
    image: 'perks-of-being-a-wallflower.jpg',
    youtubeId: 'n5rh7O4IDc0',
    trailerNote: 'Starring Logan Lerman, Emma Watson, Ezra Miller &mdash; Film: 2012',
    metaTitle: 'The Perks of Being a Wallflower: Book vs Movie — Chbosky vs Chbosky',
    metaDesc: "Stephen Chbosky's 1999 novel vs his own 2012 film — Charlie, Sam, Patrick, and a rare case where the author-directed adaptation genuinely rivals the source.",
    subtitle: 'Book (1999) vs. Movie (2012) &mdash; dir. Stephen Chbosky',
    storyBrief: `Charlie is a deeply introverted fifteen-year-old starting high school in Pittsburgh, writing letters to an unnamed recipient about his experiences — the friends he finds, the trauma he is slowly remembering, the books he reads, the music he loves. Stephen Chbosky's epistolary novel became a cult classic among teenagers and young adults after its 1999 publication, selling over ten million copies. Thirteen years later, Chbosky adapted and directed the film himself, casting Logan Lerman, Emma Watson, and Ezra Miller. It is one of the very few cases on this site where the author's adaptation genuinely rivals the source.`,
    differences: [
      {
        heading: 'Author as director',
        text: `Chbosky spent over a decade fighting to adapt his own novel and the investment shows. He knows what matters, what can be lost, and what must be found through different means. The film has the authority of someone who understands the material from inside — a quality absent from most literary adaptations, which are made by people who admire a book rather than people who wrote it.`
      },
      {
        heading: "Charlie's epistolary voice",
        text: `The novel's letters give Charlie a specific written voice — earnest, careful, sometimes heartbreaking in its precision. The film uses voiceover narration drawn from the letters, which preserves some of this quality. Logan Lerman's performance does the rest — his Charlie is interior and watchful in a way that matches the novel's register unusually well.`
      },
      {
        heading: 'Ezra Miller as Patrick',
        text: `Miller's Patrick is the film's great surprise — funny, generous, heartbreaking in his vulnerability. The novel's Patrick is rendered through Charlie's adoring perception, which makes him slightly idealised. Miller's performance is more fully dimensional and gives Patrick an interior life the novel only implies.`
      },
      {
        heading: "Emma Watson's Sam",
        text: `Watson plays Sam with warmth and intelligence but her star quality — the very quality that made her casting such a commercial decision — works slightly against the character. The novel's Sam is more ordinary and more aspirational for that ordinariness. Watson is too luminous to be the girl Charlie sees as extraordinary.`
      },
      {
        heading: 'The tunnel scene',
        text: `The scene in the tunnel — standing on the truck bed, David Bowie's Heroes, the specific feeling of being infinite — is the novel's most beloved passage and the film's most beloved scene. Both versions earn it. The film's version, with the wind and the music and three young actors at the top of their game, may be the definitive rendering.`
      }
    ],
    readFirst: `Either order works — this is the site's most genuine tie and the one case where reading after watching loses least. Chbosky's film is so faithful and so right that the two versions illuminate each other rather than one diminishing the other. If forced to choose: read first, for Charlie's voice. But watch either way.`,
    verdictBox: `Chbosky wrote one of the generation-defining coming-of-age novels of the 1990s and then made one of the finest adaptations of his own work in cinema history. The novel has Charlie's voice. The film has Ezra Miller. Both have the tunnel. This is a genuine tie and one of the site's most surprising ones.`,
    related: [
      { href: '/normal-people.html', label: 'Normal People' },
      { href: '/the-notebook.html', label: 'The Notebook' },
      { href: '/room.html', label: 'Room' }
    ]
  },

  {
    slug: 'enders-game',
    title: "Ender's Game",
    genre: 'Science Fiction',
    author: 'Orson Scott Card',
    bookYear: '1985',
    director: 'Gavin Hood',
    filmYear: '2013',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4e2oaqf',
    image: 'enders-game.jpg',
    youtubeId: '2SRizeR4MmU',
    trailerNote: 'Starring Asa Butterfield, Harrison Ford, Ben Kingsley &mdash; Film: 2013',
    metaTitle: "Ender's Game: Book vs Movie — Orson Scott Card vs Gavin Hood",
    metaDesc: "Orson Scott Card's 1985 novel vs Gavin Hood's 2013 film — Ender Wiggin, Battle School, and why the novel's interiority is the whole point.",
    subtitle: 'Book (1985) vs. Movie (2013) &mdash; dir. Gavin Hood',
    storyBrief: `Andrew "Ender" Wiggin is a brilliant child recruited to Battle School — an orbital military academy training humanity's future commanders for a war against an alien species called the Formics. The novel follows Ender's education, manipulation, and moral formation across years of increasingly complex strategic games. Orson Scott Card's Hugo and Nebula Award-winning novel is one of science fiction's essential works, built around a psychological portrait of a child prodigy that is as compelling as any military strategy it describes. Gavin Hood's 2013 film compresses years into weeks and loses almost everything that matters.`,
    differences: [
      {
        heading: "Ender's psychology",
        text: `The novel's central subject is Ender's mind — how he thinks, how he suffers, how he understands himself in relation to the violence he is capable of and afraid of. Card writes childhood strategic genius and moral complexity with extraordinary precision. The film shows Ender winning battles; the novel shows you what winning costs him.`
      },
      {
        heading: 'The compression of time',
        text: `The novel takes place across several years of Ender's childhood — the slow accumulation of his education, his isolation, his changing relationships with Alai, Bean, and Petra. The film compresses this into what feels like weeks, which destroys the weight of Ender's development. The end only works if you've spent years getting there.`
      },
      {
        heading: "The battle room",
        text: `Card's zero-gravity battle room is one of science fiction's great inventions — a tactical puzzle that Ender solves with lateral thinking that redefines the rules of the game. The film renders the battle room competently but without the novel's loving detail of each encounter's strategy. The battles are the novel's set pieces and they deserve more time.`
      },
      {
        heading: 'Asa Butterfield',
        text: `Butterfield plays Ender with quiet intelligence and visible strain — he is physically right for the role and emotionally committed. The problem is structural rather than performative: the film cannot give him the time the novel takes, so his transformation is told rather than felt.`
      },
      {
        heading: 'The ending',
        text: `The novel's final revelation — that the final game was the final battle — lands as one of science fiction's great twists because Card has spent hundreds of pages preparing its moral weight. The film reaches the same destination in a fraction of the time, which means the revelation is a plot point rather than a devastation.`
      }
    ],
    readFirst: `Yes — and emphatically so. The film is a serviceable plot summary of a novel whose meaning lives in what cannot be summarised. Read the novel and the film becomes an illustration of events you've already experienced at full depth. Watch the film first and you'll wonder why the novel has such a devoted following.`,
    verdictBox: `Card wrote one of science fiction's masterworks — a novel about strategy, childhood, and moral responsibility that rewards every reading. Hood made a competent film that proves the novel is essentially unfilmable in two hours. Read the book. See the film only if you want pictures to go with the story. The novel is the thing.`,
    related: [
      { href: '/dune.html', label: 'Dune' },
      { href: '/the-maze-runner.html', label: 'The Maze Runner' },
      { href: '/ready-player-one.html', label: 'Ready Player One' }
    ]
  },

  {
    slug: 'the-maze-runner',
    title: 'The Maze Runner',
    genre: 'Young Adult / Science Fiction',
    author: 'James Dashner',
    bookYear: '2009',
    director: 'Wes Ball',
    filmYear: '2014',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/41Kda9B',
    image: 'the-maze-runner.jpg',
    youtubeId: 'AwwbhhjQ9Xk',
    trailerNote: 'Starring Dylan O\'Brien, Kaya Scodelario, Thomas Brodie-Sangster &mdash; Film: 2014',
    metaTitle: 'The Maze Runner: Book vs Movie — James Dashner vs Wes Ball',
    metaDesc: "James Dashner's 2009 novel vs Wes Ball's 2014 film — Thomas, the Glade, the Maze, and how much of the mystery survives translation to screen.",
    subtitle: 'Book (2009) vs. Movie (2014) &mdash; dir. Wes Ball',
    storyBrief: `Thomas arrives in the Glade — a large open area surrounded by an ever-shifting maze — with no memory of his past, joining a community of boys who have been deposited there one by one. The maze is lethal, the Grievers that patrol it are deadly, and no one has ever found a way out. James Dashner's debut novel is a propulsive mystery-thriller built on a central puzzle that genuinely sustains momentum. Wes Ball's adaptation is one of the more faithful YA adaptations of the 2010s and works well as a thriller even as it loses some of what makes the novel distinctive.`,
    differences: [
      {
        heading: "Thomas's interiority",
        text: `Dashner writes Thomas's confusion and growing determination from inside his perspective — the reader experiences the Glade's disorientation alongside him, feeling the gaps in memory as Thomas feels them. Dylan O'Brien's performance captures Thomas's physical energy and determination but the film necessarily externalises what the novel keeps interior.`
      },
      {
        heading: 'The Glade community',
        text: `The novel gives more time to the social structure of the Glade — the jobs, the hierarchies, the culture the boys have built in their imprisonment. This texture establishes what Thomas is disrupting when he arrives and what is at stake in the community beyond his individual survival. The film sketches this efficiently but more thinly.`
      },
      {
        heading: 'The Maze itself',
        text: `Ball films the Maze with genuine scale and tension — the shifting walls, the Grievers, the claustrophobia of the corridors. This is the area where the film most successfully translates the novel, because the Maze is primarily a visual and spatial experience and the film can render space where the novel must describe it.`
      },
      {
        heading: 'Teresa',
        text: `The novel establishes a telepathic connection between Thomas and Teresa — the only girl sent to the Glade — that gives their relationship a specific quality of intimacy under duress. The film drops the telepathy, simplifying their connection into conventional chemistry. Kaya Scodelario brings intelligence to the role but with less to work with.`
      },
      {
        heading: 'The ending',
        text: `Both versions end with the escape from the Maze and the revelation that the outside world is not what the survivors hoped. The film's ending sets up sequels efficiently. The novel's ending is slightly more ambiguous and somewhat more disturbing in its implications.`
      }
    ],
    readFirst: `Either order works reasonably well — the film is faithful enough that watching first doesn't significantly diminish the novel. Reading first gives you Thomas's interiority and the fuller Glade community. The novel is the better experience; the film is a solid companion.`,
    verdictBox: `Dashner wrote a propulsive YA thriller that sustains its central mystery with genuine skill. Ball made a faithful, well-executed adaptation that loses some of the novel's interiority and gains a visual rendering of the Maze that the prose can only approximate. The novel is the better version. The film is one of the better YA adaptations of its era.`,
    related: [
      { href: '/divergent.html', label: 'Divergent' },
      { href: '/enders-game.html', label: "Ender's Game" },
      { href: '/hunger-games-sunrise-on-the-reaping.html', label: 'The Hunger Games' }
    ]
  },

  {
    slug: 'divergent',
    title: 'Divergent',
    genre: 'Young Adult / Dystopian',
    author: 'Veronica Roth',
    bookYear: '2011',
    director: 'Neil Burger',
    filmYear: '2014',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/3O5g7yq',
    image: 'divergent.jpg',
    youtubeId: 'sutgWjz10sM',
    trailerNote: 'Starring Shailene Woodley, Theo James &mdash; Film: 2014',
    metaTitle: 'Divergent: Book vs Movie — Veronica Roth vs Neil Burger',
    metaDesc: "Veronica Roth's 2011 novel vs Neil Burger's 2014 film — Tris Prior, the faction system, and whether the YA dystopia survives the adaptation.",
    subtitle: 'Book (2011) vs. Movie (2014) &mdash; dir. Neil Burger',
    storyBrief: `In a future Chicago divided into five factions based on personality — Dauntless, Erudite, Abnegation, Amity, Candor — sixteen-year-old Beatrice "Tris" Prior discovers she is Divergent: she belongs to no single faction and cannot be controlled. Veronica Roth's debut novel sold over thirty-five million copies and launched a trilogy that became one of the defining YA dystopian franchises of the early 2010s. Neil Burger's 2014 adaptation starred Shailene Woodley in a performance that is the film's best argument for its own existence.`,
    differences: [
      {
        heading: "Tris's interiority",
        text: `Roth writes in first person, giving Tris a voice of moral seriousness and self-doubt that is the novel's most distinctive quality. Tris questions herself, her choices, and the system she is operating within throughout — this ambivalence is what elevates the novel above standard YA action. Woodley communicates this through performance but the film's Tris is more immediately heroic than the novel's.`
      },
      {
        heading: 'The faction system',
        text: `Roth's faction system is the novel's central world-building concept and she establishes it with enough internal logic to make Tris's choices feel genuinely consequential. The film establishes the system efficiently for non-readers but somewhat flattens its implications — the critique of identity-based sorting is clearer in the novel.`
      },
      {
        heading: 'Shailene Woodley',
        text: `Woodley is the film's significant achievement — she plays Tris with an intelligence and physical commitment that elevates the material. Her Tris is more immediately sympathetic than the novel's, which is more morally complicated and occasionally less likeable. Woodley makes the adaptation worth watching even when the script lets her down.`
      },
      {
        heading: 'The Dauntless training',
        text: `The novel's Dauntless initiation sequence — the physical challenges, the social cruelty, the fear simulations — is the book's most visceral section and covers a substantial portion of its length. The film compresses this into a montage-driven training arc that hits the plot points without the accumulation of pressure that makes Tris's situation feel genuinely dangerous.`
      },
      {
        heading: 'The series trajectory',
        text: `The Divergent film series ultimately stalled — the final instalment was split into two films, the second of which performed poorly enough that it was never theatrically released. The novels resolve their story fully. Anyone who starts the film series should know the ending exists only on the page.`
      }
    ],
    readFirst: `Yes — Tris's first-person voice and moral complexity are what distinguish the novel from its competitors in the YA dystopian genre. The film is a competent adaptation that is better than its reputation suggests, but the novel gives you the fuller version of the character and world. Read first, then watch Woodley do what she can with a compressed version.`,
    verdictBox: `Roth wrote a YA dystopian novel with more moral seriousness than the genre usually delivers. Burger made a competent, well-cast adaptation that loses the seriousness in pursuit of pace. Woodley is excellent. The novel is better. If you start the film series, finish the story in the books — the films didn't get there.`,
    related: [
      { href: '/the-maze-runner.html', label: 'The Maze Runner' },
      { href: '/hunger-games-sunrise-on-the-reaping.html', label: 'The Hunger Games' },
      { href: '/enders-game.html', label: "Ender's Game" }
    ]
  }
];

// ------------------------------------------------------------------ //
// HTML TEMPLATE
// ------------------------------------------------------------------ //

function getVerdictClass(verdict) {
  if (verdict === 'book') return 'verdict-book';
  if (verdict === 'film') return 'verdict-film';
  return 'verdict-tie';
}

function buildPage(p) {
  const youtubeId = p.youtubeId;
  const verdictClass = getVerdictClass(p.verdict);

  const differencesHTML = p.differences.map(d => `
    <div class="difference">
      <h3>${d.heading}</h3>
      <p>${d.text}</p>
    </div>`).join('\n');

  const relatedHTML = p.related.map(r => `
      <a class="related-card" href="${r.href}"><span class="rel-label">Also Compare</span>${r.label}</a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p.metaTitle}</title>
  <meta name="description" content="${p.metaDesc}">
  <link rel="stylesheet" href="css/style.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Review",
    "name": "${p.title}: Book vs Movie",
    "reviewBody": "${p.verdictBox.replace(/"/g, '\\"').replace(/\n/g, ' ')}",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "${p.verdict === 'book' ? '5' : p.verdict === 'tie' ? '4' : '3'}",
      "bestRating": "5",
      "worstRating": "3"
    },
    "author": { "@type": "Organization", "name": "BooksVersusMovies.com" },
    "itemReviewed": {
      "@type": "Book",
      "name": "${p.title}",
      "author": { "@type": "Person", "name": "${p.author}" },
      "datePublished": "${p.bookYear}"
    }
  }
  </script>
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
    <a class="site-logo" href="/">Books<span>Versus</span>Movies</a>
    <nav><a href="/">All Comparisons</a> &nbsp;&middot;&nbsp; <a href="about.html">About</a></nav>
  </div>
</header>
<div class="page-hero">
  <div class="genre-tag">${p.genre}</div>
  <h1>${p.title}</h1>
  <p class="subtitle">${p.subtitle}</p>
</div>
<div class="page-wrap">
  <div class="comparison">
    <div class="panel-book">
      <div class="panel-label">The Book</div>
      <a class="book-cover-link" href="${p.affiliateLink}" target="_blank" rel="noopener sponsored">
        <img class="book-cover" src="./images/${p.image}" alt="${p.title} book cover ${p.author} ${p.bookYear}" loading="lazy">
      </a>
      <a class="buy-btn" href="${p.affiliateLink}" target="_blank" rel="noopener sponsored">Buy the Book &rarr;</a>
      <p class="affiliate-disclosure">As an Amazon Associate I earn from qualifying purchases.</p>
    </div>
    <div class="panel-film">
      <div class="panel-label">The Movie</div>
      <a class="trailer-link" href="https://www.youtube.com/watch?v=${youtubeId}" target="_blank" rel="noopener">
        <div class="trailer-thumbnail">
          <img src="https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg" alt="${p.title} ${p.filmYear} film official trailer">
          <div class="trailer-play">&#9658;</div>
        </div>
      </a>
      <p class="trailer-note">${p.trailerNote}</p>
    </div>
  </div>
  <div class="meta-strip">
    <div class="meta-item"><strong>Author</strong>${p.author}</div>
    <div class="meta-item"><strong>Book Published</strong>${p.bookYear}</div>
    <div class="meta-item"><strong>Film Released</strong>${p.filmYear}</div>
    <div class="meta-item"><strong>Director</strong>${p.director}</div>
    <span class="verdict-badge ${verdictClass}">${p.verdictText}</span>
  </div>
  <div class="body-text">
    <h2>The Story in Brief</h2>
    <p>${p.storyBrief}</p>
    <h2>Key Differences</h2>
    ${differencesHTML}
    <h2>Should You Read First?</h2>
    <p>${p.readFirst}</p>
    <div class="verdict-box">
      <div class="verdict-title">Verdict</div>
      <p>${p.verdictBox}</p>
    </div>
  </div>
  <div class="related-section">
    <h3>More Comparisons</h3>
    <div class="related-grid">
      ${relatedHTML}
    </div>
  </div>
</div>
<footer>
  <p>&copy; 2026 BooksVersusMovies.com &nbsp;&mdash;&nbsp; <a href="/">Home</a> &nbsp;&middot;&nbsp; <a href="about.html">About</a></p>
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
  let generated = 0;

  PAGES.forEach(page => {
    const filename = `${page.slug}.html`;
    const filepath = path.join(root, filename);
    const html = buildPage(page);
    fs.writeFileSync(filepath, html, 'utf8');
    console.log(`  ✅ Generated ${filename}`);
    generated++;
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${generated} pages generated.`);
  console.log('\nNext steps:');
  console.log('  1. node script_qa.js');
  console.log('  2. move *.html .. (Windows) / mv *.html .. (Mac)');
  console.log('  3. node script_update_sitemap.js');
  console.log('  4. node script_update_index.js');
  console.log('  5. git add . && git commit -m "Add 4 pages" && git push');
}

main();
