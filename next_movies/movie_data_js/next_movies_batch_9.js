#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Page Generator (Incomplete Batch)
 * 8 titles previously incomplete, now fully written:
 *   1. Animal Farm
 *   2. People We Meet on Vacation
 *   3. Dark Matter
 *   4. The Housemaid
 *   5. A Knight of the Seven Kingdoms
 *   6. Margo's Got Money Troubles
 *   7. Reminders of Him
 *   8. Fourth Wing
 *
 * Usage:
 *   node next_movies_batch_incomplete.js
 *
 * Run from /next_movies/ subfolder.
 * Outputs HTML files to current directory.
 * Then: QA, move to root, run sitemap + index scripts.
 *
 * NOTE: Fourth Wing has filmYear: 'TBA' — the page is future-proofed
 * but update director/filmYear once Prime Video confirms a release date.
 */

const fs = require('fs');
const path = require('path');

const PAGES = [
  {
    slug: 'animal-farm',
    title: 'Animal Farm',
    genre: 'Political Satire / Classic',
    author: 'George Orwell',
    bookYear: '1945',
    director: 'Andy Serkis',
    filmYear: '2025',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4vaeqAq',
    image: 'animal-farm.jpg',
    youtubeId: 'g8wLmj9SiKM',
    trailerNote: 'Directed by Andy Serkis &mdash; Netflix animated film: 2025',
    metaTitle: 'Animal Farm: Book vs Movie — George Orwell vs Andy Serkis',
    metaDesc: "George Orwell's 1945 political fable vs Andy Serkis's 2025 Netflix film — the pigs, the allegory, and why the novella remains essential.",
    subtitle: 'Book (1945) vs. Movie (2025) &mdash; dir. Andy Serkis',
    storyBrief: `The animals of Manor Farm overthrow their human farmer and establish a republic of their own. Under the leadership of the pigs — and eventually the singular authority of Napoleon — the revolution eats itself, and the promise of equality gives way to a tyranny indistinguishable from what came before. George Orwell's 1945 novella is one of the most efficient political allegories in the English language — eighty pages that contain everything that needs to be said about how revolutions fail. Andy Serkis's 2025 Netflix animated adaptation brings the farm to vivid life with contemporary voice talent and updated visual language.`,
    differences: [
      {
        heading: 'The allegory',
        text: `Orwell's novella is transparently allegorical — the pigs are the Bolsheviks, Napoleon is Stalin, Snowball is Trotsky, the farm is the Soviet Union. Serkis's adaptation updates the allegory toward more general authoritarianism and populist demagoguery, which makes it feel contemporary at the cost of Orwell's historical specificity. The novella's precision is inseparable from its target.`
      },
      {
        heading: "Orwell's prose economy",
        text: `The novella is extraordinarily compressed — Orwell builds an entire political history in fewer than thirty thousand words, with no wasted sentence. The animation expands the story to feature length, which means scenes and sequences that Orwell dispatched in a paragraph become set pieces. The expansion is sometimes effective and sometimes reveals why Orwell left things brief.`
      },
      {
        heading: 'Squealer',
        text: `The pigs' propagandist — who convinces the other animals that their memories are wrong and their conditions improving — is the novella's most chilling creation. Both versions understand that Squealer is the book's argument about how language is weaponised. The animation gives him more screen time and more explicit menace, which is less frightening than Orwell's version precisely because it is more visible.`
      },
      {
        heading: 'Boxer',
        text: `The carthorse who works himself to death in loyal service to a cause that betrays him is the novella's most affecting creation. Both versions earn his fate. The animation's Boxer benefits from voice performance in a way that the prose cannot provide — his decency is made audible.`
      },
      {
        heading: 'The ending',
        text: `Both versions end with the animals looking through the farmhouse window, unable to tell pig from man. Orwell's final line is one of literature's most perfectly placed. The film reaches the same destination with appropriate gravity.`
      }
    ],
    readFirst: `Yes — and the novella takes two hours to read, so there is no argument for skipping it. Orwell's prose is the experience; the allegory lives in the specific compression of his sentences. Read it first and the film becomes an illustration. At eighty pages, it is the most efficient read-first recommendation on this site.`,
    verdictBox: `Orwell wrote one of the essential political texts of the twentieth century in the form of a children's fable. Serkis made a sincere, visually accomplished adaptation that updates the allegory for a new moment. The novella is irreplaceable. The film is a worthwhile companion. Read the book — it takes an evening and lasts a lifetime.`,
    related: [
      { href: '/the-handmaids-tale.html', label: "The Handmaid's Tale" },
      { href: '/never-let-me-go.html', label: 'Never Let Me Go' },
      { href: '/nineteen-eighty-four.html', label: 'Nineteen Eighty-Four' }
    ]
  },

  {
    slug: 'people-we-meet-on-vacation',
    title: 'People We Meet on Vacation',
    genre: 'Romance / Contemporary Fiction',
    author: 'Emily Henry',
    bookYear: '2021',
    director: 'Brett Haley',
    filmYear: '2026',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4ts4KzI',
    image: 'people-we-meet-on-vacation.jpg',
    youtubeId: 'm1C9DTOUH5s',
    trailerNote: 'Starring Emily Bader, Tom Blyth &mdash; Netflix: January 9, 2026',
    metaTitle: 'People We Meet on Vacation: Book vs Movie — Emily Henry vs Brett Haley',
    metaDesc: "Emily Henry's bestselling novel vs Brett Haley's 2026 Netflix film — Poppy and Alex, the friends-to-lovers slow burn, and what the film gets right and loses.",
    subtitle: 'Book (2021) vs. Movie (2026) &mdash; dir. Brett Haley',
    storyBrief: `Poppy Wright is a travel writer who has spent ten years taking one summer vacation a year with her best friend Alex Nilsen — a high school English teacher who is her opposite in almost every way. Two years ago something happened that ended the friendship. The novel moves between their annual vacations and the present, as Poppy tries to repair what broke. Emily Henry's second novel debuted at number one on the New York Times bestseller list and sold over two million copies. Brett Haley's Netflix adaptation, starring Emily Bader and Tom Blyth, premiered on January 9, 2026 to generally positive reviews.`,
    differences: [
      {
        heading: "Henry's prose voice",
        text: `Henry writes Poppy in first person with a voice of considerable warmth and self-aware humour — funny about her own failures, precise about her feelings, and genuinely curious about Alex. This voice is the novel's primary pleasure and what gives the slow-burn its charge. Bader's performance captures Poppy's energy without being able to replicate the interiority of Henry's sentences.`
      },
      {
        heading: 'The flashback structure',
        text: `Henry alternates between the present — Poppy trying to plan one last vacation to fix things — and each of their ten annual trips. This structure builds the relationship's history with deliberate accumulation, so when the fracture comes it lands with full weight. The film preserves this structure and it works, though the compression means some vacations are reduced to single scenes.`
      },
      {
        heading: 'Tom Blyth as Alex',
        text: `Alex is described as book-loving, quiet, and reluctant to travel — an internal person who comes alive in specific contexts. Blyth plays him with genuine restraint and intelligence. Some readers felt his casting brought more obvious leading-man appeal than Henry's Alex is supposed to have, which slightly alters the novel's dynamic of Poppy seeing something in Alex that others miss.`
      },
      {
        heading: 'The missing confession scene',
        text: `The novel contains a pivotal scene in which Alex's full feelings are revealed through a specific, intimate action that readers cite as the emotional core of the book. The film's adaptation of this scene was the most discussed departure — some felt it lost the specificity that made the moment devastating on the page.`
      },
      {
        heading: 'The locations',
        text: `Henry's novel takes Poppy and Alex through a range of destinations that each have a specific emotional register — some beautiful, some deliberately unglamorous. The film shot in Tuscany, Barcelona, and New Orleans with evident care. The locations are gorgeous and match the novel's sense that travel is both escape and self-discovery.`
      }
    ],
    readFirst: `Yes — Henry's prose voice and the slow accumulation of ten years of friendship are what make the payoff land. The film earns its ending; the novel earns it more completely. Read first and the film is a warm, well-cast companion. Watch first and you'll enjoy it but miss what readers fell in love with.`,
    verdictBox: `Henry wrote a romance that earns its reputation — funny, emotionally precise, and genuinely moving when it pays off. Haley made a faithful, warmly performed adaptation that loses some of the novel's interiority and gains beautiful locations and two likeable leads. The book is better. The film is one of Netflix's better literary adaptations. Read first.`,
    related: [
      { href: '/me-before-you.html', label: 'Me Before You' },
      { href: '/normal-people.html', label: 'Normal People' },
      { href: '/the-notebook.html', label: 'The Notebook' }
    ]
  },

  {
    slug: 'dark-matter',
    title: 'Dark Matter',
    genre: 'Science Fiction / Thriller',
    author: 'Blake Crouch',
    bookYear: '2016',
    director: 'Blake Crouch (showrunner)',
    filmYear: '2024',
    verdict: 'tie',
    verdictText: 'Too Close to Call',
    affiliateLink: 'https://amzn.to/3O2ReDm',
    image: 'dark-matter.jpg',
    youtubeId: 'j6ucGt_Xp14',
    trailerNote: 'Starring Joel Edgerton, Jennifer Connelly &mdash; Apple TV+ series: 2024',
    metaTitle: 'Dark Matter: Book vs TV Series — Blake Crouch vs Apple TV+',
    metaDesc: "Blake Crouch's 2016 novel vs the Apple TV+ series — Jason Dessen, the multiverse, and a rare case where the author's own adaptation is genuinely competitive.",
    subtitle: 'Book (2016) vs. TV Series (2024) &mdash; Apple TV+ &mdash; showrunner Blake Crouch',
    storyBrief: `Jason Dessen is a physicist and family man in Chicago who is abducted one night and wakes up in a version of his life he never lived — one where he made different choices, achieved greater things, and lost everything that actually matters to him. Blake Crouch's 2016 novel is a multiverse thriller of almost irresistible momentum. The Apple TV+ series, with Joel Edgerton and Jennifer Connelly, was showrun by Crouch himself. He has said the adaptation is better than the source. That claim is worth examining.`,
    differences: [
      {
        heading: "Crouch as showrunner",
        text: `Crouch adapted his own novel and has been unusually candid that the television format allowed him to do things the novel's pace couldn't — expand the multiverse, develop secondary characters, sustain suspense across nine episodes. Having the author control the adaptation produces a version that is faithful in spirit while genuinely extending the material.`
      },
      {
        heading: "Joel Edgerton",
        text: `Edgerton plays Jason with a quality of ordinary intelligence under extraordinary pressure — convincingly a physicist, convincingly a father, and convincingly terrified. The novel's Jason is rendered through first-person urgency; Edgerton translates this into physical performance. His dual role — playing both versions of Jason — is the series' central achievement.`
      },
      {
        heading: 'The multiverse sequences',
        text: `Crouch's novel moves through alternate realities quickly — the thriller momentum depends on not dwelling too long in any single world. The series slows this down, giving each reality more texture and time. This is both more cinematic and occasionally less suspenseful than the novel's relentless forward drive.`
      },
      {
        heading: 'Jennifer Connelly',
        text: `The novel's Daniela is rendered through Jason's love for her — she is the reason for everything but not quite a fully independent perspective. Connelly brings Daniela her own interiority and her own intelligence, making her a protagonist in her own right in a way the novel doesn't quite manage.`
      },
      {
        heading: 'Season 2',
        text: `The novel is a standalone work — it ends conclusively. Apple TV+ renewed the series for a second season that will be entirely original material. The novel's readers can enjoy the series as a faithful adaptation with extensions; viewers who continue into Season 2 are entering new territory.`
      }
    ],
    readFirst: `Either order works genuinely well. Crouch's novel is a page-turner that can be read in a day and the experience of its momentum is distinct from the series' more measured pace. Read first for the rush; watch for the performance. This is one of the site's genuine ties.`,
    verdictBox: `Crouch wrote one of the most propulsive science fiction thrillers of the decade. Then he adapted it himself and made something that is genuinely competitive with the source — richer in some dimensions, less purely kinetic in others. Read the novel for the experience of being unable to stop. Watch the series for Edgerton. Both are worth your time.`,
    related: [
      { href: '/station-eleven.html', label: 'Station Eleven' },
      { href: '/project-hail-mary.html', label: 'Project Hail Mary' },
      { href: '/ready-player-one.html', label: 'Ready Player One' }
    ]
  },

  {
    slug: 'the-housemaid',
    title: 'The Housemaid',
    genre: 'Psychological Thriller',
    author: 'Freida McFadden',
    bookYear: '2022',
    director: 'Paul Feig',
    filmYear: '2025',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4tqh2bC',
    image: 'the-housemaid.jpg',
    youtubeId: '48CtX6OgU3s',
    trailerNote: 'Starring Sydney Sweeney, Amanda Seyfried &mdash; Film: December 2025',
    metaTitle: 'The Housemaid: Book vs Movie — Freida McFadden vs Paul Feig',
    metaDesc: "Freida McFadden's BookTok thriller vs Paul Feig's 2025 film — Millie, Nina, the twist, and whether Sydney Sweeney and Amanda Seyfried do it justice.",
    subtitle: 'Book (2022) vs. Movie (2025) &mdash; dir. Paul Feig',
    storyBrief: `Millie Calloway, recently released from prison, takes a job as live-in housemaid for the wealthy Winchester family — Nina and Andrew, and their daughter Cece. The house in Great Neck, Long Island is beautiful and the pay is extraordinary. The locked attic bedroom should be a warning. Freida McFadden's novel is a twist-driven psychological thriller that became a BookTok phenomenon, selling millions of copies. Paul Feig's film — a throwback to 1990s erotic thrillers — grossed nearly four hundred million dollars and earned generally positive reviews. A sequel is already in production.`,
    differences: [
      {
        heading: "The twist",
        text: `McFadden builds her novel around a carefully constructed revelation about who the real protagonist is and what is actually happening in the Winchester house. The novel's structure holds the twist with precision across its full length. The film preserves the twist but the shorter runtime means less accumulation of misdirection — readers of the novel will clock the mechanics more easily than first-time viewers.`
      },
      {
        heading: 'Amanda Seyfried',
        text: `Seyfried's Nina is the film's most discussed performance — theatrical, unpredictable, alternately threatening and pitiable. Critics who found the film uneven largely exempted Seyfried. She plays Nina as a woman who has internalised a form of performance so completely that she no longer knows where it ends. This is more interesting than the novel's Nina, who is more straightforwardly a victim.`
      },
      {
        heading: 'Sydney Sweeney',
        text: `Sweeney's Millie divided critics — some found her performance too interior for a thriller, others felt she captured Millie's wariness precisely. The novel's Millie is rendered in first person, which gives her a voice of dry observation that Sweeney cannot replicate through expression alone. The performance is committed if not definitive.`
      },
      {
        heading: "Feig's tone",
        text: `Feig directed A Simple Favor and brought a similar quality of knowing camp to The Housemaid — the film is aware of its genre pleasures and leans into them. This is partly what made it commercially effective and partly what divided critics who wanted a straighter thriller. The novel is somewhat more earnestly tense; the film is enjoying itself more.`
      },
      {
        heading: 'The attic',
        text: `Both versions use the locked attic as the novel's central spatial metaphor — the space that contains the secret the house is built to hide. The film's attic is effectively menacing. The novel's is more claustrophobic because McFadden gives the reader more time inside Millie's confinement.`
      }
    ],
    readFirst: `Yes — the novel's twist lands harder when built over the full reading experience. The film's twist is effective but the shorter journey means less accumulated dread. Read first for the full mechanism, then watch Seyfried and enjoy the film as a glossy genre exercise.`,
    verdictBox: `McFadden wrote a precision-engineered thriller that rewards its readers with a well-constructed payoff. Feig made a knowingly camp, commercially savvy film of it with one excellent performance at its centre. The novel is the more complete experience. The film is the more entertaining one to watch with an audience. Read first. See both.`,
    related: [
      { href: '/gone-girl.html', label: 'Gone Girl' },
      { href: '/girl-on-the-train.html', label: 'The Girl on the Train' },
      { href: '/verity.html', label: 'Verity' }
    ]
  },

  {
    slug: 'a-knight-of-the-seven-kingdoms',
    title: 'A Knight of the Seven Kingdoms',
    genre: 'Fantasy / Historical Fiction',
    author: 'George R.R. Martin',
    bookYear: '2015',
    director: 'Various — HBO series',
    filmYear: '2025',
    verdict: 'tie',
    verdictText: 'Too Close to Call',
    affiliateLink: 'https://amzn.to/41d19cI',
    image: 'a-knight-of-the-seven-kingdoms.jpg',
    youtubeId: 'UPFRItMOgPo',
    trailerNote: 'Starring Peter Claffey, Dexter Sol Ansell &mdash; HBO series: 2025',
    metaTitle: 'A Knight of the Seven Kingdoms: Book vs TV Series — Martin vs HBO',
    metaDesc: "George R.R. Martin's Dunk and Egg novellas vs the HBO series — Ser Duncan the Tall, young Aegon Targaryen, and a prequel that respects its source.",
    subtitle: 'Book (2015) vs. TV Series (2025) &mdash; HBO',
    storyBrief: `Ser Duncan the Tall — a hedge knight of uncertain origin — and his young squire Egg, who is secretly the prince Aegon Targaryen, travel the roads of Westeros ninety years before the events of Game of Thrones. The collected novellas — The Hedge Knight, The Sworn Sword, and The Mystery Knight — follow their adventures through tournaments, droughts, and plots. George R.R. Martin has been publishing the Dunk and Egg stories since 1998; the collected volume appeared in 2015. HBO's series, arriving in 2025, brought the characters to the small screen with a warmth and intimacy that distinguishes it from both Game of Thrones and House of the Dragon.`,
    differences: [
      {
        heading: "Martin's novellas vs the series",
        text: `The three collected novellas are considerably shorter than a full novel — together they run to around three hundred pages. The series adapts this material across multiple episodes with the room to expand characters, deepen relationships, and add scenes Martin has only sketched. For once, the adaptation has more pages to work with than the source provides.`
      },
      {
        heading: 'Dunk and Egg',
        text: `Peter Claffey's Dunk is physically right — large, earnest, uncertain of himself in ways that matter — and Dexter Sol Ansell's Egg is the series' considerable achievement: a child performer who carries the weight of what Egg will become without losing what he is now. The novellas' Dunk and Egg are beloved but rendered more briefly; the series fills in what Martin left as implication.`
      },
      {
        heading: 'Tone',
        text: `The novellas have a quality of warmth and adventure that Martin's longer work often sacrifices for political complexity. The series preserves this tone — it is the most human and least cynical piece of Westerosi storytelling yet put on screen. Readers who came to the source material from Game of Thrones may be surprised by how gentle Dunk and Egg's world is in comparison.`
      },
      {
        heading: 'The broader world',
        text: `Martin's novellas are set firmly in Dunk and Egg's immediate experience — the reader learns about the wider world of Westeros through their travels. The series can use visual storytelling to suggest the larger world more efficiently, and Game of Thrones viewers bring knowledge that first-time readers of the novellas lack.`
      },
      {
        heading: 'Expanded material',
        text: `The series adds characters and storylines that Martin has only mentioned or implied — drawing on the broader history of the period that he has sketched in The World of Ice and Fire and elsewhere. This expansion is mostly faithful to the spirit of the source and occasionally adds depth the novellas don't have space for.`
      }
    ],
    readFirst: `Either order works well. The novellas are short enough to read before the series premieres — or between seasons — and reading first gives you the foundation for appreciating what the series adds. Watching first and then reading is equally valid. This is one of the site's genuine ties: both versions have distinct strengths.`,
    verdictBox: `Martin wrote three novellas of warmth and adventure in a world usually defined by cynicism and death. HBO made a series that honours that spirit and expands it generously. The novellas are richer in prose and more precisely imagined. The series is more fully realised as a world. Read both. Watch both. A rare and genuine tie.`,
    related: [
      { href: '/dune.html', label: 'Dune' },
      { href: '/fourth-wing.html', label: 'Fourth Wing' },
      { href: '/narnia-magicians-nephew.html', label: 'Narnia: The Magician\'s Nephew' }
    ]
  },

  {
    slug: 'margos-got-money-troubles',
    title: "Margo's Got Money Troubles",
    genre: 'Comedy / Drama',
    author: 'Rufi Thorpe',
    bookYear: '2024',
    director: 'Dearbhla Walsh',
    filmYear: '2026',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4sbRr56',
    image: 'margos-got-money-troubles.jpg',
    youtubeId: 'AjI52haEerU',
    trailerNote: 'Starring Elle Fanning, Michelle Pfeiffer, Nick Offerman &mdash; Apple TV+: April 15, 2026',
    metaTitle: "Margo's Got Money Troubles: Book vs TV Series — Rufi Thorpe vs Apple TV+",
    metaDesc: "Rufi Thorpe's 2024 novel vs the Apple TV+ series — Margo, OnlyFans, a wrestler father, and whether Elle Fanning captures the book's voice.",
    subtitle: 'Book (2024) vs. TV Series (2026) &mdash; dir. Dearbhla Walsh &mdash; Apple TV+',
    storyBrief: `Margo Millet is a recent college dropout and aspiring writer — the daughter of a former Hooters waitress and an ex-professional wrestler — who finds herself pregnant after an affair with her English professor. Facing a mountain of bills and no obvious way to pay them, she starts an OnlyFans account and reconnects with her estranged father, whose wrestling wisdom turns out to be unexpectedly applicable. Rufi Thorpe's novel is funny, warm, and sharper than its premise suggests. The Apple TV+ series, premiering April 15, 2026, stars Elle Fanning and a cast that includes Michelle Pfeiffer and Nick Offerman.`,
    differences: [
      {
        heading: "Thorpe's voice",
        text: `The novel is written in Margo's first person — a voice of considerable wit and self-awareness that is the book's most distinctive quality. Thorpe makes Margo funny without making her foolish, and the comedy and the tenderness coexist in the prose in ways that are difficult to translate to screen. Elle Fanning has the energy and charm but cannot replicate a voice that exists in sentences.`
      },
      {
        heading: 'The cast',
        text: `Michelle Pfeiffer as Shyanne — Margo's Hooters waitress mother — and Nick Offerman as Jinx — her ex-wrestler father — are casting decisions of considerable shrewdness. Both performers bring the right combination of warmth and damaged-ness that the roles require. Pfeiffer in particular has the comic timing and the gravity that Shyanne needs.`
      },
      {
        heading: 'The wrestling world',
        text: `Thorpe writes about professional wrestling with affectionate specificity — the kayfabe, the terminology, the particular culture of performance and pain. Jinx's wrestling wisdom applied to Margo's OnlyFans career is the novel's central comic conceit and it works because Thorpe understands both worlds. The series has the production resources to render the wrestling scenes with more spectacle.`
      },
      {
        heading: 'David E. Kelley',
        text: `Kelley (The Practice, Big Little Lies, Nine Perfect Strangers) is one of television's most prolific showrunners and his involvement brings considerable resources and craft. His sensibility runs slightly warmer and more conventionally dramatic than Thorpe's, which may be what makes the series more immediately accessible and slightly less sharp than the novel.`
      },
      {
        heading: 'Timeliness',
        text: `The novel arrives at a cultural moment when OnlyFans as an economic strategy for women in precarious circumstances is a subject of genuine public debate. Both the book and the series engage with this without either condemning or uncritically celebrating. The series, airing in 2026, has the advantage of being able to respond to the cultural conversation in ways the novel, written earlier, anticipated.`
      }
    ],
    readFirst: `Yes — Thorpe's voice is the experience and the series, however good, cannot replicate it. Read first and the series becomes a warmly cast companion to a book whose wit you'll remember. The novel is also recent enough that reading it before the series airs is entirely feasible.`,
    verdictBox: `Thorpe wrote a novel that is funnier and sharper than its premise promises. Kelley and Walsh made a series with exceptional casting that is likely warmer and slightly less precise than the source. The book is the more distinctive work. The series is excellent television. Read first. Watch from April 15.`,
    related: [
      { href: '/people-we-meet-on-vacation.html', label: 'People We Meet on Vacation' },
      { href: '/normal-people.html', label: 'Normal People' },
      { href: '/big-little-lies.html', label: 'Big Little Lies' }
    ]
  },

  {
    slug: 'reminders-of-him',
    title: 'Reminders of Him',
    genre: 'Romance / Drama',
    author: 'Colleen Hoover',
    bookYear: '2022',
    director: 'Vanessa Caswill',
    filmYear: '2026',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4m6CIXQ',
    image: 'reminders-of-him.jpg',
    youtubeId: 'i36Zw32GfRQ',
    trailerNote: 'Starring Maika Monroe, Tyriq Withers &mdash; Film: March 13, 2026',
    metaTitle: 'Reminders of Him: Book vs Movie — Colleen Hoover vs Vanessa Caswill',
    metaDesc: "Colleen Hoover's 2022 novel vs Vanessa Caswill's 2026 film — Kenna, Ledger, and whether the CoHo formula translates to screen.",
    subtitle: 'Book (2022) vs. Movie (2026) &mdash; dir. Vanessa Caswill',
    storyBrief: `Kenna Rowan is released from prison after serving five years for a car accident that killed her boyfriend Scotty. She returns to the town where her young daughter Diem lives with Scotty's parents, who refuse to let Kenna see her. The only person who shows her unexpected compassion is Ledger Ward — a local bar owner with his own connection to Scotty. Colleen Hoover's novel blends grief, guilt, and romance in a way that became one of her most widely read works on BookTok. Vanessa Caswill's film, starring Maika Monroe and Tyriq Withers, was released March 13, 2026.`,
    differences: [
      {
        heading: "Hoover's dual perspective",
        text: `The novel alternates between Kenna's and Ledger's perspectives — giving the reader access to both sides of their complicated feelings simultaneously. This structure builds dramatic irony and emotional depth that a film, staying closer to surface behaviour, finds harder to sustain. The screenplay condenses the dual perspective into a more conventional single throughline.`
      },
      {
        heading: 'Maika Monroe as Kenna',
        text: `Monroe is best known for horror — It Follows, Longlegs — and she brings a quality of watchful containment to Kenna that is interesting casting against type. Hoover's Kenna is more openly emotionally volatile; Monroe plays her grief as something held tightly rather than expressed freely. Both are valid interpretations.`
      },
      {
        heading: "Kenna's letters",
        text: `The novel includes letters that Kenna writes to Scotty — processing her guilt, her love, and her hope for Diem. These letters are the novel's most emotionally direct material and give the reader access to Kenna's grief in a way that no amount of good acting can fully replicate. The film uses them sparingly as voiceover.`
      },
      {
        heading: 'The Hoover formula',
        text: `Hoover's CoHo formula — romance built on grief and guilt, with characters whose damage is specific and whose love is redemptive — works consistently on the page because her prose voice carries the emotional weight. On screen, without that voice, the formula can feel more mechanical. Caswill's direction finds visual equivalents with some success.`
      },
      {
        heading: 'Diem',
        text: `The four-year-old daughter at the centre of the novel's emotional stakes is rendered with great care by Hoover — she is real and specific and entirely innocent of the damage around her. The film's Diem is similarly well-handled. Child casting in these roles is always risky; the film got it right.`
      }
    ],
    readFirst: `Yes — Hoover's dual perspective and Kenna's letters are what give the novel its emotional precision. The film is a sincere and well-cast adaptation that loses some of this interiority. Read first and the film is a moving companion. Fans of the book will find Monroe's Kenna interesting even where she differs from the page.`,
    verdictBox: `Hoover wrote one of her most emotionally complete novels — grief and romance in careful balance. Caswill made a faithful, well-cast film that loses some of the novel's interiority and retains its emotional core. The book is the richer experience. The film is worth seeing for Monroe's performance. Read first.`,
    related: [
      { href: '/it-ends-with-us.html', label: 'It Ends With Us' },
      { href: '/verity.html', label: 'Verity' },
      { href: '/me-before-you.html', label: 'Me Before You' }
    ]
  },

  {
    slug: 'fourth-wing',
    title: 'Fourth Wing',
    genre: 'Fantasy Romance / Romantasy',
    author: 'Rebecca Yarros',
    bookYear: '2023',
    director: 'TBA — Prime Video series in development',
    filmYear: 'TBA',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/3PGAKS7',
    image: 'fourth-wing.jpg',
    youtubeId: 'vcybDwT6Ia4',
    trailerNote: 'Prime Video series in development — no release date confirmed',
    metaTitle: 'Fourth Wing: Book vs Upcoming TV Series — Rebecca Yarros vs Prime Video',
    metaDesc: "Rebecca Yarros's BookTok phenomenon vs the upcoming Prime Video series — Violet Sorrengail, Xaden Riorson, dragon riders, and what the adaptation needs to get right.",
    subtitle: 'Book (2023) vs. TV Series (TBA) &mdash; Prime Video — in development',
    storyBrief: `Violet Sorrengail was supposed to join the Scribes — the scholars of Basgiath War College. Her mother, the commanding general, has other ideas. Violet is sent to the Riders Quadrant instead, where students bond with dragons or die trying. She is small, chronically ill, and not supposed to survive. Rebecca Yarros's romantasy novel sold over ten million copies in its first year, becoming the publishing phenomenon of 2023 and the engine of the BookTok romance renaissance. Amazon MGM Studios and Michael B. Jordan's Outlier Society are developing a Prime Video series. No casting, director, or release date has been confirmed as of early 2026.`,
    differences: [
      {
        heading: 'The adaptation challenge',
        text: `Fourth Wing presents an unusual adaptation challenge: the novel's appeal rests equally on its world-building (dragons, war college, magic system), its romance (Violet and Xaden's slow-burn antagonism-to-love), and its prose voice (funny, self-aware, aware of its own genre). Getting all three right simultaneously is the series' central task.`
      },
      {
        heading: 'The romance',
        text: `Yarros writes the Violet-Xaden romance with considerable craft — the tension, the mistrust, the specific beats of their dynamic are precisely calibrated. Casting will determine whether the series delivers this. Yarros has confirmed Xaden will be played by a person of colour, in keeping with how she describes him in the text.`
      },
      {
        heading: 'The dragons',
        text: `The dragons are characters — Tairn and Andarnath are as central to the novel as any human. Rendering them at the budget and quality the material requires is the series' most significant production challenge. Given the post-Game of Thrones standard for fantasy television dragon effects, the bar is high.`
      },
      {
        heading: 'The series vs the books',
        text: `Fourth Wing is the first of a planned five-book series, with three published as of 2026. Amazon has ordered a multi-season adaptation. The series' long-term success will depend on whether it can sustain the momentum and emotional investment of the novels across what will be many hours of television.`
      },
      {
        heading: 'What we know',
        text: `As of April 2026, Meredith Averill — executive producer on Wednesday Season 2 — is attached as showrunner. No director, cast, or filming schedule has been announced. This page will be updated when production details are confirmed. The novel is available now and will take approximately ten hours to read.`
      }
    ],
    readFirst: `Yes — read the novel before the series arrives. It is a genuinely enjoyable ten hours and understanding what the adaptation needs to capture will make the series more interesting to evaluate when it comes. The novel is complete and satisfying on its own terms; the series is a future event.`,
    verdictBox: `Yarros wrote the defining romantasy of its moment — a novel that earned its massive readership through genuine craft as well as timing. The Prime Video series is in development and has not yet had the chance to succeed or fail. The novel is the definitive version until further notice. Read it. We'll update this page when the series arrives.`,
    related: [
      { href: '/a-knight-of-the-seven-kingdoms.html', label: 'A Knight of the Seven Kingdoms' },
      { href: '/dune.html', label: 'Dune' },
      { href: '/narnia-magicians-nephew.html', label: 'Narnia: The Magician\'s Nephew' }
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
          <img src="https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg" alt="${p.title} trailer">
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
  console.log('  5. git add . && git commit -m "Add 8 pages" && git push');
}

main();
