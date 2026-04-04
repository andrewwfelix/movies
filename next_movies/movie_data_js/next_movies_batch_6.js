#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Page Generator (Batch 6)
 * Titles 11–15 of the 25 new titles:
 *   1. Ready Player One
 *   2. Me Before You
 *   3. The Notebook
 *   4. It Ends With Us
 *   5. Pride and Prejudice
 *
 * Usage:
 *   node next_movies_batch_6.js
 *
 * Run from /next_movies/ subfolder.
 * Outputs HTML files to current directory.
 * Then: QA, move to root, run sitemap + index scripts.
 */

const fs = require('fs');
const path = require('path');

const PAGES = [
  {
    slug: 'ready-player-one',
    title: 'Ready Player One',
    genre: 'Science Fiction / Adventure',
    author: 'Ernest Cline',
    bookYear: '2011',
    director: 'Steven Spielberg',
    filmYear: '2018',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4tsDsJw',
    image: 'ready-player-one.jpg',
    youtubeId: 'cSp1dM2Vj48',
    trailerNote: 'Starring Tye Sheridan, Olivia Cooke &mdash; Film: 2018',
    metaTitle: 'Ready Player One: Book vs Movie — Ernest Cline vs Spielberg',
    metaDesc: "Ernest Cline's 2011 novel vs Spielberg's 2018 film — the OASIS, the pop culture puzzle hunt, and why the book and film make very different bets.",
    subtitle: 'Book (2011) vs. Movie (2018) &mdash; dir. Steven Spielberg',
    storyBrief: `In 2045, most of humanity escapes a degraded real world into the OASIS — a vast virtual reality universe created by the eccentric James Halliday. When Halliday dies, he leaves behind an elaborate treasure hunt inside the OASIS, with his entire fortune and control of the platform as the prize. Wade Watts, a poor teenager from the stacks of Oklahoma City, is one of the millions competing. Ernest Cline's novel is a love letter to 1980s pop culture and video game history. Steven Spielberg's film is a technical marvel that fundamentally rethinks what story it's telling.`,
    differences: [
      {
        heading: 'The pop culture puzzle',
        text: `Cline's novel is built around deep knowledge of 1980s games, films, and music — the puzzles require genuine expertise in Halliday's obsessions. Spielberg, himself a figure of the 1980s, largely replaced Cline's specific references with a broader range of IP he could license and film. The novel's puzzles reward readers who share Cline's encyclopaedic knowledge; the film's set pieces reward anyone who has seen movies.`
      },
      {
        heading: "Spielberg's self-reference problem",
        text: `The film includes a sequence set inside Stanley Kubrick's The Shining — a brilliant piece of cinematic invention that has no equivalent in the novel. It also means Spielberg is making a film that references Spielberg films, which creates an odd hall-of-mirrors quality that the novel, focused on the 1980s generally, avoids.`
      },
      {
        heading: 'Wade and Art3mis',
        text: `The novel gives considerably more space to the development of Wade and Art3mis's relationship — their online dynamic, the complications of virtual intimacy, the gap between avatar and person. The film condenses this into a more conventional romance arc. Olivia Cooke's Art3mis is strong but underwritten relative to the novel.`
      },
      {
        heading: 'The real world',
        text: `Cline's novel spends real time in the physical world — the stacks, the trailer parks, the corporate headquarters of IOI. The film's real world is a sketch, which is probably the right call cinematically but removes the novel's argument about why anyone would prefer the OASIS to reality.`
      },
      {
        heading: 'The IOI villainy',
        text: `Ben Mendelsohn's Sorrento is the film's antagonist and he's an effective corporate villain. The novel's IOI is more elaborately sinister — Cline gives them more resources, more reach, and a more fully realised menace. The film simplifies the threat to make the climax more manageable.`
      }
    ],
    readFirst: `Yes — the novel's specific pop culture architecture is its most distinctive quality, and Spielberg's film replaces much of it. Read first to understand what Cline built, then watch Spielberg build something different from the same foundation.`,
    verdictBox: `Cline wrote a maximalist geek fantasy with an internal logic that rewards its target audience completely. Spielberg made a technically astonishing film that is less interested in Cline's specific obsessions and more interested in spectacle. The novel is more itself. The film is more a Spielberg film than a Cline adaptation. Both are entertaining. The book is better.`,
    related: [
      { href: '/jurassic-park.html', label: 'Jurassic Park' },
      { href: '/dark-matter.html', label: 'Dark Matter' },
      { href: '/dune.html', label: 'Dune' }
    ]
  },

  {
    slug: 'me-before-you',
    title: 'Me Before You',
    genre: 'Romance / Drama',
    author: 'Jojo Moyes',
    bookYear: '2012',
    director: 'Thea Sharrock',
    filmYear: '2016',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4sRz32D',
    image: 'me-before-you.jpg',
    youtubeId: 'T0MmkG_nG1U',
    trailerNote: 'Starring Emilia Clarke, Sam Claflin &mdash; Film: 2016',
    metaTitle: 'Me Before You: Book vs Movie — Jojo Moyes vs Thea Sharrock',
    metaDesc: "Jojo Moyes's 2012 novel vs Thea Sharrock's 2016 film — Louisa and Will, the assisted dying debate, and why the book earns its ending.",
    subtitle: 'Book (2012) vs. Movie (2016) &mdash; dir. Thea Sharrock',
    storyBrief: `Louisa Clark, cheerful and directionless, takes a job as carer for Will Traynor — a wealthy, paralysed former banker who is witty, acerbic, and determined to die on his own terms. The novel traces the six months they spend together and the love that develops, with full knowledge of how it must end. Jojo Moyes adapted her own novel for the screen. Thea Sharrock's film is warm, well-cast, and somewhat shallower than the book — which is to say it is a very good romantic drama made from a better romantic novel.`,
    differences: [
      {
        heading: "Will's interiority",
        text: `The novel alternates perspectives, giving the reader access to Will's experience of his paralysis, his grief for the life he had, and his feelings for Louisa. This access is what earns the novel's ending — you understand Will's choice from inside it. Sam Claflin's performance is excellent but the film necessarily shows Will's interiority through behaviour rather than narration.`
      },
      {
        heading: "The assisted dying debate",
        text: `Moyes's novel handles the ethics of assisted dying with more directness than the film. The novel presents Will's position with genuine seriousness — not as a tragedy to be prevented but as a considered choice by someone with full information. The film softens this slightly, making the ending feel more like a romance's sad conclusion than a principled argument.`
      },
      {
        heading: 'Emilia Clarke',
        text: `Clarke's Louisa is the film's great strength — she is funny, warm, and genuinely affecting, with a physical expressiveness that captures Louisa's particular quality of life-force. The novel's Louisa is slightly less performatively upbeat and slightly more interior. Clarke is the best possible casting.`
      },
      {
        heading: "Louisa's family",
        text: `The novel gives Louisa's family — particularly her mother and her boyfriend Patrick — more space and specificity. They constitute the world Louisa is trying to escape and their ordinariness is part of the point. The film uses them more efficiently and somewhat less affectionately.`
      },
      {
        heading: 'The ending',
        text: `Both versions reach the same destination. The film's ending is slightly more consolatory — the letter, the Paris café, the sense that Louisa will be fine. The novel earns the same consolation but at more cost, because you have spent more time inside the grief.`
      }
    ],
    readFirst: `Yes — the novel earns its ending through the slow accumulation of Will's interiority and the full weight of Louisa's grief. The film is genuinely moving but the novel is more so. Read first and the film becomes a companion. Watch first and you'll have the plot without the full experience.`,
    verdictBox: `Moyes wrote a novel that handles difficult material with more sophistication than its genre packaging suggests. Sharrock made a very good film of a better book. Clarke is worth watching. The novel is worth reading. The book carries more weight.`,
    related: [
      { href: '/the-notebook.html', label: 'The Notebook' },
      { href: '/it-ends-with-us.html', label: 'It Ends With Us' },
      { href: '/normal-people.html', label: 'Normal People' }
    ]
  },

  {
    slug: 'the-notebook',
    title: 'The Notebook',
    genre: 'Romance / Drama',
    author: 'Nicholas Sparks',
    bookYear: '1996',
    director: 'Nick Cassavetes',
    filmYear: '2004',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/47D95HU',
    image: 'the-notebook.jpg',
    youtubeId: 'BjJcYdEOI0k',
    trailerNote: 'Starring Ryan Gosling, Rachel McAdams &mdash; Film: 2004',
    metaTitle: 'The Notebook: Book vs Movie — Nicholas Sparks vs Nick Cassavetes',
    metaDesc: "Nicholas Sparks's 1996 novel vs Nick Cassavetes's 2004 film — Noah and Allie, Ryan Gosling and Rachel McAdams, and a rare case where the film rivals the source.",
    subtitle: 'Book (1996) vs. Movie (2004) &mdash; dir. Nick Cassavetes',
    storyBrief: `An old man reads to an elderly woman with dementia from a notebook — the story of Noah Calhoun and Allie Nelson, who fell in love one summer in 1940s North Carolina, were separated by class and circumstance, and found each other again years later. Nicholas Sparks's debut novel is a deliberate, unapologetic love story. Nick Cassavetes's film, with Ryan Gosling and Rachel McAdams, became one of the defining romantic films of the 2000s and made both its stars. This is a rare case where the film has become more culturally present than the book.`,
    differences: [
      {
        heading: 'Ryan Gosling and Rachel McAdams',
        text: `The film's central fact is the chemistry between its leads — a chemistry that extended off-screen during production and became part of the film's mythology. The novel's Noah and Allie are fully realised on the page; Gosling and McAdams make them iconic. This is one of the cases where casting transforms source material rather than simply illustrating it.`
      },
      {
        heading: "Noah's interiority",
        text: `Sparks writes Noah with more introspective weight than the film provides — his grief, his obsession, his understanding of what he has lost and why he cannot let it go. The film's Noah is active and romantic. The novel's Noah is also contemplative and somewhat haunted.`
      },
      {
        heading: 'The framing device',
        text: `Both versions use the older Noah reading to Allie as a framing device. The novel handles this somewhat more quietly — the older Noah is more plainly exhausted, the act of reading more plainly an act of faith. The film's framing is more dramatically constructed, leading to a climax that the novel earns differently.`
      },
      {
        heading: "Allie's perspective",
        text: `The film gives Allie more agency than the novel — her choice between Lon and Noah is dramatised with more equal weight. The novel is more firmly Noah's story, narrated from closer to his perspective.`
      },
      {
        heading: 'Period atmosphere',
        text: `Cassavetes recreates 1940s North Carolina with evident care and beauty — the light, the houses, the summer heat. The film's visual world is one of its genuine pleasures and matches the nostalgic register of Sparks's prose.`
      }
    ],
    readFirst: `Either order works — this is one of the few cases where the film is culturally definitive enough that most readers will have seen it first. If you've seen the film, read the novel for Noah's fuller interiority and Sparks's more sustained melancholy. If you haven't seen either, read first.`,
    verdictBox: `Sparks wrote a clean, deliberate love story with more weight than its detractors allow. Cassavetes made a film that transcended its source through sheer chemistry. The novel is better-written. The film is more beloved. Both are worth your time. The book is the better version of the same story.`,
    related: [
      { href: '/me-before-you.html', label: 'Me Before You' },
      { href: '/it-ends-with-us.html', label: 'It Ends With Us' },
      { href: '/people-we-meet-on-vacation.html', label: 'People We Meet on Vacation' }
    ]
  },

  {
    slug: 'it-ends-with-us',
    title: 'It Ends With Us',
    genre: 'Romance / Drama',
    author: 'Colleen Hoover',
    bookYear: '2016',
    director: 'Justin Baldoni',
    filmYear: '2024',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4mk8AIH',
    image: 'it-ends-with-us.jpg',
    youtubeId: 'DLET_u31M4M',
    trailerNote: 'Starring Blake Lively, Justin Baldoni, Brandon Sklenar &mdash; Film: 2024',
    metaTitle: 'It Ends With Us: Book vs Movie — Colleen Hoover vs Justin Baldoni',
    metaDesc: "Colleen Hoover's 2016 novel vs Justin Baldoni's 2024 film — Lily Bloom, domestic abuse, and why the book's emotional precision is hard to film.",
    subtitle: 'Book (2016) vs. Movie (2024) &mdash; dir. Justin Baldoni',
    storyBrief: `Lily Bloom moves to Boston, starts a flower shop, and falls for Ryle Kincaid — a neurosurgeon who is intense, charming, and eventually abusive. A first love, Atlas Corrigan, re-enters her life. Colleen Hoover's novel is a romance that becomes something more serious — a frank examination of domestic abuse cycles and the difficulty of leaving. The 2024 film, directed by Justin Baldoni and starring Blake Lively, grossed over three hundred and fifty million dollars worldwide and arrived amid significant off-screen controversy between its director and star. The novel remains the cleaner experience.`,
    differences: [
      {
        heading: "Lily's interiority",
        text: `Hoover writes Lily's experience of the abuse with specificity and psychological honesty — the rationalisation, the love that coexists with the fear, the particular way each incident is explained away. This interior process is the novel's most important material and it is difficult to externalise on screen. The film shows the incidents; the novel shows the thinking that surrounds them.`
      },
      {
        heading: 'The off-screen controversy',
        text: `The film's production and release were overshadowed by publicised conflict between Blake Lively and Justin Baldoni, which made it impossible to watch the finished film without awareness of the friction behind it. The novel exists outside this context. Whether the controversy is relevant to the film's meaning is a matter of genuine debate.`
      },
      {
        heading: 'Blake Lively as Lily',
        text: `Lively commits fully to the role but her star quality — her physical confidence, her innate glamour — works slightly against the novel's Lily, who is more ordinary and more visibly uncertain. The film's Lily is more immediately sympathetic; the novel's is more complicated.`
      },
      {
        heading: 'Ryle Kincaid',
        text: `Justin Baldoni plays Ryle — the abusive partner — in his own film, which creates an obvious tension. The novel's Ryle is rendered through Lily's perception, which means his appeal is established before his violence. The film makes his appeal and his menace somewhat harder to balance.`
      },
      {
        heading: 'The journal sections',
        text: `Hoover uses Lily's teenage journal entries — letters to Ellen DeGeneres — to establish her backstory and her relationship with Atlas. These sections provide context the film must deliver through other means. The film handles this efficiently but loses the specific voice of the teenage Lily.`
      }
    ],
    readFirst: `Yes — the novel's interior handling of the abuse cycle is its most important quality and the film cannot fully replicate it. Read first to understand what Hoover is doing, then see the film as a separate interpretation of the same material.`,
    verdictBox: `Hoover wrote a novel that takes domestic abuse seriously inside a romance structure and does so with genuine skill. Baldoni made a film that arrived in difficult circumstances and is a lesser version of that novel. The book is the original. The film is an adaptation that serves the story less well than the source. Read the novel.`,
    related: [
      { href: '/verity.html', label: 'Verity' },
      { href: '/reminders-of-him.html', label: 'Reminders of Him' },
      { href: '/me-before-you.html', label: 'Me Before You' }
    ]
  },

  {
    slug: 'pride-and-prejudice',
    title: 'Pride and Prejudice',
    genre: 'Literary Fiction / Classic Romance',
    author: 'Jane Austen',
    bookYear: '1813',
    director: 'Joe Wright',
    filmYear: '2005',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4tka4oG',
    image: 'pride-and-prejudice.jpg',
    youtubeId: '4bSKM9WWT08',
    trailerNote: 'Starring Keira Knightley, Matthew Macfadyen &mdash; Film: 2005',
    metaTitle: 'Pride and Prejudice: Book vs Movie — Jane Austen vs Joe Wright',
    metaDesc: "Jane Austen's 1813 novel vs Joe Wright's 2005 film — Elizabeth Bennet, Mr Darcy, and why Austen's wit cannot be fully filmed.",
    subtitle: 'Book (1813) vs. Movie (2005) &mdash; dir. Joe Wright',
    storyBrief: `Elizabeth Bennet is the second of five daughters in a genteel but financially precarious English family. When the wealthy Mr Darcy arrives in the neighbourhood, their mutual antagonism gradually becomes something else entirely. Jane Austen's novel, published in 1813, is one of the most beloved works in the English language — sharp, funny, and formally precise. Joe Wright's 2005 film, with Keira Knightley and Matthew Macfadyen, is one of the finest screen adaptations in recent memory. It is still not the novel.`,
    differences: [
      {
        heading: "Austen's irony",
        text: `The novel's opening sentence — it is a truth universally acknowledged that a single man in possession of a good fortune must be in want of a wife — establishes the ironic register that Austen sustains for the entire book. This irony is directed simultaneously at the marriage market, at the women who participate in it, and at the men who benefit from it. Film cannot render sustained free indirect irony; it can suggest it through performance and direction, which Wright does skilfully but incompletely.`
      },
      {
        heading: "Elizabeth's wit",
        text: `Keira Knightley plays Elizabeth with intelligence and energy — her sparring with Darcy is the film's great pleasure. The novel's Elizabeth is funnier and more precisely observant. Her interior commentary on the social world around her is the novel's finest quality and it belongs entirely to the page.`
      },
      {
        heading: "Matthew Macfadyen's Darcy",
        text: `Macfadyen's Darcy is romantic and wounded — his pride rendered as shyness rather than contempt. This is a legitimate interpretation that makes Darcy immediately sympathetic. Austen's Darcy is more genuinely difficult — his first proposal is an act of condescension as much as declaration — and the film softens this. Both interpretations are defensible.`
      },
      {
        heading: "Joe Wright's cinematography",
        text: `Seamus McGarvey shoots the English countryside and country houses with extraordinary beauty — dawn light over Pemberley, the Bennet house in the blue hour before morning. The film's visual world is a genuine artistic achievement that adds something the novel cannot have: the specific physical beauty of the world Austen described.`
      },
      {
        heading: "The Bennet family",
        text: `The film compresses the Bennet family's dynamics significantly. Jane, Lydia, and Mrs Bennet are vivid in Wright's film but less fully characterised than in the novel. The novel's Mrs Bennet is funnier and more pathetic and more sympathetically drawn than the film's version, which tends toward caricature.`
      }
    ],
    readFirst: `Yes — Austen's prose is the experience. The novel's irony, Elizabeth's interiority, and the specific quality of Austen's observation of social behaviour are what make it one of the great works in English literature. Read first and the film becomes a beautiful companion. The 2005 Wright film is among the very best adaptations; it is still considerably less than the novel.`,
    verdictBox: `Austen wrote one of the great English novels and Wright made one of the great English literary films. The novel's wit and formal precision are irreplaceable. The film's beauty and performances are genuine achievements. Read the novel — all of it, at least twice. See the film for Macfadyen's Darcy walking across the morning field. Both are essential. The book is the thing.`,
    related: [
      { href: '/jane-eyre.html', label: 'Jane Eyre' },
      { href: '/sense-and-sensibility.html', label: 'Sense and Sensibility' },
      { href: '/atonement.html', label: 'Atonement' }
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
