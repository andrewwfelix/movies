#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Page Generator
 * Generates HTML comparison pages from the PAGES data array.
 * Each entry contains all editorial and mechanical data needed.
 *
 * Usage:
 *   node next_movies.js
 *
 * Outputs all HTML files directly to the current directory.
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------ //
// PAGE DATA
// ------------------------------------------------------------------ //

const PAGES = [
  {
    slug: 'devil-wears-prada',
    title: 'The Devil Wears Prada',
    genre: 'Comedy / Drama',
    author: 'Lauren Weisberger',
    bookYear: '2003',
    director: 'David Frankel',
    filmYear: '2026',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/3NJk1wV',
    image: 'devil-wears-prada.jpg',
    youtubeId: 'e9HXmMnUEdE',
    trailerNote: 'Starring Meryl Streep, Anne Hathaway, Emily Blunt &mdash; In theaters May 1, 2026',
    metaTitle: 'The Devil Wears Prada Book vs Movie 2026: Should You Read First?',
    metaDesc: "Lauren Weisberger's novel vs David Frankel's 2026 sequel film — what the book does that the sequel can't, and why reading first matters.",
    subtitle: 'Book (2003) vs. Movie (2026) &mdash; dir. David Frankel',
    storyBrief: `Andy Sachs is a recent college graduate who lands a job as second assistant to Miranda Priestly, the fearsome editor of Runway magazine. Lauren Weisberger's debut novel — loosely based on her own experience working for Vogue editor Anna Wintour — is a sharp, funny portrait of ambition, identity, and the price of proximity to power. The 2006 film with Meryl Streep and Anne Hathaway became a cultural touchstone. Now, twenty years later, David Frankel and writer Aline Brosh McKenna return with a sequel that reunites the full original cast. The sequel film draws loosely on Weisberger's 2013 follow-up novel Revenge Wears Prada but tells an original story — which makes the question of what to read and in what order more interesting than usual.`,
    differences: [
      {
        heading: "The novel's satirical bite",
        text: `Weisberger's original novel is funnier and sharper than the film it inspired. Her Andy is more morally compromised, more aware of her own complicity, and the satire of fashion industry culture is more sustained and precise. The 2006 film softened the edges to make Andy more sympathetic and Miranda more charismatic. The sequel film inherits those softer edges — it's working with the film's versions of these characters, not the novel's.`
      },
      {
        heading: 'Miranda Priestly on the page vs screen',
        text: `In the novel, Miranda is a monster without redemption — her humanity is glimpsed only in flashes. Meryl Streep made her something more complex: still terrifying, but briefly, devastatingly human. The sequel film leans into Streep's version, which is the right call cinematically but means the film is working from a more generous interpretation than the source material intended.`
      },
      {
        heading: 'The sequel novel vs the sequel film',
        text: `Revenge Wears Prada (2013) follows Andy a decade on, now running a bridal magazine and planning her own wedding, before a collision with Miranda reopens old wounds. The sequel film uses this setup loosely — Andy is back at Runway, Miranda is navigating the collapse of print media — but it's essentially an original story. Readers of the sequel novel will find familiar themes but an unfamiliar plot.`
      },
      {
        heading: "Andy's arc",
        text: `The novel's Andy is ultimately complicit in the world she claims to reject — she takes what Runway gives her and uses it, which is a more honest and less comfortable conclusion than the film's cleaner moral exit. The sequel film, working with an older Andy who chose differently, has more interesting territory to explore — whether she has actually changed or simply moved the same ambitions to a different address.`
      },
      {
        heading: 'The fashion industry as subject',
        text: `Weisberger writes about fashion with the knowledgeable contempt of an insider, and the novel's specific details — the absurdity of the requests, the hierarchies of the sample closet, the particular cruelties of the industry — are richer on the page than on screen. The sequel film updates this to the collapse of print media and the rise of digital fashion, which is fresher territory but less intimately observed.`
      }
    ],
    readFirst: `Read the original novel before seeing the sequel film — not because the film requires it, but because Weisberger's Andy is more interesting than the films' version. The sequel film is working with twenty years of audience affection for characters who have been softened from their literary originals. Read the book to see what was there before the softening. Then watch Meryl Streep do things with Miranda that Weisberger never quite intended, and enjoy both.`,
    verdictBox: `The novel is sharper, funnier, and less forgiving than either film. The sequel has Meryl Streep, which is its own argument. Read the book first, see the 2006 film if you haven't, then watch the sequel with a clear sense of how far both Andy and Miranda have travelled from where Weisberger left them.`,
    related: [
      { href: '/big-little-lies.html', label: 'Big Little Lies' },
      { href: '/gone-girl.html', label: 'Gone Girl' },
      { href: '/wild.html', label: 'Wild' }
    ]
  },
  {
    slug: 'where-the-crawdads-sing',
    title: 'Where the Crawdads Sing',
    genre: 'Mystery / Literary Fiction',
    author: 'Delia Owens',
    bookYear: '2018',
    director: 'Olivia Newman',
    filmYear: '2022',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/3Ol0R0m',
    image: 'where-the-crawdads_sing.jpg',
    youtubeId: 'PY3808Iq0Tg',
    trailerNote: 'Starring Daisy Edgar-Jones, Taylor John Smith &mdash; Film: 2022',
    metaTitle: 'Where the Crawdads Sing: Book vs Movie — Key Differences',
    metaDesc: "Delia Owens' bestselling novel vs Olivia Newman's 2022 film — Kya's marsh, the murder mystery, and why the book's nature writing is irreplaceable.",
    subtitle: 'Book (2018) vs. Movie (2022) &mdash; dir. Olivia Newman',
    storyBrief: `Kya Clark grows up alone in the marshes of North Carolina after her family abandons her one by one. She raises herself, learns to read, becomes an expert naturalist, and falls in love twice — once with a boy who leaves and once with a man who is later found dead. The murder mystery and the coming-of-age story run in parallel, with the marsh itself as the novel's beating heart. Delia Owens' debut novel sold over twelve million copies. Olivia Newman's film adaptation, produced by Reese Witherspoon, is competent and sympathetic — and considerably thinner than the book.`,
    differences: [
      {
        heading: "The marsh as character",
        text: `Owens is a wildlife scientist and it shows — her descriptions of the North Carolina marsh are extraordinarily precise and beautiful. The marsh isn't backdrop; it's the novel's emotional landscape, mirroring Kya's isolation, her resilience, and her way of understanding the world. The film captures the visual beauty of the setting but cannot replicate the intimacy of Owens' prose relationship with the natural world.`
      },
      {
        heading: "Kya's interiority",
        text: `The novel spends years inside Kya's development — her loneliness, her self-education, her intricate understanding of animal behaviour and what it teaches her about human behaviour. Daisy Edgar-Jones gives a committed performance but two hours cannot carry the weight of a childhood rendered in full. The film's Kya is sympathetic; the novel's Kya is fully inhabited.`
      },
      {
        heading: 'The nature writing',
        text: `Owens weaves Kya's scientific observations throughout the novel — firefly behaviour, marsh hawk courtship, the biology of survival. These passages are not decorations; they're arguments about how Kya understands love and abandonment. The film strips most of this out, which is understandable but removes the novel's most distinctive quality.`
      },
      {
        heading: 'The mystery and the ending',
        text: `The novel's resolution is more morally complex than the film's, and the final twist lands harder on the page because Owens has built the case for Kya's innocence with more care. Both versions reach the same destination, but the journey is longer and richer in the novel, which means the arrival means more.`
      },
      {
        heading: 'Jumpin and Mabel',
        text: `The novel gives significant space to Jumpin, the Black shopkeeper who quietly supports Kya across decades, and his wife Mabel. Their relationship with Kya — the only genuine family she has — is deeply moving and carefully drawn. The film includes them but cannot give them the same depth, and their role in Kya's survival is somewhat diminished.`
      }
    ],
    readFirst: `Yes — the film is a serviceable adaptation of the plot but an inadequate adaptation of the experience. The novel's nature writing, Kya's full interiority, and the slow accumulation of years in the marsh are what make it a phenomenon. Read first and the film becomes a companion piece. Watch first and you'll get the story but miss what made twelve million people love it.`,
    verdictBox: `Daisy Edgar-Jones is excellent and the marsh is beautiful on screen — but this is a novel about what it feels like to grow up inside a particular landscape, and that feeling lives on the page. Read the book. See the film if you want to put faces to names. The book is the real thing.`,
    related: [
      { href: '/wild.html', label: 'Wild' },
      { href: '/room.html', label: 'Room' },
      { href: '/kite-runner.html', label: 'The Kite Runner' }
    ]
  },
  {
    slug: 'normal-people',
    title: 'Normal People',
    genre: 'Literary Fiction / Romance',
    author: 'Sally Rooney',
    bookYear: '2018',
    director: 'Lenny Abrahamson & Hettie Macdonald',
    filmYear: '2020',
    verdict: 'tie',
    verdictText: 'Too Close to Call',
    affiliateLink: 'https://amzn.to/4c9vYUH',
    image: 'normail-people.jpg',
    youtubeId: 'x1JQuWxt3cE',
    trailerNote: 'Starring Daisy Edgar-Jones, Paul Mescal &mdash; Hulu/BBC series: 2020',
    metaTitle: 'Normal People: Book vs TV Series — Sally Rooney Adaptation Explained',
    metaDesc: "Sally Rooney's novel vs the Hulu/BBC series — Paul Mescal, Daisy Edgar-Jones, and why this is one of the rare cases where both versions are essential.",
    subtitle: 'Book (2018) vs. TV Series (2020) &mdash; dir. Lenny Abrahamson &amp; Hettie Macdonald',
    storyBrief: `Connell and Marianne grow up in the same small town in Ireland — he's popular, she's an outsider — and fall into a relationship they can't quite name or sustain across the years of their education. Sally Rooney's second novel traces their connection across university, love affairs, illness, and the slow work of becoming adults. The Hulu/BBC series, directed partly by Lenny Abrahamson, stars Paul Mescal and Daisy Edgar-Jones in performances that made both of them stars. This is one of the rare cases where both versions are genuinely essential.`,
    differences: [
      {
        heading: "Rooney's free indirect style",
        text: `Rooney writes in free indirect discourse — moving fluidly between characters' perspectives without signalling the shift — which creates an unusual intimacy. You're inside Connell and Marianne's heads simultaneously, understanding both sides of every misunderstanding as it happens. The series uses close-up photography and restrained performance to achieve something similar, but the experience is different: watching two people fail to communicate is painful in a way that understanding why they're failing is not.`
      },
      {
        heading: "The performances",
        text: `Paul Mescal and Daisy Edgar-Jones give two of the finest performances in recent television. Mescal's Connell is physically present in a way the novel can only gesture at — his discomfort in his own popularity, his gentleness, his inability to say what he means — all rendered through body language and expression in ways that exceed what prose can do. This is the area where the series most clearly surpasses its source.`
      },
      {
        heading: 'The sex scenes',
        text: `Rooney writes about sex frankly and specifically, using physical intimacy as a way to show what Connell and Marianne cannot say to each other. The series handles this with equal frankness, which was controversial but is narratively correct. The intimacy coordinator approach — making the scenes feel genuinely collaborative rather than observed — is one of the series' most significant achievements.`
      },
      {
        heading: "Marianne's family",
        text: `The novel spends more time establishing the specific dynamics of Marianne's abusive home life and how they shape her relationship to pain and intimacy. The series compresses this, which means some of Marianne's behaviour in later episodes is slightly less grounded than it is on the page.`
      },
      {
        heading: 'The ending',
        text: `Both versions end in the same place — Connell leaving for New York, Marianne telling him to go — but the accumulation of the novel means the ending carries more weight. The series builds toward the same moment in twelve episodes; the novel does it in fewer pages but with more interior access. Both endings are devastating. The novel's is slightly more earned.`
      }
    ],
    readFirst: `Either order works — this is genuinely unusual. If you read first, the series gives you Mescal's performance, which adds something the novel cannot provide. If you watch first, the novel gives you the interior dimension that the series, excellent as it is, cannot fully reach. Read the novel. Watch the series. It doesn't much matter which comes first.`,
    verdictBox: `One of the very few cases where both versions are essential and neither is definitively better. Rooney's prose does things Abrahamson's camera cannot, and Abrahamson's camera — specifically trained on Mescal and Edgar-Jones — does things Rooney's prose cannot. Read both. Watch both. Start with whichever you prefer.`,
    related: [
      { href: '/atonement.html', label: 'Atonement' },
      { href: '/never-let-me-go.html', label: 'Never Let Me Go' },
      { href: '/room.html', label: 'Room' }
    ]
  },
  {
    slug: 'pachinko',
    title: 'Pachinko',
    genre: 'Historical Fiction / Family Saga',
    author: 'Min Jin Lee',
    bookYear: '2017',
    director: 'Kogonada & Justin Chon',
    filmYear: '2022',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/3QiwCaV',
    image: 'Pachinko.jpg',
    youtubeId: '5ZPLzTyNptw',
    trailerNote: 'Starring Youn Yuh-jung, Lee Min-ho, Jin Ha &mdash; Apple TV+ series: 2022',
    metaTitle: 'Pachinko: Book vs Apple TV+ Series — Key Differences Explained',
    metaDesc: "Min Jin Lee's multigenerational novel vs the Apple TV+ series — four generations of a Korean family and why the book's scope is irreplaceable.",
    subtitle: 'Book (2017) vs. TV Series (2022) &mdash; dir. Kogonada &amp; Justin Chon',
    storyBrief: `Beginning in early twentieth-century Korea and spanning four generations across Korea and Japan, Pachinko follows a Korean family whose founding act — a young woman's pregnancy by a married man — determines the destinies of her descendants across decades of discrimination, war, and assimilation. Min Jin Lee spent thirty years researching and writing it. The Apple TV+ series, directed by Kogonada and Justin Chon, is visually extraordinary and emotionally gripping. It is also, inevitably, a fraction of the novel.`,
    differences: [
      {
        heading: 'Scope and generational depth',
        text: `The novel covers four generations in full — Sunja, her sons Noa and Mozasu, and her grandson Solomon — each given the space to become a complete character with their own arc. The series, beginning with Season One, focuses primarily on Sunja's early life and Solomon's present-day story, compressing the middle generations significantly. What the novel does across five hundred pages in giving each generation equal weight is simply not possible in eight episodes.`
      },
      {
        heading: 'Noa',
        text: `In the novel, Sunja's eldest son Noa is one of the most heartbreaking characters in recent fiction — a man who tries to escape his Korean identity through assimilation into Japanese society and is ultimately destroyed by it. His arc is among the novel's most sustained and devastating achievements. The series has not yet given Noa the full treatment the novel provides, and his story is the one whose loss is most felt.`
      },
      {
        heading: 'The historical texture',
        text: `Lee's research is extraordinary — the specific details of Korean life in Japan, the pachinko industry, the social hierarchies of the zainichi Korean community — and this texture permeates every page of the novel. The series captures the visual dimension of this world beautifully but the prose gives you the interior experience of discrimination in a way that images cannot fully match.`
      },
      {
        heading: 'The series\' visual achievement',
        text: `Kogonada shoots the series with extraordinary beauty — the colour palette, the period recreation, the way past and present are visually distinguished — and Youn Yuh-jung as the older Sunja is one of the great performances in recent television. The series does things the novel cannot: it shows you this world rather than describing it.`
      },
      {
        heading: 'The parallel timelines',
        text: `The series structures itself around parallel editing between Sunja's past and Solomon's present, which is a departure from the novel's largely chronological approach. This works as a television device — it creates immediate dramatic irony — but it also means the series feels less like a family saga and more like a two-character story with supporting history.`
      }
    ],
    readFirst: `Yes — and this is a case where reading first will significantly deepen your experience of the series. The novel's generational scope is what makes Pachinko extraordinary, and understanding the full weight of what each generation carries makes the series' scenes more resonant. Read it first. The series is beautiful. The novel is one of the best of the decade.`,
    verdictBox: `The Apple TV+ series is one of the finest literary adaptations in recent streaming history — and it's still a fraction of what Min Jin Lee built. Read the novel first, then watch the series as a companion piece. The book's scope is irreplaceable. The series' visuals are unmatchable. Both belong in your life.`,
    related: [
      { href: '/kite-runner.html', label: 'The Kite Runner' },
      { href: '/never-let-me-go.html', label: 'Never Let Me Go' },
      { href: '/atonement.html', label: 'Atonement' }
    ]
  },
  {
    slug: 'the-road',
    title: 'The Road',
    genre: 'Literary Fiction / Post-Apocalyptic',
    author: 'Cormac McCarthy',
    bookYear: '2006',
    director: 'John Hillcoat',
    filmYear: '2009',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/41h94pk',
    image: 'the-road.jpg',
    youtubeId: 'bO8EqMsxOiU',
    trailerNote: 'Starring Viggo Mortensen, Kodi Smit-McPhee &mdash; Film: 2009',
    metaTitle: 'The Road: Book vs Movie — Cormac McCarthy vs John Hillcoat',
    metaDesc: "Cormac McCarthy's Pulitzer Prize-winning novel vs John Hillcoat's 2009 film — the father, the boy, the fire, and why the prose is the whole point.",
    subtitle: 'Book (2006) vs. Movie (2009) &mdash; dir. John Hillcoat',
    storyBrief: `A father and his young son walk south through a post-apocalyptic America, pushing a shopping cart through ash-grey landscapes, trying to stay warm and alive and human. No names. No explanation of what happened. No hope that is not provisional. Cormac McCarthy won the Pulitzer Prize for The Road in 2007. John Hillcoat's film, with Viggo Mortensen and Kodi Smit-McPhee, is the most faithful possible adaptation of a novel that is ultimately unfilmable — not because of its content but because of its prose.`,
    differences: [
      {
        heading: "McCarthy's prose",
        text: `The Road is written in a stripped, punctuation-bare style — no quotation marks, minimal commas, sentences that drop away mid-thought — that enacts the novel's world at the level of language. The degradation of syntax mirrors the degradation of civilisation. This cannot be filmed. What survives translation is the story and the emotion; what is lost is the experience of reading sentences that feel like walking through ash.`
      },
      {
        heading: 'The father\'s interiority',
        text: `Much of the novel lives inside the father's mind — his memories of his wife, his calculations about survival, his oscillation between despair and the animal determination to keep the boy alive. Viggo Mortensen carries this in performance, and carries it well, but the film can only show the surface. The novel gives you the father's interior monologue, which is the book's most devastating dimension.`
      },
      {
        heading: 'The wife',
        text: `In the novel, the mother appears in memory — her decision to leave rather than face what is coming is presented without judgment but with enormous complexity. The film expands her role slightly with Charlize Theron in flashbacks, making her more present and more explicitly characterised. The novel's version is more haunting for being less explained.`
      },
      {
        heading: 'The ending',
        text: `The novel's ending is among the most debated in contemporary fiction — quietly hopeful or quietly devastating depending on how you read it. The film resolves it more explicitly and warmly, which softens the ambiguity that McCarthy clearly intended. The novel's final image is more powerful for being more uncertain.`
      },
      {
        heading: 'The landscape',
        text: `Hillcoat shoots the post-apocalyptic landscape with real bleakness — grey skies, dead forests, ash-covered roads — and it is genuinely oppressive. This is one area where the film delivers something the novel describes but cannot show. The visual realisation of McCarthy's world is Hillcoat's strongest contribution.`
      }
    ],
    readFirst: `Yes — and this is not a close call. The Road is a novel about its own prose. Reading it is a physical experience in a way that few novels achieve; the style enacts the content at every level. Watch the film after and appreciate what Mortensen does with very little. But the book is the irreplaceable thing.`,
    verdictBox: `Hillcoat's film is as faithful an adaptation as could be made and still considerably lesser than the source. McCarthy's prose is the whole point — it's not decorative, it's structural. The film gives you the story. The book gives you the experience. There is no comparison.`,
    related: [
      { href: '/no-country-for-old-men.html', label: 'No Country for Old Men' },
      { href: '/never-let-me-go.html', label: 'Never Let Me Go' },
      { href: '/dune.html', label: 'Dune' }
    ]
  },
  {
    slug: 'one-flew-over-the-cuckoos-nest',
    title: "One Flew Over the Cuckoo's Nest",
    genre: 'Literary Fiction / Drama',
    author: 'Ken Kesey',
    bookYear: '1962',
    director: 'Miloš Forman',
    filmYear: '1975',
    verdict: 'tie',
    verdictText: 'Too Close to Call',
    affiliateLink: 'https://amzn.to/4sdzVh4',
    image: 'one-flew-over-the-cuckoos-next.jpg',
    youtubeId: 'OXrcDonY-B8',
    trailerNote: 'Starring Jack Nicholson, Louise Fletcher &mdash; Film: 1975',
    metaTitle: "One Flew Over the Cuckoo's Nest: Book vs Movie Explained",
    metaDesc: "Ken Kesey's 1962 novel vs Miloš Forman's 1975 film — Chief Bromden's narration, Nurse Ratched, and one of the great book-to-film debates.",
    subtitle: 'Book (1962) vs. Movie (1975) &mdash; dir. Milo&scaron; Forman',
    storyBrief: `Randle Patrick McMurphy fakes insanity to serve his prison sentence in a psychiatric ward rather than on a work farm, and immediately begins disrupting the rigid order maintained by Nurse Ratched. Ken Kesey's novel is narrated by Chief Bromden, a half-Native American patient who pretends to be deaf and mute and sees the ward as a metaphor for the oppressive machinery of American society. Miloš Forman's film won five Academy Awards including Best Picture — and, controversially, shifted the narration away from Chief Bromden entirely. Both are masterworks. The debate about which is better has been running for fifty years.`,
    differences: [
      {
        heading: "Chief Bromden's narration",
        text: `This is the adaptation's most significant and most controversial change. Kesey's novel is narrated entirely by Bromden — his hallucinations, his fog, his slow return to himself through McMurphy's influence are the novel's moral and structural centre. The film shifts to a conventional third-person perspective, which makes it a story about McMurphy rather than about what McMurphy does to Bromden. Kesey hated the adaptation partly for this reason. He has a point.`
      },
      {
        heading: 'Nurse Ratched',
        text: `Louise Fletcher won the Oscar and created one of cinema's great villains — cold, controlled, institutional. Kesey's Nurse Ratched is more overtly sexual in her menace, her power over the ward more explicitly tied to emasculation and conformity. The film's version is subtler and more plausibly bureaucratic. Both are terrifying; they're terrifying in different ways.`
      },
      {
        heading: "McMurphy",
        text: `Jack Nicholson is so definitive in the role that it's difficult to read the novel without hearing his voice. But Kesey's McMurphy is filtered through Bromden's perception — he's partly a projection, a mythic figure as much as a man. The film's McMurphy is more literal and therefore more human, which is both the film's strength and its loss.`
      },
      {
        heading: 'The ward as metaphor',
        text: `Kesey wrote the novel as a counter-culture critique of conformity and institutional power — the Combine, as Bromden calls it, is America itself. The film preserves the critique but strips the metaphysical dimension. Forman's ward is a specific place with specific people; Kesey's ward is a machine for producing compliance.`
      },
      {
        heading: 'The ending',
        text: `Both versions end the same way — McMurphy lobotomised, Bromden suffocating him and escaping through the window. The film earns its ending through performance. The novel earns it through a hundred pages of Bromden's slowly clearing fog. Both are devastating. The novel's is more hard-won.`
      }
    ],
    readFirst: `Yes — read first specifically to get Bromden's narration before the film takes it away from you. Once you've seen Nicholson you'll struggle to hear any other McMurphy; reading first gives you Kesey's version before Nicholson's overwrites it. Both are essential. The sequence matters.`,
    verdictBox: `One of the genuinely great book-to-film debates. Forman made a masterpiece by removing the thing that makes Kesey's novel a masterpiece — Chief Bromden's narrating consciousness. Both versions are required reading and viewing. Start with the novel. Bromden deserves to be heard first.`,
    related: [
      { href: '/the-shining.html', label: 'The Shining' },
      { href: '/no-country-for-old-men.html', label: 'No Country for Old Men' },
      { href: '/the-road.html', label: 'The Road' }
    ]
  },
  {
    slug: 'beloved',
    title: 'Beloved',
    genre: 'Literary Fiction / Historical',
    author: 'Toni Morrison',
    bookYear: '1987',
    director: 'Jonathan Demme',
    filmYear: '1998',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4m7e0a1',
    image: 'beloved.jpg',
    youtubeId: 'RAsnKghD2uw',
    trailerNote: 'Starring Oprah Winfrey, Danny Glover &mdash; Film: 1998',
    metaTitle: "Beloved: Book vs Movie — Toni Morrison vs Jonathan Demme",
    metaDesc: "Toni Morrison's Pulitzer Prize-winning novel vs Jonathan Demme's 1998 film — why Morrison's prose is the whole work and what the film couldn't carry.",
    subtitle: 'Book (1987) vs. Movie (1998) &mdash; dir. Jonathan Demme',
    storyBrief: `Sethe, a formerly enslaved woman living in post-Civil War Ohio, is haunted by the ghost of the baby daughter she killed rather than allow to be taken back into slavery. When a young woman calling herself Beloved appears at her door, the past Sethe has tried to contain begins to overwhelm the present. Toni Morrison's Pulitzer Prize-winning novel is widely considered one of the greatest American novels of the twentieth century. Jonathan Demme's 1998 film, with Oprah Winfrey producing and starring, was a passion project a decade in the making — and a critical disappointment that has been partially rehabilitated in the years since.`,
    differences: [
      {
        heading: "Morrison's prose",
        text: `Beloved is written in a style that enacts trauma — non-linear, circling, returning to the same events from different angles, withholding and revealing in the rhythm of memory rather than narrative. The novel's famous stream of consciousness passage — Beloved's interior monologue without punctuation — is one of the most formally ambitious sequences in American literature. None of this survives translation to a conventional narrative film.`
      },
      {
        heading: 'The supernatural',
        text: `Morrison's Beloved operates simultaneously as ghost story, psychological study, and historical allegory. The supernatural element is real and metaphorical at once — the ghost is Sethe's daughter and also the embodied weight of slavery's violence. The film literalises this more heavily, which resolves the productive ambiguity that Morrison carefully maintains.`
      },
      {
        heading: "Oprah Winfrey's performance",
        text: `Winfrey gives a committed and physically demanding performance, and her emotional connection to the material is evident throughout. But Sethe on the page is filtered through Morrison's prose — her interiority is the novel's substance. On screen, Sethe must be shown rather than known, which flattens the character's most complex interior dimensions.`
      },
      {
        heading: 'The community',
        text: `Morrison builds a vivid portrait of the Black community in Ohio surrounding Sethe — their distance from her, their eventual return to help exorcise Beloved. The film preserves the plot of this but the novel gives the community the interior depth that makes their eventual solidarity feel genuinely earned and historically resonant.`
      },
      {
        heading: 'Running time and pacing',
        text: `At three hours, the film is long but still inadequate to the novel's scope. The pacing is uneven in ways the novel is not — some sequences feel rushed, others laboured. The film was poorly received on release partly because audiences weren't ready for its demands; it has aged better than its box office suggested. But the novel's demands are more precisely calibrated.`
      }
    ],
    readFirst: `Yes — emphatically. Beloved is a novel about the experience of reading it; its style is inseparable from its meaning. The film is earnest and historically important, but it's working from a novel that was always going to resist adaptation. Read the book. See the film as a companion. Understand that some novels exist in a medium they cannot leave.`,
    verdictBox: `Morrison wrote a novel that cannot be adapted without losing what makes it what it is. Demme made the most faithful film that could be made, and it's still a considerable distance from the source. Read the book. The film is worth seeing. But the novel is one of the great works of American literature and the film is not.`,
    related: [
      { href: '/the-road.html', label: 'The Road' },
      { href: '/kite-runner.html', label: 'The Kite Runner' },
      { href: '/never-let-me-go.html', label: 'Never Let Me Go' }
    ]
  },
  {
    slug: 'frankenstein',
    title: 'Frankenstein',
    genre: 'Gothic Fiction / Horror',
    author: 'Mary Shelley',
    bookYear: '1818',
    director: 'Guillermo del Toro',
    filmYear: '2025',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4sMTnlN',
    image: 'frankenstein.jpg',
    youtubeId: 'x--N03NO130',
    trailerNote: 'Starring Oscar Isaac, Jacob Elordi &mdash; Netflix: 2025',
    metaTitle: "Frankenstein: Book vs Movie — Mary Shelley vs del Toro",
    metaDesc: "Mary Shelley's 1818 novel vs Guillermo del Toro's Netflix adaptation — the creature's eloquence, Victor's guilt, and 200 years of adaptation history.",
    subtitle: 'Book (1818) vs. Movie (2025) &mdash; dir. Guillermo del Toro',
    storyBrief: `Victor Frankenstein, a young scientist obsessed with conquering death, creates a living being from dead matter and immediately abandons it in horror. The creature — eloquent, sensitive, desperate for connection — turns to violence only after society's rejection makes it inevitable. Mary Shelley wrote the novel at nineteen, in a contest with Percy Shelley and Lord Byron at Lake Geneva. It is the founding text of science fiction and one of the most philosophically rich novels in English literature. Guillermo del Toro's Netflix adaptation, with Oscar Isaac and Jacob Elordi, is the most faithful attempt in a century of attempts.`,
    differences: [
      {
        heading: "The creature's eloquence",
        text: `Shelley's creature is one of literature's most articulate characters — his account of his own development, his reading of Paradise Lost, his philosophical arguments with Victor, his devastating analysis of why he was made to suffer are central to the novel's argument. Most adaptations have made the creature mute or minimally verbal. Del Toro restores the creature's voice, which is the adaptation's most significant and correct choice.`
      },
      {
        heading: "The frame narrative",
        text: `The novel is structured as letters from an Arctic explorer who rescues Victor and transcribes his story — which itself contains the creature's first-person account. This nested structure creates moral complexity: we receive the creature's perspective through Victor's transcription, filtered through Walton's letters. Most films flatten this to a single perspective. Del Toro simplifies but retains more of the original architecture than most.`
      },
      {
        heading: "Victor's culpability",
        text: `Shelley is unambiguous: Victor is the monster of his own novel. His abandonment of the creature, his refusal to take responsibility, his self-pity throughout are presented without sympathy. Most adaptations soften Victor into a tragic hero. Del Toro's version restores more of Shelley's critique of Victor's narcissism, which is the novel's central argument.`
      },
      {
        heading: 'The female characters',
        text: `Shelley's female characters — Elizabeth, Justine, Safie — are largely passive in the plot but their treatment is part of the novel's feminist critique: women are the creatures of a world made by men and suffer for it. Del Toro expands the female roles, which brings the adaptation into conversation with contemporary concerns but departs from Shelley's more oblique approach.`
      },
      {
        heading: 'Del Toro\'s visual language',
        text: `Del Toro is the ideal director for this material — his visual sensibility, his sympathy for monsters, his interest in the beauty of the grotesque all suit Shelley's themes. The creature design and the Gothic atmosphere are extraordinary. This is an area where the film does something the novel describes but cannot show.`
      }
    ],
    readFirst: `Yes — and this is particularly important for Frankenstein because two centuries of cultural mythology have accumulated around the novel. Most people think they know the story. They know the Boris Karloff version, which is not Shelley's creature. Read the novel and meet the real Frankenstein's monster: articulate, philosophical, and more right than wrong about what Victor did to him.`,
    verdictBox: `Del Toro has made the most faithful Frankenstein adaptation in cinema history and it's still a lesser work than a novel written by a teenager in 1818. Shelley's creature is irreplaceable on the page. See the film — del Toro earns his adaptation — but read the novel first and meet the creature Shelley actually created.`,
    related: [
      { href: '/the-shining.html', label: 'The Shining' },
      { href: '/wuthering-heights.html', label: 'Wuthering Heights' },
      { href: '/never-let-me-go.html', label: 'Never Let Me Go' }
    ]
  },
  {
    slug: 'schindlers-list',
    title: "Schindler's List",
    genre: 'Historical Fiction / Drama',
    author: 'Thomas Keneally',
    bookYear: '1982',
    director: 'Steven Spielberg',
    filmYear: '1993',
    verdict: 'film',
    verdictText: 'Screen Wins',
    affiliateLink: 'https://amzn.to/3PS76t2',
    image: 'schindlers-list.jpg',
    youtubeId: 'mxphAlJID9U',
    trailerNote: 'Starring Liam Neeson, Ben Kingsley, Ralph Fiennes &mdash; Film: 1993',
    metaTitle: "Schindler's List: Book vs Movie — One of the Rare Times the Film Wins",
    metaDesc: "Thomas Keneally's novel vs Spielberg's 1993 masterpiece — why this is one of the rare cases where the film surpasses its source material.",
    subtitle: "Book (1982) vs. Movie (1993) &mdash; dir. Steven Spielberg",
    storyBrief: `Oskar Schindler, a German industrialist and Nazi party member, arrives in Kraków at the start of World War II to profit from the war and ends it having spent his entire fortune saving the lives of over a thousand Jewish workers. Thomas Keneally's novel — written as narrative non-fiction, blurring the line between history and fiction — won the Booker Prize in 1982. Steven Spielberg's film won seven Academy Awards including Best Picture and is widely considered one of the greatest films ever made. This is one of the very few entries on this site where the film wins outright.`,
    differences: [
      {
        heading: 'Documentary vs narrative',
        text: `Keneally wrote the book as "a novel" but in a documentary style — gathering testimony, blending composite characters, working from historical record. The result is authoritative but somewhat distanced; the book reads like richly written history rather than emotionally immediate fiction. Spielberg translates this material into direct narrative cinema, and the emotional impact is considerably more powerful.`
      },
      {
        heading: 'Amon Göth',
        text: `Ralph Fiennes' performance as the SS commandant Amon Göth is one of the great screen villains — charming, sadistic, delusional, capable of brief self-awareness that makes him more terrifying rather than less. Keneally's Göth is well-drawn but more clinical. The film's Göth is the film's most remarkable achievement, and it's an achievement that belongs entirely to cinema.`
      },
      {
        heading: "Schindler's transformation",
        text: `Keneally presents Schindler's transformation from opportunist to saviour with appropriate historical caution — he doesn't fully explain it because no one fully understood it, including Schindler. Spielberg dramatises the transformation more explicitly, particularly in the iconic scene where Schindler watches the liquidation of the Kraków ghetto. This is one of those rare cases where dramatisation deepens rather than simplifies.`
      },
      {
        heading: 'Black and white photography',
        text: `Spielberg shot in black and white — a decision that distances the film from the present and anchors it in the visual language of historical documentation. The girl in the red coat, the only colour in the film until the ending, is one of cinema's most powerful images. No prose passage in the novel achieves what that image achieves.`
      },
      {
        heading: 'Itzhak Stern',
        text: `Ben Kingsley's Itzhak Stern is a composite character — the film condenses several historical figures into one — and Kingsley makes him the moral conscience of the film, the witness to Schindler's transformation. Keneally's more historically accurate account distributes this role across several characters, which is correct but less cinematically powerful.`
      }
    ],
    readFirst: `For once, no — watch the film first. Spielberg's film is the more powerful and immediate experience, and it's the version that most people should encounter first. Read Keneally's book afterward as a historical companion piece — it adds detail, context, and historical grounding that the film necessarily simplifies. But the film is the destination here.`,
    verdictBox: `One of the very few times on this site the film wins without qualification. Spielberg made something that transcends its source — not because Keneally's book is poor, but because cinema can do certain things with this material that prose cannot. See the film. Read the book for the history. The film is the masterpiece.`,
    related: [
      { href: '/kite-runner.html', label: 'The Kite Runner' },
      { href: '/beloved.html', label: 'Beloved' },
      { href: '/no-country-for-old-men.html', label: 'No Country for Old Men' }
    ]
  },
  {
    slug: 'lonesome-dove',
    title: 'Lonesome Dove',
    genre: 'Western / Epic',
    author: 'Larry McMurtry',
    bookYear: '1985',
    director: 'Simon Wincer',
    filmYear: '1989',
    verdict: 'book',
    verdictText: 'Book Wins',
    affiliateLink: 'https://amzn.to/4e0XAOc',
    image: 'lonesome-dove.jpg',
    youtubeId: 'g1Xq4lYcHLw',
    trailerNote: 'Starring Robert Duvall, Tommy Lee Jones &mdash; TV miniseries: 1989',
    metaTitle: "Lonesome Dove: Book vs Miniseries — McMurtry's Epic Explained",
    metaDesc: "Larry McMurtry's Pulitzer Prize-winning novel vs the beloved 1989 TV miniseries — Gus, Call, and the cattle drive that became American mythology.",
    subtitle: 'Book (1985) vs. TV Miniseries (1989) &mdash; dir. Simon Wincer',
    storyBrief: `Augustus McCrae and Woodrow Call, two aging Texas Rangers, lead a cattle drive from the Rio Grande to Montana in the 1870s. Larry McMurtry's Pulitzer Prize-winning novel is eight hundred pages of American mythology — funny, violent, elegiac, and populated with characters so fully realised they seem to have existed before the novel and to continue after it. Simon Wincer's 1989 CBS miniseries, with Robert Duvall and Tommy Lee Jones, is one of the finest television adaptations ever made of a major American novel. The debate about which is better is the best kind — the kind where both sides are right.`,
    differences: [
      {
        heading: "Gus McCrae",
        text: `Robert Duvall's Gus is a performance for the ages — garrulous, philosophical, brave, infuriating, and entirely loveable. McMurtry's Gus is all of that but also stranger and more interior — his meditations on what he has lived and failed to live are richer on the page than any performance could fully capture. Duvall is the best possible Gus. McMurtry's Gus is still more.`
      },
      {
        heading: 'The supporting cast',
        text: `McMurtry populates his novel with dozens of fully realised characters — Elmira, July Johnson, Blue Duck, Dish Boggett, the incomparable Bolivar — each given enough space to become complete. The miniseries, at nearly seven hours, preserves more of these characters than any theatrical film could, but even seven hours cannot carry eight hundred pages. Some characters are compressed; a few are lost.`
      },
      {
        heading: 'The landscape',
        text: `McMurtry writes the American West with the authority of someone who knows it — the specific beauty and brutality of the landscape, the light in Texas and the cold in Montana, the way the land shapes the people who cross it. The miniseries was shot on location and captures the visual grandeur. But McMurtry\'s prose gives you the landscape from the inside.`
      },
      {
        heading: "Woodrow Call",
        text: `Tommy Lee Jones plays Call as a man of almost pathological reticence, and it works. But McMurtry's Call is stranger — a man so armoured against feeling that he cannot recognise his own son, whose one act of tenderness is directed toward a corpse. The novel has more room to establish the specific shape of Call's damage. The miniseries suggests it; the novel shows it from inside.`
      },
      {
        heading: 'The ending',
        text: `Both versions end with the same extraordinary image — Call carrying Gus's body back to Texas across the continent, a journey that makes no practical sense and complete human sense. The miniseries earns this through Duvall and Jones. The novel earns it through eight hundred pages. Both endings are devastating. The novel's is more devastatingly earned.`
      }
    ],
    readFirst: `Read first — but with the understanding that the miniseries is exceptional and you should watch it too. At seven hours it's the most faithful long-form television adaptation of a major novel you're likely to find. But McMurtry wrote eight hundred pages for a reason, and every page earns its place. Read first. Watch after. Gus McCrae deserves both.`,
    verdictBox: `McMurtry wrote one of the great American novels and Wincer made one of the great American television adaptations. Neither replaces the other — they're companion pieces that illuminate each other. The book is richer. The miniseries has Duvall. Start with the book. Finish with the miniseries. Mourn Gus twice.`,
    related: [
      { href: '/no-country-for-old-men.html', label: 'No Country for Old Men' },
      { href: '/the-road.html', label: 'The Road' },
      { href: '/dune.html', label: 'Dune' }
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
    "reviewBody": "${p.verdictBox.replace(/"/g, '\\"')}",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "${p.verdict === 'book' ? '5' : p.verdict === 'tie' ? '4' : '3'}",
      "bestRating": "5",
      "worstRating": "3"
    },
    "author": {
      "@type": "Organization",
      "name": "BooksVersusMovies.com"
    },
    "itemReviewed": {
      "@type": "Book",
      "name": "${p.title}",
      "author": {
        "@type": "Person",
        "name": "${p.author}"
      },
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
          <img src="https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg" alt="${p.title} ${p.filmYear} film dir. ${p.director} official trailer">
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
  console.log('  1. Run node script_update_sitemap.js');
  console.log('  2. Run node script_update_index.js');
  console.log('  3. Add book cover images to /images/');
  console.log('  4. Commit and push to deploy');
}

main();
