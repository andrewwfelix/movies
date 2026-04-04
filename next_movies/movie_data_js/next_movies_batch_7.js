#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Page Generator (Batch 7)
 * Titles 16–20 of the 25 new titles:
 *   1. Jane Eyre
 *   2. Sense and Sensibility
 *   3. Rebecca
 *   4. Eat Pray Love
 *   5. Outlander
 *
 * Usage:
 *   node next_movies_batch_7.js
 *
 * Run from /next_movies/ subfolder.
 * Outputs HTML files to current directory.
 * Then: QA, move to root, run sitemap + index scripts.
 */

const fs = require('fs');
const path = require('path');

const PAGES = [
  {
    slug: 'jane-eyre',
    title: 'Jane Eyre',
    genre: 'Gothic Romance / Classic',
    author: 'Charlotte Brontë',
    bookYear: '1847',
    director: 'Cary Joji Fukunaga',
    filmYear: '2011',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/41ecrxf',
    image: 'jane-eyre.jpg',
    youtubeId: '8IFsdfk3mlk',
    trailerNote: 'Starring Mia Wasikowska, Michael Fassbender &mdash; Film: 2011',
    metaTitle: 'Jane Eyre: Book vs Movie — Charlotte Brontë vs Cary Joji Fukunaga',
    metaDesc: "Charlotte Brontë's 1847 novel vs Cary Joji Fukunaga's 2011 film — Jane's voice, Rochester's darkness, and why the novel's interiority is irreplaceable.",
    subtitle: 'Book (1847) vs. Movie (2011) &mdash; dir. Cary Joji Fukunaga',
    storyBrief: `Jane Eyre is an orphan who survives a brutal charity school to become governess at Thornfield Hall, where she falls in love with the brooding, morally complicated Edward Rochester. Charlotte Brontë's 1847 novel is narrated in Jane's first person — direct, passionate, and morally certain in a way that was radical for its time. Cary Joji Fukunaga's 2011 film, with Mia Wasikowska and Michael Fassbender, is the finest screen adaptation of the novel yet made. It is still a reduction of a work that lives in its voice.`,
    differences: [
      {
        heading: "Jane's voice",
        text: `Brontë's Jane addresses the reader directly — "Reader, I married him" is the most famous instance of a sustained intimacy that runs throughout the novel. Jane's narration is the experience: her specific moral intelligence, her refusal to be patronised, her way of seeing the world with absolute clarity. Wasikowska's performance is excellent and communicates much of this through expression and bearing. She cannot communicate the sentences.`
      },
      {
        heading: "Michael Fassbender's Rochester",
        text: `Fassbender plays Rochester with a barely contained volatility that captures the character's essential quality — the darkness that Jane sees and loves in full knowledge of what it is. This is one of the great casting decisions in literary adaptation. The novel's Rochester is rendered entirely through Jane's perception, which gives him a complexity the film slightly simplifies by showing him directly.`
      },
      {
        heading: "Fukunaga's visual language",
        text: `The film opens in medias res — Jane fleeing across the moors — before moving back to tell the story. Fukunaga's cinematography gives Thornfield Hall a Gothic weight that matches the novel's atmosphere. The Yorkshire landscape becomes a moral landscape in both versions, though the novel's language and the film's images achieve this through entirely different means.`
      },
      {
        heading: "The attic and Bertha Mason",
        text: `The novel gives Bertha Mason — Rochester's imprisoned first wife — more presence and more ambiguity. She is a figure of terror and also of kinship with Jane; their situations as women are not entirely different. The film handles Bertha efficiently but cannot sustain the novel's more disturbing parallels.`
      },
      {
        heading: "The novel's length",
        text: `Brontë's novel is substantial and covers Jane's full childhood — the abuse at Gateshead, the years at Lowood, the slow development of her character before Thornfield. The film compresses the early sections to reach Thornfield faster, which is cinematically necessary and means you meet Jane as a formed person rather than watching her form.`
      }
    ],
    readFirst: `Yes — Jane's voice is the novel and no film can render it. Read first and Wasikowska's performance becomes the finest possible visual gloss on what Brontë put on the page. Watch first and you'll know the story without the experience that makes the story matter.`,
    verdictBox: `Brontë wrote one of the great first-person novels in English literature — Jane's voice is its own argument, its own world. Fukunaga made the finest adaptation yet and it remains considerably less than the novel. Read Jane Eyre. See the film for Fassbender. The book is the thing.`,
    related: [
      { href: '/wuthering-heights.html', label: 'Wuthering Heights' },
      { href: '/pride-and-prejudice.html', label: 'Pride and Prejudice' },
      { href: '/rebecca.html', label: 'Rebecca' }
    ]
  },

  {
    slug: 'sense-and-sensibility',
    title: 'Sense and Sensibility',
    genre: 'Literary Fiction / Classic Romance',
    author: 'Jane Austen',
    bookYear: '1811',
    director: 'Ang Lee',
    filmYear: '1995',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4maFlrz',
    image: 'sense-and-sensibility.jpg',
    youtubeId: '2WGq2Rbs1Qg',
    trailerNote: 'Starring Emma Thompson, Kate Winslet, Hugh Grant &mdash; Film: 1995',
    metaTitle: 'Sense and Sensibility: Book vs Movie — Jane Austen vs Ang Lee',
    metaDesc: "Jane Austen's 1811 novel vs Ang Lee's 1995 film — Elinor and Marianne, Emma Thompson's screenplay, and an adaptation that honours its source.",
    subtitle: 'Book (1811) vs. Movie (1995) &mdash; dir. Ang Lee',
    storyBrief: `The Dashwood sisters — Elinor (sense) and Marianne (sensibility) — are left in reduced circumstances after their father's death and must navigate the marriage market of Regency England. Elinor conceals her feelings with painful discipline; Marianne performs hers with romantic abandon. Jane Austen's first published novel is a comedy of manners and a serious examination of the social constraints placed on women's emotional lives. Ang Lee's 1995 film, with Emma Thompson's Oscar-winning screenplay, is among the most accomplished Austen adaptations ever made. It is still the second-best version of the story.`,
    differences: [
      {
        heading: "Emma Thompson's screenplay",
        text: `Thompson spent five years adapting the novel and won the Academy Award for her screenplay. She plays Elinor herself, which gives her unusual authority over the character. The screenplay is faithful to the novel's structure and spirit while making necessary compressions. It is the best possible film of the novel — and the novel is still better.`
      },
      {
        heading: "Austen's irony",
        text: `Austen's narration maintains a precisely calibrated ironic distance from all her characters, including the sympathetic ones. Thompson's screenplay and Lee's direction are warmer — they love Elinor and Marianne more openly than Austen does. This warmth is one of the film's great pleasures and a slight departure from the source's cooler intelligence.`
      },
      {
        heading: "Elinor's repression",
        text: `Austen writes Elinor's emotional discipline from inside it — you understand the cost of her self-control because you have access to what she is controlling. Thompson performs this through body language and small muscular suppressions. Both are effective. The novel's version is more total.`
      },
      {
        heading: "Kate Winslet's Marianne",
        text: `Winslet was twenty years old and already fully formed as a performer — her Marianne is passionate, naive, and genuinely moving in her disillusionment. The novel's Marianne is slightly more affected, more performatively romantic, which makes her eventual change more complex. Both are wonderful.`
      },
      {
        heading: "Colonel Brandon",
        text: `Alan Rickman plays Colonel Brandon with a melancholy gravity that gives the character more romantic weight than the novel provides. Austen's Brandon is somewhat less glamorously sad — he is a good man, but the novel is slightly ambivalent about whether he is the right man. Rickman makes the question redundant.`
      }
    ],
    readFirst: `Yes — though this is one of the cases where seeing the film first is less of a loss than usual. Thompson's adaptation is so faithful and so good that it serves as a genuine gateway to the novel rather than a replacement for it. Read the novel for Austen's irony. See the film for Thompson and Winslet.`,
    verdictBox: `Austen wrote a novel of exquisite formal intelligence. Lee and Thompson made one of the great literary adaptations of the 1990s. The novel is better because Austen is better. The film is an exceptional companion. Read the book. See the film. Regard them as a pair.`,
    related: [
      { href: '/pride-and-prejudice.html', label: 'Pride and Prejudice' },
      { href: '/jane-eyre.html', label: 'Jane Eyre' },
      { href: '/remains-of-the-day.html', label: 'The Remains of the Day' }
    ]
  },

  {
    slug: 'rebecca',
    title: 'Rebecca',
    genre: 'Gothic Mystery / Romance',
    author: 'Daphne du Maurier',
    bookYear: '1938',
    director: 'Alfred Hitchcock',
    filmYear: '1940',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/489MNO0',
    image: 'rebecca.jpg',
    youtubeId: 'LFVhB54UqvQ',
    trailerNote: 'Starring Laurence Olivier, Joan Fontaine &mdash; 1940 Film &mdash; also Netflix adaptation: 2020',
    metaTitle: 'Rebecca: Book vs Movie — Daphne du Maurier vs Hitchcock',
    metaDesc: "Daphne du Maurier's 1938 novel vs Hitchcock's 1940 film — the unnamed narrator, Manderley, and a Gothic masterpiece in two forms.",
    subtitle: 'Book (1938) vs. Film (1940) &mdash; dir. Alfred Hitchcock &mdash; also Netflix (2020)',
    storyBrief: `A young, unnamed woman marries the wealthy widower Maxim de Winter and comes to live at Manderley, his grand Cornish estate. The house is haunted by the presence of Rebecca, Maxim's first wife, who died the previous year — and by Mrs Danvers, the housekeeper devoted to her memory. Daphne du Maurier's 1938 novel is one of the great Gothic mysteries, as much about female insecurity and identity as about secrets and death. Alfred Hitchcock's 1940 adaptation was his first American film and won the Academy Award for Best Picture. There is also Ben Wheatley's 2020 Netflix adaptation, which is largely unnecessary.`,
    differences: [
      {
        heading: "The narrator's namelessness",
        text: `Du Maurier's narrator is never named — she is defined entirely by her relationship to others, particularly to the memory of Rebecca. This formal choice is the novel's most radical element: the woman at the centre of the story has no name, no history, no identity that isn't borrowed or imposed. Hitchcock's Joan Fontaine communicates this anxiety through performance but the formal dimension is lost on screen.`
      },
      {
        heading: "Mrs Danvers",
        text: `Judith Anderson's Mrs Danvers is one of Hitchcock's great screen creations — spectral, devoted, frightening. Du Maurier's Mrs Danvers is rendered through the narrator's fear and awe, which makes her simultaneously more and less than what Anderson shows. Both are extraordinary. Anderson's is more immediately iconic.`
      },
      {
        heading: "Hitchcock's Hays Code constraints",
        text: `The novel's ending involves Maxim having murdered Rebecca — an act the Production Code prevented Hitchcock from presenting as the narrator accepts and forgives. Hitchcock changed Rebecca's death to an accident, which significantly alters the moral stakes of the ending and the narrator's complicity. Readers of the novel will find the film's resolution considerably cleaner than du Maurier intended.`
      },
      {
        heading: "Manderley",
        text: `The novel opens with the narrator dreaming of Manderley — "Last night I dreamt I went to Manderley again" — and the house is the novel's central character, as present and as threatening as any person in it. Hitchcock renders Manderley with appropriate grandeur but the film's house is a set; du Maurier's is a living organism.`
      },
      {
        heading: "The 2020 Netflix version",
        text: `Ben Wheatley's Netflix adaptation, with Lily James and Armie Hammer, modernises the aesthetic without modernising the material. It was met with negative reviews and largely forgotten. The 1940 Hitchcock remains definitively the screen version.`
      }
    ],
    readFirst: `Yes — specifically to experience the narrator's nameless anxiety in full before Hitchcock necessarily gives her a face and a performance. Also to understand the novel's ending before the Hays Code changes it. Read first, then watch Hitchcock's version as a masterful adaptation of a different story.`,
    verdictBox: `Du Maurier wrote a Gothic masterpiece of female anxiety and identity. Hitchcock made a brilliant film of a sanitised version of it. The novel is the greater work and the more disturbing one. The film is among Hitchcock's finest. Read the book for the real ending. See the film for Mrs Danvers.`,
    related: [
      { href: '/jane-eyre.html', label: 'Jane Eyre' },
      { href: '/wuthering-heights.html', label: 'Wuthering Heights' },
      { href: '/gone-girl.html', label: 'Gone Girl' }
    ]
  },

  {
    slug: 'eat-pray-love',
    title: 'Eat Pray Love',
    genre: 'Memoir / Drama',
    author: 'Elizabeth Gilbert',
    bookYear: '2006',
    director: 'Ryan Murphy',
    filmYear: '2010',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4v6k1b7',
    image: 'eat-pray-love.jpg',
    youtubeId: 'mjay5vgIwt4',
    trailerNote: 'Starring Julia Roberts &mdash; Film: 2010',
    metaTitle: 'Eat Pray Love: Book vs Movie — Elizabeth Gilbert vs Ryan Murphy',
    metaDesc: "Elizabeth Gilbert's 2006 memoir vs Ryan Murphy's 2010 film — Italy, India, Bali, Julia Roberts, and why the book's interiority is the whole point.",
    subtitle: 'Book (2006) vs. Movie (2010) &mdash; dir. Ryan Murphy',
    storyBrief: `After a painful divorce and a devastating love affair, Elizabeth Gilbert spends a year travelling — eating in Italy, praying in India, and falling in love again in Bali. Gilbert's memoir is a first-person account of spiritual and emotional recovery, written with wit, self-deprecation, and genuine intellectual engagement with the traditions she encounters. Ryan Murphy's film, with Julia Roberts as Gilbert, is lush, sympathetic, and substantially less interesting than the book it is adapting.`,
    differences: [
      {
        heading: "Gilbert's voice",
        text: `The memoir is written in a voice of considerable charm and self-awareness — Gilbert is funny about herself, rigorous about her own failures, and genuinely curious about the spiritual traditions she encounters. This voice is the book's primary pleasure. Julia Roberts is one of cinema's most charming performers and she cannot replicate a voice that exists in sentences.`
      },
      {
        heading: "The spiritual dimension",
        text: `Gilbert's engagement with meditation, yoga philosophy, and Balinese spirituality is given real intellectual weight in the memoir — she reads, studies, and thinks seriously about what she's encountering. The film renders the spiritual dimension as atmosphere and feeling, which is more cinematic and considerably shallower.`
      },
      {
        heading: "Julia Roberts",
        text: `Roberts's presence works both for and against the film. She is warm and luminous and makes Gilbert immediately sympathetic. She is also visibly Julia Roberts in Italy, which makes it difficult to believe in the vulnerability and lostness that the memoir's Gilbert actually experienced. The memoir's Gilbert is more genuinely frightened.`
      },
      {
        heading: "Italy",
        text: `Both versions make Italy glorious — the food, the light, the language lessons, the pleasure of doing nothing important very slowly. The film's Italy is the most effective section because the pleasures are visual and don't require interiority. Eat is the easiest third to adapt.`
      },
      {
        heading: "The structure",
        text: `Gilbert structures the memoir around 108 sections — one for each bead on a japa mala — which gives the book a formal shape that the film cannot replicate. The film follows the geographical structure (Italy, India, Bali) but loses the precise formal architecture underneath it.`
      }
    ],
    readFirst: `Yes — the memoir's voice is the experience and no film can render it. Read first and the film becomes a beautiful tourist companion to a book you'll remember better. Watch first and you'll have pretty pictures without the self-examination that makes the book worth reading.`,
    verdictBox: `Gilbert wrote a memoir of genuine wit and intellectual engagement. Murphy made a handsome film of the prettiest parts of it. The book is richer, funnier, and more honest. The film is a pleasant way to spend two hours in Italy, India, and Bali with Julia Roberts. Read the book. See the film if the scenery appeals.`,
    related: [
      { href: '/wild.html', label: 'Wild' },
      { href: '/the-kite-runner.html', label: 'The Kite Runner' },
      { href: '/people-we-meet-on-vacation.html', label: 'People We Meet on Vacation' }
    ]
  },

  {
    slug: 'outlander',
    title: 'Outlander',
    genre: 'Historical Fiction / Romance',
    author: 'Diana Gabaldon',
    bookYear: '1991',
    director: 'Various — Starz series',
    filmYear: '2014',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/48pJsKI',
    image: 'outlander.jpg',
    youtubeId: 'PFFKjptRr7Y',
    trailerNote: 'Starring Caitriona Balfe, Sam Heughan &mdash; Starz series from 2014',
    metaTitle: 'Outlander: Book vs TV Series — Diana Gabaldon vs Starz',
    metaDesc: "Diana Gabaldon's 1991 novel vs the Starz series — Claire Fraser, time travel, 18th-century Scotland, and whether the show does the book justice.",
    subtitle: 'Book (1991) vs. TV Series (2014) &mdash; Starz',
    storyBrief: `Claire Randall, a former British combat nurse, is visiting the Scottish Highlands with her husband in 1945 when she steps through a standing stone and is transported to 1743 — a Scotland on the eve of the Jacobite rising. She is swept into the life of the MacKenzie clan and into marriage with the young warrior Jamie Fraser. Diana Gabaldon's debut novel launched a series of eight volumes (and counting) that has sold over fifty million copies. The Starz television series, starring Caitriona Balfe and Sam Heughan, ran for seven seasons and became one of the most devoted fandoms in recent television history.`,
    differences: [
      {
        heading: "Claire's interiority",
        text: `Gabaldon writes Claire in first person, giving her a voice of dry, observant intelligence — a twentieth-century woman's mind appraising an eighteenth-century world with medical precision and cultural vertigo. Caitriona Balfe communicates this through performance with considerable skill, but the novel's Claire has a richer running commentary on everything she sees.`
      },
      {
        heading: "Caitriona Balfe and Sam Heughan",
        text: `The casting is the series' great achievement. Balfe's Claire is physically and emotionally precise; Heughan's Jamie is both the romantic ideal the books describe and a fully realised person. Their chemistry is the series' engine and it delivers on the novel's central relationship completely.`
      },
      {
        heading: "The scope of the novel",
        text: `Gabaldon's first novel is over eight hundred pages and covers an extraordinary range of incident, emotion, and historical detail. The series adapts the first novel across sixteen episodes of its first season, which allows a fidelity to the source that most literary adaptations cannot afford. Later seasons compress subsequent novels more aggressively.`
      },
      {
        heading: "The historical world",
        text: `Both versions render 18th-century Scotland with evident care. The series' production design is meticulous and the location filming in Scotland gives it an authenticity that Gabaldon's research earns on the page through different means. This is an area where the series adds genuine value.`
      },
      {
        heading: "Later seasons vs later books",
        text: `The series ran for seven seasons, eventually outpacing Gabaldon's publication schedule and adapting novels of varying quality with varying fidelity. Readers of the full series will find the later seasons more divergent from their source material. The first season remains the closest and best adaptation.`
      }
    ],
    readFirst: `Either order is viable — the series is faithful enough to Season 1 that watching first won't significantly diminish reading the novel. Most Outlander readers discovered the books through the series, which is the natural order. If reading first, you'll appreciate the casting decisions more fully.`,
    verdictBox: `Gabaldon wrote a novel of epic romantic and historical ambition that launched one of the great popular series of recent decades. The Starz series found its ideal cast and did the source justice, particularly in its first season. The novel is the richer experience; the series is the better companion than most. Both are worth your time. The book is the original.`,
    related: [
      { href: '/normal-people.html', label: 'Normal People' },
      { href: '/the-english-patient.html', label: 'The English Patient' },
      { href: '/cold-mountain.html', label: 'Cold Mountain' }
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
