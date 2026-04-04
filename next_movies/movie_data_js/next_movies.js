#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Page Generator (Batch 4)
 * First 5 of the 25 new titles:
 *   1. The Girl with the Dragon Tattoo
 *   2. The Da Vinci Code
 *   3. American Psycho
 *   4. LA Confidential
 *   5. On the Road
 *
 * Usage:
 *   node next_movies_batch4.js
 *
 * Run from /next_movies/ subfolder.
 * Outputs HTML files to current directory.
 * Then: QA, move to root, run sitemap + index scripts.
 *
 * NOTE: affiliate_link and youtubeId are placeholders — fill before running.
 */

const fs = require('fs');
const path = require('path');

const PAGES = [
  {
    slug: 'girl-with-the-dragon-tattoo',
    title: 'The Girl with the Dragon Tattoo',
    genre: 'Thriller / Crime',
    author: 'Stieg Larsson',
    bookYear: '2005',
    director: 'David Fincher',
    filmYear: '2011',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/XXXXXXX',
    image: 'girl-with-the-dragon-tattoo.jpg',
    youtubeId: 'XXXXXXXXXXX',
    trailerNote: 'Starring Daniel Craig, Rooney Mara &mdash; Film: 2011',
    metaTitle: 'The Girl with the Dragon Tattoo: Book vs Movie — Larsson vs Fincher',
    metaDesc: "Stieg Larsson's Millennium novel vs David Fincher's 2011 film — Lisbeth Salander on the page vs screen, and why the book's sprawl is a feature not a bug.",
    subtitle: 'Book (2005) vs. Movie (2011) &mdash; dir. David Fincher',
    storyBrief: `Disgraced journalist Mikael Blomkvist is hired by a wealthy industrialist to investigate the forty-year-old disappearance of his niece. In the course of the investigation he meets Lisbeth Salander — hacker, ward of the state, social outcast, and one of crime fiction's most compelling protagonists. Stieg Larsson's posthumously published thriller was a global sensation, selling over eighty million copies. David Fincher's adaptation is one of the most accomplished Hollywood thrillers of the 2000s, cold and precise and relentless. It still doesn't capture everything the novel does.`,
    differences: [
      {
        heading: "Lisbeth Salander on the page",
        text: `Larsson's Lisbeth is rendered in extraordinary detail — her history, her psychology, her particular relationship to violence, her code of ethics, and her complicated feelings about Blomkvist. The novel has space for her interior life in a way that two and a half hours of film cannot. Rooney Mara gives one of the great screen performances of the 2010s and still only captures a portion of who Lisbeth is.`
      },
      {
        heading: "The Swedish social context",
        text: `Larsson was a journalist and his novel is saturated with specific knowledge of Swedish institutional failures — the welfare system, the legal apparatus that allows powerful men to abuse vulnerable women, the particular corruptions of Swedish corporate culture. Much of this context is streamlined in Fincher's film, which means the story becomes a thriller rather than an indictment.`
      },
      {
        heading: "Fincher's visual language",
        text: `Fincher shoots Sweden in desaturated winter light, making it feel like a frozen moral landscape. The opening title sequence — Trent Reznor and Atticus Ross's industrial score over Lisbeth constructed in liquid darkness — is one of the finest opening sequences in modern cinema. The film's aesthetics are a genuine achievement.`
      },
      {
        heading: "The Vanger family mystery",
        text: `The novel's investigation into the Vanger family history is considerably more elaborate — more suspects, more documents, more of the slow work of journalism. Fincher compresses this efficiently but some of the pleasure of following Blomkvist through the archive is lost.`
      },
      {
        heading: "The Swedish vs the American version",
        text: `There is also Niels Arden Oplev's 2009 Swedish film with Noomi Rapace as Lisbeth, which many readers prefer. Rapace's Lisbeth is physically more threatening; Mara's is more psychologically precise. Fincher's film is more polished. Both are worth seeing. Neither is the novel.`
      }
    ],
    readFirst: `Yes — read first to inhabit Lisbeth's full interior world before Fincher necessarily narrows her to what can be conveyed on screen. The novel also has a second half that Fincher's film compresses significantly — the corporate thriller that follows the murder mystery resolution is richer in the book.`,
    verdictBox: `Fincher made a brilliant thriller. Larsson wrote a brilliant thriller that is also a character study, a social document, and a portrait of a woman who refuses to be reduced. Read the novel. See the film. Prefer Rooney Mara's eyes and Larsson's pages in equal measure, for different reasons.`,
    related: [
      { href: '/gone-girl.html', label: 'Gone Girl' },
      { href: '/talented-mr-ripley.html', label: 'The Talented Mr. Ripley' },
      { href: '/silence-of-the-lambs.html', label: 'The Silence of the Lambs' }
    ]
  },

  {
    slug: 'da-vinci-code',
    title: 'The Da Vinci Code',
    genre: 'Thriller / Mystery',
    author: 'Dan Brown',
    bookYear: '2003',
    director: 'Ron Howard',
    filmYear: '2006',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/XXXXXXX',
    image: 'da-vinci-code.jpg',
    youtubeId: 'XXXXXXXXXXX',
    trailerNote: 'Starring Tom Hanks, Audrey Tautou, Ian McKellen &mdash; Film: 2006',
    metaTitle: 'The Da Vinci Code: Book vs Movie — Dan Brown vs Ron Howard',
    metaDesc: "Dan Brown's global thriller vs Ron Howard's 2006 film — Robert Langdon, the Grail mystery, and why the page-turner loses its turn on screen.",
    subtitle: 'Book (2003) vs. Movie (2006) &mdash; dir. Ron Howard',
    storyBrief: `Harvard symbologist Robert Langdon is called to the Louvre after a curator is found murdered in the gallery, his body arranged in a cryptic pose. The investigation draws Langdon into a conspiracy involving the Holy Grail, the Catholic Church, and secrets hidden inside Leonardo da Vinci's paintings. Dan Brown's novel sold over eighty million copies and became one of the best-selling books in history. Ron Howard's film adaptation, with Tom Hanks as Langdon, grossed over seven hundred million dollars and satisfied almost no one who had read the book.`,
    differences: [
      {
        heading: "The puzzle-solving experience",
        text: `Brown's novel works as a puzzle — each chapter ends on a cliffhanger, each revelation opens a new mystery, and the reader is positioned alongside Langdon working through the codes. This experience of active engagement is significantly reduced on screen, where puzzles are solved before the audience has time to attempt them.`
      },
      {
        heading: "Tom Hanks as Langdon",
        text: `Tom Hanks is one of cinema's most likeable actors, which is the wrong quality for Langdon. Brown's Langdon is a specific type — academically confident, physically capable, slightly self-amused — and Hanks makes him warmer and less precisely drawn. The casting is understandable commercially and slightly wrong aesthetically.`
      },
      {
        heading: "The exposition problem",
        text: `Brown's novel deploys historical and religious exposition through dialogue and interior monologue in a way that feels like revelation. The film has to show characters explaining things to each other, which is more awkward. Ron Howard uses visual flashbacks to illustrate the explanations, which helps but cannot fully solve the problem.`
      },
      {
        heading: "Pacing",
        text: `The novel is two-and-a-half hours long as a reading experience but feels like ninety minutes because of Brown's relentless chapter structure. Howard's film is two-and-a-half hours long as a viewing experience and feels longer, because the screen imposes time more literally than the page.`
      },
      {
        heading: "Ian McKellen",
        text: `As Sir Leigh Teabing, McKellen is the film's great pleasure — theatrical, enthusiastic, enjoying himself enormously. He's the one casting decision that improves on the reader's imagination.`
      }
    ],
    readFirst: `Yes — the novel is the original page-turning experience, and that experience is genuinely difficult to replicate on screen. Read it and the film becomes a guided tour of locations you've already visited. The reverse is less satisfying.`,
    verdictBox: `Brown wrote the perfect thriller mechanism — impossible to put down, impossible to defend literarily, and entirely effective at what it does. Howard made a handsome, competent film that loses the mechanism. Read the book for the experience. See the film if you want to see the locations. They are different pleasures.`,
    related: [
      { href: '/girl-with-the-dragon-tattoo.html', label: 'The Girl with the Dragon Tattoo' },
      { href: '/the-firm.html', label: 'The Firm' },
      { href: '/gone-girl.html', label: 'Gone Girl' }
    ]
  },

  {
    slug: 'american-psycho',
    title: 'American Psycho',
    genre: 'Psychological Thriller / Satire',
    author: 'Bret Easton Ellis',
    bookYear: '1991',
    director: 'Mary Harron',
    filmYear: '2000',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/XXXXXXX',
    image: 'american-psycho.jpg',
    youtubeId: 'XXXXXXXXXXX',
    trailerNote: 'Starring Christian Bale &mdash; Film: 2000',
    metaTitle: 'American Psycho: Book vs Movie — Bret Easton Ellis vs Mary Harron',
    metaDesc: "Bret Easton Ellis's controversial 1991 novel vs Mary Harron's 2000 film — Patrick Bateman, Wall Street satire, and what the book does that no film can replicate.",
    subtitle: 'Book (1991) vs. Movie (2000) &mdash; dir. Mary Harron',
    storyBrief: `Patrick Bateman is a wealthy Manhattan investment banker in the late 1980s. He is also, possibly, a serial killer. Bret Easton Ellis's novel is a sustained, excoriating satire of American consumer culture — the violence is real or imagined, but the emptiness is not in question. Mary Harron's film, with Christian Bale in one of his defining performances, makes the satire more accessible and considerably less disturbing. The controversy that greeted the novel on publication has given way to something like canonical status.`,
    differences: [
      {
        heading: "The unreliable narrator",
        text: `Ellis's Bateman narrates his own murders with the same flat, detailed prose he uses to describe business cards and designer suits. The reader is never certain whether the murders are real or fantasy, and the uncertainty is the novel's central formal gambit. Harron's film resolves this ambiguity somewhat — the murders feel real, the unreliability is present but secondary.`
      },
      {
        heading: "The consumer catalogue",
        text: `Ellis devotes pages to the precise description of restaurants, clothing, grooming products, and business cards — with a precision that is itself an argument about what Bateman values and what his world values. These passages are difficult to render on screen without stopping the film dead, so Harron compresses them into montage and costume.`
      },
      {
        heading: "Christian Bale",
        text: `Bale's performance is one of cinema's great pieces of controlled physical comedy — the business card scene, the morning routine, the Phil Collins monologue. He found the absurdity inside the horror and played it with total commitment. This is an area where the film has something the novel cannot.`
      },
      {
        heading: "The violence",
        text: `The novel's violence is graphic in ways the film is not — Ellis uses extended, precise descriptions of torture and murder that are deliberately nauseating. Harron understood that showing everything would overwhelm the satire. Her restraint is artistically correct and means the film is more watchable but less challenging.`
      },
      {
        heading: "The satirical target",
        text: `Both versions satirise the emptiness of 1980s Wall Street culture with precision. The novel's satire is more sustained and more nihilistic — there is no redemptive reading of what Bateman represents. The film is slightly warmer, which is partly Bale and partly Harron's direction.`
      }
    ],
    readFirst: `Yes — the novel is the original experience and the film is a brilliant compression of it. Read Ellis first to encounter the unreliability in full, then watch Bale do something entirely his own with the material.`,
    verdictBox: `Ellis wrote a work that is still controversial and still formally radical. Harron made one of the sharpest satires in American cinema. The novel is more ambitious and more disturbing. The film has Bale, which is its own complete argument. Read the book. Watch the film. Both are essential.`,
    related: [
      { href: '/gone-girl.html', label: 'Gone Girl' },
      { href: '/la-confidential.html', label: 'LA Confidential' },
      { href: '/talented-mr-ripley.html', label: 'The Talented Mr. Ripley' }
    ]
  },

  {
    slug: 'la-confidential',
    title: 'LA Confidential',
    genre: 'Crime / Noir',
    author: 'James Ellroy',
    bookYear: '1990',
    director: 'Curtis Hanson',
    filmYear: '1997',
    verdict: 'tie',
    verdictText: 'Too Close to Call',
    affiliateLink: 'https://amzn.to/XXXXXXX',
    image: 'la-confidential.jpg',
    youtubeId: 'XXXXXXXXXXX',
    trailerNote: 'Starring Kevin Spacey, Russell Crowe, Guy Pearce, Kim Basinger &mdash; Film: 1997',
    metaTitle: 'LA Confidential: Book vs Movie — James Ellroy vs Curtis Hanson',
    metaDesc: "James Ellroy's sprawling crime novel vs Curtis Hanson's 1997 film — 1950s Los Angeles, three detectives, and one of the most debated book-to-film comparisons in crime fiction.",
    subtitle: 'Book (1990) vs. Movie (1997) &mdash; dir. Curtis Hanson',
    storyBrief: `Three Los Angeles detectives in the early 1950s — the straight-arrow Ed Exley, the brutal Bud White, and the celebrity-fixated Jack Vincennes — become entangled in a conspiracy that runs from a Nite Owl coffee shop massacre through the LAPD's own corruption to the upper reaches of Hollywood and organised crime. James Ellroy's novel is six hundred pages of dense, compressed, telegraphic prose — one of the great American crime novels. Curtis Hanson's film won two Academy Awards and is one of the finest crime films of the 1990s. This is a genuine standoff.`,
    differences: [
      {
        heading: "Ellroy's prose style",
        text: `Ellroy writes in a clipped, staccato style that strips out connective tissue and drops the reader directly into sensation and action. The novel is dense and demands concentration. Hanson's film translates this density into visual compression — many scenes, rapid cuts, maximum information. Both approaches achieve the same effect through different means.`
      },
      {
        heading: "The novel's scope",
        text: `Ellroy's novel is considerably longer and wider than the film. Several significant subplots — including a substantial thread involving a character called Dudley Smith's relationship with the Mexican mob — are condensed or removed. The film makes these cuts intelligently but the novel's world is larger.`
      },
      {
        heading: "The three detectives",
        text: `Ellroy gives all three protagonists roughly equal weight and interiority. Hanson's film slightly favours Exley (Guy Pearce) and White (Russell Crowe), making Vincennes (Kevin Spacey) more peripheral. All three performances are exceptional.`
      },
      {
        heading: "Kim Basinger",
        text: `Basinger won the Academy Award for Best Supporting Actress as Lynn Bracken, the Veronica Lake lookalike. Her performance gives the film a romantic and melancholy centre that the novel, more interested in its male detectives, doesn't quite have. This is one of the rare instances where the film adds something the source lacks.`
      },
      {
        heading: "The resolution",
        text: `Both versions arrive at the same destination — the conspiracy revealed, the corrupted institution partially reformed, the surviving detective carrying the weight of what he's done. The film's resolution is somewhat cleaner. The novel's is more morally complicated.`
      }
    ],
    readFirst: `Either order works genuinely well. The film is so accomplished that watching first is a legitimate choice — you'll then read the novel with the three detectives fully realised in your imagination. Reading first gives you the full scope of Ellroy's world before Hanson necessarily narrows it.`,
    verdictBox: `Ellroy wrote one of the great American crime novels and Hanson made one of the great American crime films. They are different achievements at different scales. The novel is more ambitious. The film is more perfectly constructed. Read both. This is one of the very few genuine ties.`,
    related: [
      { href: '/american-psycho.html', label: 'American Psycho' },
      { href: '/no-country-for-old-men.html', label: 'No Country for Old Men' },
      { href: '/silence-of-the-lambs.html', label: 'The Silence of the Lambs' }
    ]
  },

  {
    slug: 'on-the-road',
    title: 'On the Road',
    genre: 'Literary Fiction / Beat Generation',
    author: 'Jack Kerouac',
    bookYear: '1957',
    director: 'Walter Salles',
    filmYear: '2012',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/XXXXXXX',
    image: 'on-the-road.jpg',
    youtubeId: 'XXXXXXXXXXX',
    trailerNote: 'Starring Sam Riley, Garrett Hedlund, Kristen Stewart &mdash; Film: 2012',
    metaTitle: 'On the Road: Book vs Movie — Kerouac vs Walter Salles',
    metaDesc: "Jack Kerouac's Beat Generation classic vs Walter Salles's 2012 film — Sal Paradise, Dean Moriarty, and why the novel's energy refuses to be filmed.",
    subtitle: 'Book (1957) vs. Movie (2012) &mdash; dir. Walter Salles',
    storyBrief: `Sal Paradise — Kerouac's alter ego — narrates a series of cross-country journeys in the late 1940s with Dean Moriarty, a charismatic, restless, unreliable ex-con based on Neal Cassady. The novel is a portrait of a generation's hunger for speed, freedom, jazz, and experience — written in a style that Kerouac described as "spontaneous prose," dictated onto a continuous scroll of paper in three weeks. Walter Salles spent years developing a film adaptation that Francis Ford Coppola produced. It is a handsome, sympathetic film about a novel whose energy cannot be filmed.`,
    differences: [
      {
        heading: "The prose as the subject",
        text: `On the Road is not really about what happens — it is about how Kerouac describes what happens. The rushing, associative, jazz-influenced prose is the experience. Salles's film necessarily substitutes images for prose, which is the correct formal choice for cinema and a fundamental loss. The sentences are the road.`
      },
      {
        heading: "Dean Moriarty",
        text: `Garrett Hedlund plays Dean as beautiful and feral and magnetic. Kerouac's Dean is all of those things and also more exhausting, more exploitative, and more genuinely frightening in his appetites. The film softens Dean's selfishness into romantic excess. The novel shows you, gradually, how much damage Dean leaves behind.`
      },
      {
        heading: "Sal's narration",
        text: `Sam Riley's Sal is the film's quiet centre, observer and participant. The film loses the specific quality of Sal's voice — the breathless enthusiasm, the self-implication, the simultaneous love and critical distance that characterises Kerouac's self-portrait.`
      },
      {
        heading: "Kristen Stewart",
        text: `Stewart plays Marylou — Dean's young wife, one of several women discarded by the novel's male protagonists — and she is the film's most interesting performance. She brings a quality of knowingness to a character the novel treats somewhat less carefully.`
      },
      {
        heading: "The historical moment",
        text: `The novel captures a specific post-war American energy — the felt possibility of the open road, the reaction against domesticity and conformity, the discovery of jazz and Black American culture by white Beats. The film recreates the period beautifully but cannot regenerate the feeling of that specific historical moment arriving for the first time.`
      }
    ],
    readFirst: `Yes — read the novel first, or instead. The film is a beautiful production of an unfilmable book. If you've read it, the film gives you images for the road. If you haven't, the film will give you the story but not the experience that made the novel matter.`,
    verdictBox: `Kerouac wrote a novel whose energy is inseparable from its prose — the road is in the sentences. Salles made a respectful, beautiful film of events that the sentences describe. The novel is irreplaceable. The film is the best possible argument that it cannot be replaced.`,
    related: [
      { href: '/wild.html', label: 'Wild' },
      { href: '/into-the-wild.html', label: 'Into the Wild' },
      { href: '/american-psycho.html', label: 'American Psycho' }
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
  console.log('\nBefore running, fill in:');
  console.log('  - affiliateLink (replace https://amzn.to/XXXXXXX)');
  console.log('  - youtubeId (replace XXXXXXXXXXX)');
  console.log('\nNext steps:');
  console.log('  1. node script_qa.js');
  console.log('  2. move *.html .. (Windows) / mv *.html .. (Mac)');
  console.log('  3. node script_update_sitemap.js');
  console.log('  4. node script_update_index.js');
  console.log('  5. git add . && git commit -m "Add 5 pages" && git push');
}

main();
