#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Page Generator (Batch 5)
 * Titles 6–10 of the 25 new titles:
 *   1. The Great Gatsby
 *   2. To Kill a Mockingbird
 *   3. The Color Purple
 *   4. The Handmaid's Tale
 *   5. Station Eleven
 *
 * Usage:
 *   node next_movies_batch_5.js
 *
 * Run from /next_movies/ subfolder.
 * Outputs HTML files to current directory.
 * Then: QA, move to root, run sitemap + index scripts.
 */

const fs = require('fs');
const path = require('path');

const PAGES = [
  {
    slug: 'the-great-gatsby',
    title: 'The Great Gatsby',
    genre: 'Literary Fiction / Classic',
    author: 'F. Scott Fitzgerald',
    bookYear: '1925',
    director: 'Baz Luhrmann',
    filmYear: '2013',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4dtVh65',
    image: 'the-great-gatsby.jpg',
    youtubeId: 'sN183rJltNM',
    trailerNote: 'Starring Leonardo DiCaprio, Carey Mulligan, Tobey Maguire &mdash; Film: 2013',
    metaTitle: 'The Great Gatsby: Book vs Movie — Fitzgerald vs Baz Luhrmann',
    metaDesc: "F. Scott Fitzgerald's 1925 novel vs Baz Luhrmann's 2013 film — Jay Gatsby, the green light, and why the prose is the point.",
    subtitle: 'Book (1925) vs. Movie (2013) &mdash; dir. Baz Luhrmann',
    storyBrief: `Nick Carraway, a Yale man newly arrived in West Egg, Long Island, becomes neighbour and eventual confidant to Jay Gatsby — a mysterious millionaire who throws lavish parties in pursuit of a dream that is, at its core, entirely about one woman across the water. F. Scott Fitzgerald's 1925 novel is one of the most precisely written works in American literature — every sentence calibrated, every image deliberate. Baz Luhrmann's 2013 film, with Leonardo DiCaprio as Gatsby and a Jay-Z-inflected soundtrack, is spectacular, sympathetic, and fundamentally a different kind of work.`,
    differences: [
      {
        heading: "Fitzgerald's prose",
        text: `The novel's power is almost entirely in its sentences. Nick's narration has a quality of lyric sadness that Fitzgerald sustains across the whole book — the famous final lines about boats against the current being borne back ceaselessly into the past are the culmination of a prose argument, not just a pretty ending. Luhrmann's film cannot render this. It quotes the sentences on screen, which is an acknowledgment of defeat that is also an act of respect.`
      },
      {
        heading: "Luhrmann's maximalism",
        text: `Luhrmann makes films about excess and spectacle, which makes Gatsby's parties an ideal subject. The parties in the film are magnificent — chaotic, gorgeous, overwhelming. The novel's parties are quieter and stranger, described from the outside of Gatsby's dream rather than inside it. Luhrmann pulls you into the fantasy; Fitzgerald keeps you on the lawn, watching.`
      },
      {
        heading: "Leonardo DiCaprio",
        text: `DiCaprio's Gatsby is warm, yearning, visibly desperate — the performance gives you everything except what the novel withholds: the precise nature of Gatsby's fraudulence, his capacity for self-delusion. DiCaprio makes Gatsby sympathetic in a way Fitzgerald carefully does not. The novel's Gatsby is a magnificent fake. DiCaprio's is a genuine romantic.`
      },
      {
        heading: "The soundtrack",
        text: `Luhrmann's decision to score the 1920s with contemporary hip-hop and pop was divisive and mostly wrong — it works as an argument about the timelessness of aspiration but breaks the novel's specific period atmosphere. The novel's Jazz Age is not an allegory. It is a specific historical moment with a specific sound.`
      },
      {
        heading: "Nick Carraway",
        text: `Tobey Maguire plays Nick as wide-eyed and passive, which captures half of Nick's function. The novel's Nick is both more morally alert and more complicit — he knows what he's watching is destructive and watches it anyway, with something close to admiration. This moral ambiguity is harder to sustain on screen.`
      }
    ],
    readFirst: `Yes — and this is among the most important read-first recommendations on the site. Fitzgerald's prose is the experience, and no film can replicate it. Luhrmann's film is a sincere, sometimes brilliant attempt to translate a work that resists translation. Read the novel first and the film becomes a meditation on what is lost in the crossing.`,
    verdictBox: `Fitzgerald wrote one of the perfect American novels. Luhrmann made a brave, flawed, sometimes beautiful film of it. Read the novel — it is one hundred and eighty pages and will take three hours and will last a lifetime. See the film if DiCaprio's face is worth the trade. The book is the thing.`,
    related: [
      { href: '/atonement.html', label: 'Atonement' },
      { href: '/on-the-road.html', label: 'On the Road' },
      { href: '/american-psycho.html', label: 'American Psycho' }
    ]
  },

  {
    slug: 'to-kill-a-mockingbird',
    title: 'To Kill a Mockingbird',
    genre: 'Literary Fiction / Classic',
    author: 'Harper Lee',
    bookYear: '1960',
    director: 'Robert Mulligan',
    filmYear: '1962',
    verdict: 'tie',
    verdictText: 'Too Close to Call',
    affiliateLink: 'https://amzn.to/4cmIdhQ',
    image: 'to-kill-a-mockingbird.jpg',
    youtubeId: '4-CrrtYjrbM',
    trailerNote: 'Starring Gregory Peck, Mary Badham &mdash; Film: 1962',
    metaTitle: 'To Kill a Mockingbird: Book vs Movie — Harper Lee vs Robert Mulligan',
    metaDesc: "Harper Lee's Pulitzer Prize-winning novel vs Robert Mulligan's 1962 film — Atticus Finch, Scout's childhood, and one of the great book-to-film debates.",
    subtitle: 'Book (1960) vs. Movie (1962) &mdash; dir. Robert Mulligan',
    storyBrief: `Scout Finch grows up in Maycomb, Alabama during the Depression, watched over by her widowed father Atticus — a lawyer who agrees to defend Tom Robinson, a Black man falsely accused of raping a white woman. Harper Lee's Pulitzer Prize-winning novel is narrated through Scout's child's-eye view, which gives it both its innocence and its moral authority. Robert Mulligan's film, made two years after publication, won three Academy Awards including Best Actor for Gregory Peck. This is one of the site's genuine ties — two works of approximately equal power in different forms.`,
    differences: [
      {
        heading: "Scout's narration",
        text: `The novel is narrated by an adult Scout looking back on her childhood, which gives the prose a double register — the child's bewilderment and the adult's understanding, sometimes in the same sentence. This double consciousness cannot be fully rendered on screen. The film's Scout (Mary Badham) is magnificent and immediate but the adult reflection is largely lost.`
      },
      {
        heading: "Gregory Peck as Atticus",
        text: `Peck's Atticus is one of cinema's great performances — moral authority made physical, decency made visible. Harper Lee said he was her father. The performance may be more iconic than the novel's Atticus, whose virtue is somewhat more ambiguous in the text than Peck's noble bearing suggests. This is one of the rare cases where the casting defines the character beyond the author's intentions.`
      },
      {
        heading: "The Boo Radley mystery",
        text: `The novel gives significant space to the children's fascination with Boo Radley — the reclusive neighbour who leaves gifts in a tree and exists for Scout as a figure of terror and eventual grace. The film preserves this thread but compresses it. Robert Duvall's debut performance as Boo is wordless and haunting.`
      },
      {
        heading: "Maycomb's community",
        text: `Lee's novel is dense with secondary characters who constitute Maycomb's social fabric — the various neighbours, the class distinctions, the social mechanics of a small Southern town. The film necessarily focuses on the central narrative and loses some of this texture.`
      },
      {
        heading: "The trial",
        text: `Mulligan shoots the courtroom with restraint and precision — the segregated gallery, Atticus's closing argument, the verdict. The film's trial sequence is among the finest in courtroom cinema. The novel's trial has more legal detail and more of Atticus's internal reasoning, but the film's version is arguably more emotionally devastating.`
      }
    ],
    readFirst: `Either order works — this is one of the very few cases where the film is good enough that watching first is not a diminishment. Read first if you want Scout's full interior world. Watch first if you want Gregory Peck's Atticus Finch in his full authority. Both are essential.`,
    verdictBox: `Lee wrote one of the great American novels of the twentieth century and Mulligan made one of the great American films of the same period. They are different achievements of approximately equal stature. Read the novel for Scout's voice. See the film for Gregory Peck. This is a genuine tie.`,
    related: [
      { href: '/the-color-purple.html', label: 'The Color Purple' },
      { href: '/the-great-gatsby.html', label: 'The Great Gatsby' },
      { href: '/kite-runner.html', label: 'The Kite Runner' }
    ]
  },

  {
    slug: 'the-color-purple',
    title: 'The Color Purple',
    genre: 'Literary Fiction / Historical',
    author: 'Alice Walker',
    bookYear: '1982',
    director: 'Steven Spielberg',
    filmYear: '1985',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4cdXfp8',
    image: 'the-color-purple.jpg',
    youtubeId: '_h-efLS7VV4',
    trailerNote: 'Starring Whoopi Goldberg, Danny Glover, Oprah Winfrey &mdash; Film: 1985',
    metaTitle: 'The Color Purple: Book vs Movie — Alice Walker vs Steven Spielberg',
    metaDesc: "Alice Walker's Pulitzer Prize-winning novel vs Spielberg's 1985 film — Celie's voice, the epistolary form, and what the screen cannot carry.",
    subtitle: 'Book (1982) vs. Movie (1985) &mdash; dir. Steven Spielberg',
    storyBrief: `Celie is a poor Black woman in the rural American South in the early twentieth century, writing letters to God — and later to her sister Nettie — across decades of abuse, separation, and eventual liberation. Alice Walker's Pulitzer Prize and National Book Award-winning novel is written entirely in Celie's voice, in an African American vernacular English that is the novel's formal and emotional core. Steven Spielberg's 1985 film was nominated for eleven Academy Awards and won none. Whoopi Goldberg's Celie is one of the great screen performances of the decade.`,
    differences: [
      {
        heading: "Celie's voice",
        text: `The novel is written entirely in Celie's letters — her vernacular, her spelling, her particular way of seeing. Walker's formal choice is the novel's most important decision: Celie's voice is the experience. No film can render first-person epistolary form without narration, and narration cannot capture the intimacy of a letter written to God by someone who has never been permitted to speak.`
      },
      {
        heading: "Shug Avery",
        text: `Margaret Avery's Shug is glamorous and warm in the film. Walker's Shug is more sexually complex and more central to Celie's liberation — the novel's treatment of Celie and Shug's relationship is considerably more explicit and more radical than Spielberg was willing to show in 1985. The film softens the relationship in ways that reduce its meaning.`
      },
      {
        heading: "Spielberg's sentimentality",
        text: `Spielberg is a maximalist of emotion and The Color Purple is his most emotionally demanding material. He handles it with enormous care and occasional excess — the reunions are bigger than Walker writes them, the suffering slightly more pictorial. The novel's pain is quieter and more sustained.`
      },
      {
        heading: "Nettie's letters from Africa",
        text: `The novel's parallel narrative — Nettie's letters from Africa, suppressed by Mister for decades — is substantial and gives the novel a global dimension. The film compresses Nettie's African story significantly, which reduces the novel's scope.`
      },
      {
        heading: "Whoopi Goldberg",
        text: `Goldberg's Celie is one of the great overlooked performances in American cinema — she communicates decades of internal life without the letters, without the narration, with only her face and body. That she did not win the Academy Award remains one of the institution's more notable failures.`
      }
    ],
    readFirst: `Yes — the novel's epistolary form is the experience. Celie's voice cannot be filmed. Read first and the film becomes a companion: Spielberg finding what can be shown of a story that lives on the page.`,
    verdictBox: `Walker wrote a novel that is formally radical and emotionally devastating. Spielberg made an imperfect, sincere, sometimes beautiful film of it. The novel is the greater work. The film has Whoopi Goldberg, which is its own argument. Read the novel. See the film. Prefer the novel.`,
    related: [
      { href: '/to-kill-a-mockingbird.html', label: 'To Kill a Mockingbird' },
      { href: '/beloved.html', label: 'Beloved' },
      { href: '/kite-runner.html', label: 'The Kite Runner' }
    ]
  },

  {
    slug: 'the-handmaids-tale',
    title: "The Handmaid's Tale",
    genre: 'Dystopian Fiction',
    author: 'Margaret Atwood',
    bookYear: '1985',
    director: 'Volker Schlöndorff',
    filmYear: '1990',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4bSfaCN',
    image: 'the-handmaids-tale.jpg',
    youtubeId: '81PyH5TH-NQ',
    trailerNote: 'Starring Natasha Richardson, Faye Dunaway &mdash; 1990 Film &mdash; Hulu series from 2017',
    metaTitle: "The Handmaid's Tale: Book vs Movie vs TV — Atwood vs Schlöndorff vs Hulu",
    metaDesc: "Margaret Atwood's 1985 novel vs the 1990 film vs the Hulu series — Offred, Gilead, and why the book remains the essential version.",
    subtitle: 'Book (1985) vs. Film (1990) &mdash; dir. Volker Schlöndorff &mdash; also Hulu series (2017)',
    storyBrief: `In the Republic of Gilead — a near-future theocratic America — fertile women are enslaved as Handmaids, forced to bear children for the ruling class. Offred is one such Handmaid, narrating her situation with a controlled intelligence that is itself an act of resistance. Margaret Atwood's novel, published in 1985, has become one of the defining political texts of our era. Volker Schlöndorff's 1990 film, with Natasha Richardson, is largely forgotten. The Hulu series, starring Elisabeth Moss, extended Atwood's world across multiple seasons and created its own cultural moment.`,
    differences: [
      {
        heading: "Offred's narration",
        text: `Atwood's Offred narrates in a voice of extraordinary precision — controlled, ironic, occasionally beautiful, always aware of its own limits. The novel's final section, the Historical Notes, reframes everything that came before, suggesting Offred's account is partial and mediated. This formal sophistication is the novel's greatest achievement and the element most difficult to translate to screen.`
      },
      {
        heading: "The 1990 film",
        text: `Schlöndorff's film, with a screenplay by Harold Pinter, is respectful but inert. Natasha Richardson is affecting but the film cannot replicate Atwood's prose and doesn't find a cinematic equivalent. It's a curiosity rather than a companion to the novel.`
      },
      {
        heading: "The Hulu series",
        text: `Elisabeth Moss's Offred is one of television's defining performances — interior without narration, resistant without speech. The series extends Atwood's world into territory the novel deliberately left ambiguous, which is both its strength (more story) and its limitation (less mystery). Season one is close to the novel and is excellent. Subsequent seasons are original work of varying quality.`
      },
      {
        heading: "Gilead's world-building",
        text: `Atwood builds Gilead through implication and detail — the colour-coded clothing, the patronymic names, the ceremonies described in flat procedural language. The Hulu series renders this visually with great care and occasional power. The red cloaks and white wings are now more culturally present than the prose that invented them.`
      },
      {
        heading: "Political resonance",
        text: `Atwood wrote the novel as a response to the religious right in 1980s America and as a compendium of actual historical practices — nothing in the novel was invented that had not been done to women somewhere. The Hulu series arrived in 2017 at a moment when the novel's politics felt urgent in new ways. The series absorbed the political moment; the novel generated it.`
      }
    ],
    readFirst: `Yes — read the novel before any screen version. The 1990 film can be skipped. The Hulu series is worth watching after the novel, taking Season 1 as the best adaptation and subsequent seasons as extended fanfiction in the world Atwood created.`,
    verdictBox: `Atwood wrote one of the essential political novels of the twentieth century. The 1990 film did not do it justice. The Hulu series found a worthy visual language for it but replaced Atwood's formal precision with narrative extension. The novel is the source and remains the best version. Read it first and repeatedly.`,
    related: [
      { href: '/station-eleven.html', label: 'Station Eleven' },
      { href: '/never-let-me-go.html', label: 'Never Let Me Go' },
      { href: '/room.html', label: 'Room' }
    ]
  },

  {
    slug: 'station-eleven',
    title: 'Station Eleven',
    genre: 'Literary Fiction / Post-Apocalyptic',
    author: 'Emily St. John Mandel',
    bookYear: '2014',
    director: 'Patrick Somerville',
    filmYear: '2021',
    verdict: 'tie',
    verdictText: 'Too Close to Call',
    affiliateLink: 'https://amzn.to/3PN3YyF',
    image: 'station-eleven.jpg',
    youtubeId: 'LPm52rq8CZA',
    trailerNote: 'Starring Mackenzie Davis, Himesh Patel, Gael García Bernal &mdash; HBO Max series: 2021',
    metaTitle: 'Station Eleven: Book vs TV Series — Emily St. John Mandel vs HBO',
    metaDesc: "Emily St. John Mandel's 2014 novel vs the HBO Max series — the Georgia Flu, the Travelling Symphony, and one of television's great pandemic stories.",
    subtitle: 'Book (2014) vs. TV Series (2021) &mdash; dir. Patrick Somerville (HBO Max)',
    storyBrief: `A flu pandemic kills most of the world's population. Twenty years later, a travelling theatre and orchestra company moves between the settlements of the Great Lakes region, performing Shakespeare and classical music under the motto: survival is insufficient. Emily St. John Mandel's National Book Award finalist weaves between the pandemic's early days and the world that follows, centred on a handful of characters connected to a famous actor who dies on stage the night the flu arrives. Patrick Somerville's HBO Max adaptation, released in 2021 — itself arriving during a pandemic — is one of the finest literary adaptations in television history.`,
    differences: [
      {
        heading: "The structure",
        text: `Mandel's novel moves between timelines with elegant economy — the pre-pandemic world, the immediate collapse, and the twenty-years-later present. Somerville's series restructures this more radically, giving different characters their own temporal arcs and adding material that deepens the world without contradicting the novel. This is adaptation as expansion rather than compression.`
      },
      {
        heading: "Jeevan Chaudhary",
        text: `The series substantially expands Jeevan's role, following him through the pandemic's first days in a way the novel only sketches. Himesh Patel's performance anchors the series with a quality of ordinary bewildered decency that the novel's more elliptical treatment of the character couldn't provide.`
      },
      {
        heading: "The Travelling Symphony",
        text: `Mandel's Symphony is a collective presence — the company as a whole carries the novel's argument about art's survival function. The series gives individual Symphony members more story. Mackenzie Davis's Kirsten is more fully realised on screen than on the page, with a complete arc that the novel only suggests.`
      },
      {
        heading: "The Prophet",
        text: `Both versions have a threatening religious leader called the Prophet. The series makes him more central and his backstory more elaborate. The revelation of his identity lands differently in each version — the novel is more elliptical, the series more dramatically developed.`
      },
      {
        heading: "The Dr. Eleven comic",
        text: `The graphic novel-within-the-novel — drawn by Arthur Leander's first wife Miranda, depicting a space station — is the novel's central symbol. The series renders the comic visually and uses it as a recurring aesthetic element, which is the right choice and works beautifully.`
      }
    ],
    readFirst: `Either order works well — this is one of the rare cases where reading after watching is equally rewarding. The series is faithful enough that it doesn't spoil the novel's pleasures, and the novel provides a different experience of the same material. If forced to choose: read first, then watch the series as the finest possible companion piece.`,
    verdictBox: `Mandel wrote a beautifully constructed novel about what survives catastrophe and why it matters. Somerville made one of the finest literary adaptations in television history from it. The novel is more formally precise. The series is more emotionally generous. Both are essential. This is a genuine tie.`,
    related: [
      { href: '/the-handmaids-tale.html', label: "The Handmaid's Tale" },
      { href: '/never-let-me-go.html', label: 'Never Let Me Go' },
      { href: '/dark-matter.html', label: 'Dark Matter' }
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
  console.log('  5. git add . && git commit -m "Add 5 pages" && git push');
}

main();
