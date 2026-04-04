#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Page Generator (Batch 2)
 * The 10 titles built and ready to deploy:
 *   1. The Remains of the Day
 *   2. Brooklyn
 *   3. The English Patient
 *   4. Cold Mountain
 *   5. The Hours
 *   6. The Talented Mr. Ripley
 *   7. Misery
 *   8. The Silence of the Lambs
 *   9. Jurassic Park
 *  10. The Firm
 *
 * Usage:
 *   node next_movies_batch_2.js
 *
 * Run from /next_movies/ subfolder.
 * Outputs HTML files to current directory.
 * Then: QA, move to root, run sitemap + index scripts.
 */

const fs = require('fs');
const path = require('path');

const PAGES = [
  {
    "slug": "remains-of-the-day",
    "title": "The Remains of the Day",
    "genre": "Literary Fiction / Drama",
    "author": "Kazuo Ishiguro",
    "bookYear": "1989",
    "director": "James Ivory",
    "filmYear": "1993",
    "verdict": "book",
    "verdictText": "Book Wins",
    "affiliateLink": "https://amzn.to/4894bm0",
    "image": "remains-of-the-day.jpg",
    "youtubeId": "jALmEb72beg",
    "trailerNote": "Starring Anthony Hopkins, Emma Thompson &mdash; Film: 1993",
    "metaTitle": "The Remains of the Day: Book vs Movie — Ishiguro vs James Ivory",
    "metaDesc": "Kazuo Ishiguro's Booker Prize-winning novel vs James Ivory's 1993 film — Stevens's repression, the English butler, and what the book does that Hopkins cannot.",
    "subtitle": "Book (1989) vs. Movie (1993) &mdash; dir. James Ivory",
    "storyBrief": "Stevens is the perfect English butler — devoted, dignified, self-effacing to the point of self-erasure. As he drives across England in the 1950s to visit a former colleague, he recalls his years serving Lord Darlington and confronts, gradually and obliquely, the cost of a life lived entirely in service to others. Kazuo Ishiguro's Booker Prize-winning novel is a masterpiece of unreliable narration — Stevens tells us everything except what matters, and what he withholds is the whole point. James Ivory's film, with Anthony Hopkins and Emma Thompson, is one of the finest literary adaptations in British cinema. It's still not the novel.",
    "differences": [
      {
        "heading": "Stevens's unreliable narration",
        "text": "The novel's entire architecture rests on Stevens narrating his own emotional catastrophe without recognising it. He describes his feelings precisely and completely fails to understand them. Ishiguro sustains this for over two hundred pages with extraordinary control — the reader understands everything Stevens doesn't, and the gap is where the tragedy lives. Hopkins performs repression magnificently, but the film can only show the outside of Stevens. The novel shows you the inside, which is the terrible thing."
      },
      {
        "heading": "Miss Kenton",
        "text": "Emma Thompson's Miss Kenton is the finest performance in the film — her frustration, her feeling, her slow understanding that Stevens will never let himself be known. The novel's Miss Kenton is rendered entirely through Stevens's partial and evasive account of her, which makes her more mysterious and more heartbreaking. The film makes her more present and more clearly in love, which is warmer but slightly reduces the ambiguity that Ishiguro carefully maintains."
      },
      {
        "heading": "Lord Darlington's politics",
        "text": "The novel spends considerable time on Lord Darlington's sympathy for Nazi Germany in the 1930s and Stevens's complicity in his employer's errors. Ishiguro is interested in how a man devoted to dignity can serve a cause that is beneath it. The film compresses this political dimension, which simplifies the novel's central argument about the moral cost of self-abnegation."
      },
      {
        "heading": "The English landscape",
        "text": "The film's great visual achievement is its rendering of the English countryside — the drive through a Britain that is beautiful and slightly melancholy, matching Stevens's internal register perfectly. Ivory and cinematographer Tony Pierce-Roberts give you the England that Stevens has devoted his life to serving without ever quite seeing."
      },
      {
        "heading": "The ending",
        "text": "Both versions end with Stevens on a pier watching the sunset, acknowledging in the most oblique possible terms what he has lost. The novel's Stevens is more articulate about his own evasiveness — his final sentences are among the most devastating in English literature. The film's ending is quieter and relies entirely on Hopkins's face. Both work. The novel works more."
      }
    ],
    "readFirst": "Yes — and this is one of the cases where reading first will most transform your experience of the film. Ishiguro's narration is everything; without it, the film is a beautifully made story about repression. With it, the film becomes a meditation on what performance costs the performer. Read the novel and then watch Hopkins do the same thing that Stevens does: hide everything in plain sight.",
    "verdictBox": "Ivory made one of British cinema's great literary adaptations and it's still considerably lesser than Ishiguro's novel. The book is a technical and emotional achievement that cannot be filmed — its meaning lives in what the narrator refuses to say. See the film for Hopkins. Read the novel for everything else.",
    "related": [
      {
        "href": "/never-let-me-go.html",
        "label": "Never Let Me Go"
      },
      {
        "href": "/atonement.html",
        "label": "Atonement"
      },
      {
        "href": "/the-hours.html",
        "label": "The Hours"
      }
    ]
  },
  {
    "slug": "brooklyn",
    "title": "Brooklyn",
    "genre": "Literary Fiction / Romance",
    "author": "Colm Tóibín",
    "bookYear": "2009",
    "director": "John Crowley",
    "filmYear": "2015",
    "verdict": "book",
    "verdictText": "Book Wins",
    "affiliateLink": "https://amzn.to/3PFRXuZ",
    "image": "brooklyn.jpg",
    "youtubeId": "15syDwC000k",
    "trailerNote": "Starring Saoirse Ronan, Domhnall Gleeson &mdash; Film: 2015",
    "metaTitle": "Brooklyn: Book vs Movie — Tóibín vs John Crowley",
    "metaDesc": "Colm Tóibín's novel vs the 2015 Saoirse Ronan film — Eilis's interiority, homesickness, and why the book's restraint is its greatest achievement.",
    "subtitle": "Book (2009) vs. Movie (2015) &mdash; dir. John Crowley",
    "storyBrief": "Eilis Lacey leaves Ireland for Brooklyn in the early 1950s, homesick and adrift, until she finds her footing, falls in love, and begins to build a life. Then Ireland calls her back, and she must choose between the person she was and the person she has become. Colm Tóibín's novel is written in a prose of extraordinary restraint — nothing is announced, everything is felt. John Crowley's film won three Academy Award nominations and made Saoirse Ronan a star. It's a beautiful, faithful adaptation of a novel that is finally untranslatable.",
    "differences": [
      {
        "heading": "Tóibín's prose restraint",
        "text": "Tóibín writes Eilis's interiority through almost entirely external description — what she sees, what she eats, what she wears — and the emotional weight accumulates beneath the surface of the prose. This technique is related to Ishiguro's in The Remains of the Day: the feeling is present, the articulation is withheld. The film necessarily makes Eilis's emotion more visible, which is warmer but somewhat reduces the distinctive quality of Tóibín's method."
      },
      {
        "heading": "Saoirse Ronan",
        "text": "Ronan was nominated for an Academy Award and the nomination was deserved. Her Eilis is observant, contained, quietly luminous — she performs interiority without narrating it. This is a case where the lead performance does real work that the film's script cannot, and where the gap between novel and film is partly bridged by what an exceptional actor can do with a face."
      },
      {
        "heading": "Ireland vs Brooklyn",
        "text": "The novel gives both worlds equal weight — the specific texture of Enniscorthy, its social hierarchies and limitations, is as fully rendered as Brooklyn. The film is beautiful in both settings but slightly favours Brooklyn as the aspirational space. The novel is more genuinely ambivalent about which world is better, which is what makes Eilis's choice so difficult."
      },
      {
        "heading": "The love story",
        "text": "Tony (Domhnall Gleeson) is warm and charming in the film, and the romance is convincing. The novel's Tony is slightly more ordinary and less immediately appealing, which is important — Eilis's love for him is a choice, not an inevitability, and the choice is what matters."
      },
      {
        "heading": "The ending",
        "text": "Both versions end with Eilis on a boat back to Brooklyn, the choice made. The novel's ending is more abrupt and more ambiguous. The film is slightly warmer in its conclusion. Both are satisfying. The novel's is truer to the difficulty of what Eilis has done."
      }
    ],
    "readFirst": "Yes — Tóibín's prose is the experience, and no film can replicate it. Read first and the film becomes a companion: Ronan doing the work of the prose with her face.",
    "verdictBox": "Crowley made a beautiful, faithful film that Tóibín himself has praised. It's still a lesser work than the novel, because the novel's meaning lives in the gap between what Eilis feels and what she says. Read the book. See the film for Ronan.",
    "related": [
      {
        "href": "/remains-of-the-day.html",
        "label": "The Remains of the Day"
      },
      {
        "href": "/normal-people.html",
        "label": "Normal People"
      },
      {
        "href": "/atonement.html",
        "label": "Atonement"
      }
    ]
  },
  {
    "slug": "english-patient",
    "title": "The English Patient",
    "genre": "Literary Fiction / War",
    "author": "Michael Ondaatje",
    "bookYear": "1992",
    "director": "Anthony Minghella",
    "filmYear": "1996",
    "verdict": "tie",
    "verdictText": "Too Close to Call",
    "affiliateLink": "https://amzn.to/41Jz24X",
    "image": "english-patient.jpg",
    "youtubeId": "Xk_LRcOFT0c",
    "trailerNote": "Starring Ralph Fiennes, Kristin Scott Thomas, Juliette Binoche &mdash; Film: 1996",
    "metaTitle": "The English Patient: Book vs Movie — Ondaatje vs Minghella",
    "metaDesc": "Michael Ondaatje's Booker Prize-winning novel vs Minghella's 1996 film — Count Almásy, the desert, and one of the great book-to-film debates.",
    "subtitle": "Book (1992) vs. Movie (1996) &mdash; dir. Anthony Minghella",
    "storyBrief": "A badly burned man — the English patient — lies dying in a ruined Italian villa at the end of World War II. A Canadian nurse stays to care for him, and their time together is interwoven with his memories of the North African desert, of a doomed love affair, and of the choices that led to everything being destroyed. Michael Ondaatje's Booker Prize-winning novel is a mosaic of voices, geographies, and timelines. Anthony Minghella's film won nine Academy Awards including Best Picture. This is one of the genuinely contested cases where both versions make strong claims.",
    "differences": [
      {
        "heading": "Ondaatje's prose poetry",
        "text": "The novel is written in a style closer to poetry than conventional fiction — fragmentary, image-laden, non-linear. Minghella straightens the timeline and focuses the narrative, which makes the film more immediately comprehensible but loses the hallucinatory quality of Ondaatje's prose. The novel works the way memory works; the film works the way a film works."
      },
      {
        "heading": "Kip's story",
        "text": "In the novel, Kip — a Sikh bomb disposal expert — is a major character with his own substantial arc and a shattering final scene involving the atomic bomb that is among Ondaatje's most powerful pages. The film reduces Kip significantly, which Ondaatje himself has described as the adaptation's most significant loss."
      },
      {
        "heading": "Almásy and Katharine",
        "text": "Ralph Fiennes and Kristin Scott Thomas give two of the finest performances of the 1990s — their love affair is genuinely devastating on screen, with a physical and emotional intensity that matches the desert grandeur. This is an area where the film surpasses the source."
      },
      {
        "heading": "The desert",
        "text": "Minghella films the Sahara with extraordinary beauty, and John Seale's cinematography is the film's visual argument for its own existence. The desert in the novel is evoked through prose; the desert in the film is shown, and it is magnificent."
      },
      {
        "heading": "Structure and time",
        "text": "Ondaatje's novel moves between timelines without signposting the transitions. Minghella organises the timelines more conventionally, which helps audiences follow the story but removes the disorientating beauty of Ondaatje's method."
      }
    ],
    "readFirst": "Yes — specifically to get Kip's full story before the film removes it, and to experience Ondaatje's prose in full before Minghella's images replace it.",
    "verdictBox": "One of the genuine ties. Minghella's film is a masterpiece of literary adaptation. But Ondaatje's novel is a richer, stranger, more ambitious work. Read both. Watch both. The argument between them is productive.",
    "related": [
      {
        "href": "/cold-mountain.html",
        "label": "Cold Mountain"
      },
      {
        "href": "/atonement.html",
        "label": "Atonement"
      },
      {
        "href": "/remains-of-the-day.html",
        "label": "The Remains of the Day"
      }
    ]
  },
  {
    "slug": "cold-mountain",
    "title": "Cold Mountain",
    "genre": "Historical Fiction / War",
    "author": "Charles Frazier",
    "bookYear": "1997",
    "director": "Anthony Minghella",
    "filmYear": "2003",
    "verdict": "book",
    "verdictText": "Book Wins",
    "affiliateLink": "https://amzn.to/4bR4Nz8",
    "image": "cold-mountain.jpg",
    "youtubeId": "kfxXPhKuMUA",
    "trailerNote": "Starring Jude Law, Nicole Kidman, Renée Zellweger &mdash; Film: 2003",
    "metaTitle": "Cold Mountain: Book vs Movie — Frazier vs Anthony Minghella",
    "metaDesc": "Charles Frazier's National Book Award-winning novel vs Minghella's 2003 film — Inman's odyssey, Ada's survival, and why the prose is the journey.",
    "subtitle": "Book (1997) vs. Movie (2003) &mdash; dir. Anthony Minghella",
    "storyBrief": "Inman is a Confederate soldier who deserts after being wounded at Petersburg and begins the long walk home through a war-ravaged South to Ada Monroe, the woman he loves. Charles Frazier's National Book Award-winning novel is a modern epic modelled loosely on Homer's Odyssey. Anthony Minghella returned to literary adaptation after The English Patient with a film that is beautiful and somewhat airless.",
    "differences": [
      {
        "heading": "Inman's interior journey",
        "text": "The novel's Inman is philosophical and deeply interior — his journey is as much through his own mind as through the Southern landscape. Jude Law plays Inman as quietly heroic but the film lacks access to the character's interiority. The walk becomes a series of episodes rather than the accumulation of a philosophy."
      },
      {
        "heading": "The episodic structure",
        "text": "Frazier structures the novel as a series of distinct episodes — each encounter on Inman's journey is its own small story. The film preserves the episodic structure but compresses several episodes significantly. The length of the road is the whole point."
      },
      {
        "heading": "Ruby and Ada",
        "text": "Renée Zellweger won an Academy Award for Ruby and deserved it — her performance is the film's most fully alive element. The novel's Ruby is equally vivid on the page, and the female friendship between Ruby and Ada is the novel's emotional heart. This thread the film handles well."
      },
      {
        "heading": "The landscape",
        "text": "Minghella filmed in Romania rather than North Carolina, which gives the film a generic European grandeur rather than the specific Appalachian texture of Frazier's setting. The novel's landscape is deeply particular — and that particularity is the foundation of Inman's longing."
      },
      {
        "heading": "The ending",
        "text": "Both versions reach the same destination — Inman's death and Ada's survival. The novel earns its ending more fully because the journey has been longer and harder."
      }
    ],
    "readFirst": "Yes — the novel's journey is the experience, and the film can only sketch what Frazier renders in full. Watch it for Zellweger's Ruby, which is the film's truest translation of Frazier's achievement.",
    "verdictBox": "Minghella made a beautiful, well-intentioned adaptation that the novel substantially outweighs. Read the novel for the journey. See the film for Zellweger.",
    "related": [
      {
        "href": "/english-patient.html",
        "label": "The English Patient"
      },
      {
        "href": "/beloved.html",
        "label": "Beloved"
      },
      {
        "href": "/the-road.html",
        "label": "The Road"
      }
    ]
  },
  {
    "slug": "the-hours",
    "title": "The Hours",
    "genre": "Literary Fiction / Drama",
    "author": "Michael Cunningham",
    "bookYear": "1998",
    "director": "Stephen Daldry",
    "filmYear": "2002",
    "verdict": "tie",
    "verdictText": "Too Close to Call",
    "affiliateLink": "https://amzn.to/4c5JoB1",
    "image": "the-hours.jpg",
    "youtubeId": "CkPWXUxIiXs",
    "trailerNote": "Starring Meryl Streep, Julianne Moore, Nicole Kidman &mdash; Film: 2002",
    "metaTitle": "The Hours: Book vs Movie — Cunningham vs Stephen Daldry",
    "metaDesc": "Michael Cunningham's Pulitzer Prize-winning novel vs Stephen Daldry's 2002 film — three women, one day, Virginia Woolf, and one of cinema's great casts.",
    "subtitle": "Book (1998) vs. Movie (2002) &mdash; dir. Stephen Daldry",
    "storyBrief": "Three women on three different days, bound together by Virginia Woolf's novel Mrs Dalloway. Virginia Woolf herself in 1923. Laura Brown in 1951 Los Angeles. Clarissa Vaughan in present-day New York. Michael Cunningham's Pulitzer Prize-winning novel is a meditation on literature, life, and the choices women make. Stephen Daldry's film assembled three of the finest actresses of their generation and made something close to a masterpiece of its own.",
    "differences": [
      {
        "heading": "The Woolf strand",
        "text": "Nicole Kidman won the Academy Award for her portrayal of Virginia Woolf — the prosthetic nose, the physical transformation, the hallucinatory quality of the 1923 sequences. Cunningham's Woolf is rendered with similar strangeness on the page, but the novel can access her interior monologue in ways that even Kidman's performance cannot."
      },
      {
        "heading": "Philip Glass's score",
        "text": "Philip Glass's score is one of the most discussed elements of the film — relentless, hypnotic. It does work that the novel achieves through prose rhythm. Both are effective. Which you prefer may determine which version you prefer overall."
      },
      {
        "heading": "The three-strand structure",
        "text": "Cunningham's novel alternates between the three women in brief chapters, each rendered in a style that echoes Woolf's own prose. The film weaves the three strands together more fluidly through editing, which creates a different kind of resonance. Both structures work; they work differently."
      },
      {
        "heading": "Meryl Streep's Clarissa",
        "text": "Streep's Clarissa Vaughan is the film's emotional centre — her grief at the end is one of Streep's most concentrated performances. Cunningham's Clarissa is more comic in her pretensions, which gives the novel a lightness that the film, with its gathering weight of music and mortality, somewhat lacks."
      },
      {
        "heading": "Ed Harris's Richard",
        "text": "Ed Harris plays Richard — the dying poet — with extraordinary fragility, and his final scene with Streep is devastating. The novel gives Richard more words and more complexity, but Harris achieves the same emotional destination through entirely different means."
      }
    ],
    "readFirst": "Either order works here more than almost anywhere else. If forced to choose: read first, because Cunningham's prose is the original experience and the film is a magnificent translation. But the translation is good enough that you won't feel cheated either way.",
    "verdictBox": "A genuine tie between two masterworks. Cunningham's novel is richer in interiority and prose rhythm. Daldry's film has Kidman, Streep, and Moore. Read the novel. See the film. Consider them companion pieces that illuminate each other.",
    "related": [
      {
        "href": "/remains-of-the-day.html",
        "label": "The Remains of the Day"
      },
      {
        "href": "/never-let-me-go.html",
        "label": "Never Let Me Go"
      },
      {
        "href": "/atonement.html",
        "label": "Atonement"
      }
    ]
  },
  {
    "slug": "talented-mr-ripley",
    "title": "The Talented Mr. Ripley",
    "genre": "Thriller / Crime",
    "author": "Patricia Highsmith",
    "bookYear": "1955",
    "director": "Anthony Minghella",
    "filmYear": "1999",
    "verdict": "book",
    "verdictText": "Book Wins",
    "affiliateLink": "https://amzn.to/4e1Easy",
    "image": "talented-mr-ripley.jpg",
    "youtubeId": "h4e-Si4oGEw",
    "trailerNote": "Starring Matt Damon, Jude Law, Gwyneth Paltrow &mdash; Film: 1999",
    "metaTitle": "The Talented Mr. Ripley: Book vs Movie — Highsmith vs Minghella",
    "metaDesc": "Patricia Highsmith's 1955 novel vs Minghella's 1999 film — Tom Ripley, identity, and why the book's cold genius is irreplaceable.",
    "subtitle": "Book (1955) vs. Movie (1999) &mdash; dir. Anthony Minghella",
    "storyBrief": "Tom Ripley is a small-time fraudster sent to Italy to bring home a wealthy American's playboy son. Instead, Tom becomes obsessed with Dickie Greenleaf's life — his money, his ease, his careless beauty — and begins to want it so badly that he takes it. Patricia Highsmith's novel is one of the most disturbing portraits of a sociopath in literature. Anthony Minghella's film, with Matt Damon, makes Tom more sympathetic and the film considerably more conventional.",
    "differences": [
      {
        "heading": "Tom Ripley's consciousness",
        "text": "Highsmith writes entirely from inside Tom's mind, and his perspective is deeply unsettling precisely because it is so matter-of-fact. The film makes Tom's psychology more visibly troubled, more conventionally anxious, which is easier to watch but loses the chill of Highsmith's original."
      },
      {
        "heading": "Tom's sexuality",
        "text": "Minghella's film is considerably more explicit about Tom's desire for Dickie — the homoerotic dimension is foregrounded in ways the novel only implies. This psychologises Tom in ways that make him more conventionally understandable and therefore less frightening. Highsmith's Tom is alien; Minghella's Tom is wounded."
      },
      {
        "heading": "Dickie Greenleaf",
        "text": "Jude Law plays Dickie as glamorous and careless — the film earns Tom's obsession visually. Highsmith's Dickie is slightly less likeable, which means Tom's desire for his life is stranger and more disturbing."
      },
      {
        "heading": "The Italian setting",
        "text": "Minghella films Italy with ravishing beauty and uses the landscape as a counterpoint to the moral darkness of the story. The beauty that surrounds the horror makes the horror more disturbing."
      },
      {
        "heading": "The ending",
        "text": "Highsmith's ending is darker and more open — Tom escapes, as he will continue to escape through four more novels. The film's ending is grimmer and more definitively tragic. Readers of the Ripley series will find the film's ending a betrayal of the character's essential coldness."
      }
    ],
    "readFirst": "Yes — Highsmith's Tom Ripley is one of literature's great creations and the novel's cold genius is irreplaceable. Read it and the film becomes a fascinating exercise in what happens when you warm a character up for mainstream cinema.",
    "verdictBox": "Highsmith wrote a sociopath's inner life with such precision that the novel is genuinely unsettling decades later. Minghella made a gorgeous film that softens the sociopath into something comprehensible and therefore lesser. Read the novel. See the film. Prefer the novel.",
    "related": [
      {
        "href": "/gone-girl.html",
        "label": "Gone Girl"
      },
      {
        "href": "/no-country-for-old-men.html",
        "label": "No Country for Old Men"
      },
      {
        "href": "/silence-of-the-lambs.html",
        "label": "The Silence of the Lambs"
      }
    ]
  },
  {
    "slug": "misery",
    "title": "Misery",
    "genre": "Horror / Thriller",
    "author": "Stephen King",
    "bookYear": "1987",
    "director": "Rob Reiner",
    "filmYear": "1990",
    "verdict": "tie",
    "verdictText": "Too Close to Call",
    "affiliateLink": "https://amzn.to/4sP55w9",
    "image": "misery.jpg",
    "youtubeId": "XHQ9CPRfDsw",
    "trailerNote": "Starring James Caan, Kathy Bates &mdash; Film: 1990",
    "metaTitle": "Misery: Book vs Movie — Stephen King vs Rob Reiner",
    "metaDesc": "Stephen King's 1987 novel vs Rob Reiner's 1990 film — Annie Wilkes, Paul Sheldon, and one of the rare King adaptations that matches the source.",
    "subtitle": "Book (1987) vs. Movie (1990) &mdash; dir. Rob Reiner",
    "storyBrief": "Novelist Paul Sheldon crashes his car in a Colorado blizzard and is rescued by Annie Wilkes — his self-proclaimed number one fan. When Annie discovers that Paul has killed off her beloved fictional heroine Misery Chastain, her care becomes captivity. Stephen King wrote the novel partly as a meditation on his own relationship with his audience. Rob Reiner's film is one of the finest King adaptations ever made — taut, claustrophobic, and featuring one of cinema's great villain performances.",
    "differences": [
      {
        "heading": "Annie Wilkes",
        "text": "Kathy Bates won the Academy Award and it is among the most deserved in Oscar history. King's Annie on the page is rendered through Paul's perception and fear, and is arguably even more frightening for being seen from inside the captive's perspective. This is one of the closest races in the book-vs-film debate: both Annies are extraordinary."
      },
      {
        "heading": "Paul's interiority",
        "text": "The novel spends considerable time inside Paul's mind as he plans his escape, processes his fear, and works through his complicated feelings about his own work and his addiction. James Caan gives a committed performance but the film necessarily externalises what King keeps interior."
      },
      {
        "heading": "The hobbling scene",
        "text": "King's novel has Paul's leg cut off at the ankle with an axe. Reiner changed this to the ankle-smashing with a sledgehammer that became iconic. Both are horrifying; the film's version is possibly more viscerally awful for being more prolonged."
      },
      {
        "heading": "Misery's Return",
        "text": "The novel-within-the-novel — Paul writing Misery back to life under duress — is given more space in the book, with longer excerpts and more attention to Paul's craft and his complicated feelings about popular fiction."
      },
      {
        "heading": "The meta-dimension",
        "text": "King intended Misery as a novel about the relationship between writer and audience. This dimension is present in the film but subordinated to the thriller mechanics, which are so effective that the allegory becomes optional."
      }
    ],
    "readFirst": "Either order works. The film is so effective as a thriller and Bates is so definitive that watching first is a legitimate choice. Either way, make sure you experience both.",
    "verdictBox": "One of the rare King adaptations that genuinely competes with its source. Bates's Annie Wilkes is as great as King's. The novel has more interior dimension and the full horror of the axe. The film has Bates. It's close enough to call a tie.",
    "related": [
      {
        "href": "/the-shining.html",
        "label": "The Shining"
      },
      {
        "href": "/silence-of-the-lambs.html",
        "label": "The Silence of the Lambs"
      },
      {
        "href": "/gone-girl.html",
        "label": "Gone Girl"
      }
    ]
  },
  {
    "slug": "silence-of-the-lambs",
    "title": "The Silence of the Lambs",
    "genre": "Thriller / Crime",
    "author": "Thomas Harris",
    "bookYear": "1988",
    "director": "Jonathan Demme",
    "filmYear": "1991",
    "verdict": "tie",
    "verdictText": "Too Close to Call",
    "affiliateLink": "https://amzn.to/3PSmMfS",
    "image": "silence-of-the-lambs.jpg",
    "youtubeId": "6iB21hsprAQ",
    "trailerNote": "Starring Jodie Foster, Anthony Hopkins &mdash; Film: 1991",
    "metaTitle": "The Silence of the Lambs: Book vs Movie — Harris vs Jonathan Demme",
    "metaDesc": "Thomas Harris's 1988 novel vs Demme's 1991 film — Clarice Starling, Hannibal Lecter, and one of the very rare cases where the film matches the book.",
    "subtitle": "Book (1988) vs. Movie (1991) &mdash; dir. Jonathan Demme",
    "storyBrief": "FBI trainee Clarice Starling is sent to interview Hannibal Lecter — imprisoned psychiatrist, brilliant mind, cannibalistic killer — in the hope that his insight will help catch a serial murderer known as Buffalo Bill. Thomas Harris's novel is a masterwork of thriller writing. Jonathan Demme's film won all five major Academy Awards. One of the very few entries on this site where the argument genuinely cannot be resolved.",
    "differences": [
      {
        "heading": "Anthony Hopkins's Lecter",
        "text": "Hopkins appears on screen for approximately sixteen minutes and won the Academy Award. His Lecter is one of cinema's definitive villains. Harris's Lecter is more elaborate and more psychologically detailed. Both are extraordinary. Hopkins's Lecter is more immediately iconic; Harris's is more frightening over time."
      },
      {
        "heading": "Clarice Starling",
        "text": "Jodie Foster's Clarice is arguably the greatest female protagonist in Hollywood thriller history. Harris's Clarice is rendered from inside her perspective, giving her a richer interiority. The film captures the essence with slightly less detail. Both are excellent."
      },
      {
        "heading": "Demme's visual technique",
        "text": "Demme's most distinctive directorial choice is filming Lecter's scenes with direct address — the camera as Clarice's eyes. This creates an intimacy that the novel achieves through prose. It's one of the most effective translations of a literary technique into purely cinematic terms."
      },
      {
        "heading": "Buffalo Bill",
        "text": "Ted Levine's Buffalo Bill is deeply unsettling. Harris's Buffalo Bill is given more psychological backstory and more complexity in the novel. The film correctly makes him more purely frightening."
      },
      {
        "heading": "The ending",
        "text": "Both versions end on the same note — Lecter free, Clarice receiving his call. The film's final image is darkly comic. The novel's ending is slightly more ambiguous about what Clarice has sacrificed."
      }
    ],
    "readFirst": "Either order works — this is one of the very few cases where the film is so good that the reading order doesn't significantly affect either experience.",
    "verdictBox": "The Silence of the Lambs is one of the handful of adaptations where the film is genuinely as good as the novel. Harris wrote a masterwork; Demme made a masterwork from it. Read both. Watch both. Don't try to rank them.",
    "related": [
      {
        "href": "/misery.html",
        "label": "Misery"
      },
      {
        "href": "/gone-girl.html",
        "label": "Gone Girl"
      },
      {
        "href": "/no-country-for-old-men.html",
        "label": "No Country for Old Men"
      }
    ]
  },
  {
    "slug": "jurassic-park",
    "title": "Jurassic Park",
    "genre": "Science Fiction / Adventure",
    "author": "Michael Crichton",
    "bookYear": "1990",
    "director": "Steven Spielberg",
    "filmYear": "1993",
    "verdict": "book",
    "verdictText": "Book Wins",
    "affiliateLink": "https://amzn.to/4c4szGF",
    "image": "jurassic-park.jpg",
    "youtubeId": "QWBKEmWWL38",
    "trailerNote": "Starring Sam Neill, Laura Dern, Jeff Goldblum &mdash; Film: 1993",
    "metaTitle": "Jurassic Park: Book vs Movie — Crichton vs Spielberg",
    "metaDesc": "Michael Crichton's 1990 novel vs Spielberg's 1993 film — the science, the chaos theory, and why the book is darker and smarter than the blockbuster.",
    "subtitle": "Book (1990) vs. Movie (1993) &mdash; dir. Steven Spielberg",
    "storyBrief": "Billionaire John Hammond has cloned dinosaurs from ancient DNA and built a theme park on a Costa Rican island. When the park's systems fail, a handful of scientists and Hammond's grandchildren must survive. Michael Crichton's novel is a serious work of scientific speculation wrapped in a thriller — darker, more intellectually rigorous, and considerably less sentimental than what Spielberg made of it. Spielberg's film is one of the most thrilling cinema experiences of the 1990s.",
    "differences": [
      {
        "heading": "Ian Malcolm's chaos theory",
        "text": "Crichton gives Malcolm extended lectures on chaos theory, complexity, and the arrogance of scientific hubris — passages that are genuinely interesting and form the novel's intellectual spine. The film reduces Malcolm's arguments to memorable one-liners."
      },
      {
        "heading": "Tone and darkness",
        "text": "Crichton's novel is substantially darker than Spielberg's film — more characters die, more graphically, and the horror of what Hammond has done is more unambiguously condemned. Spielberg sentimentalises Hammond into a well-meaning eccentric rather than the novel's genuinely culpable megalomaniac."
      },
      {
        "heading": "The dinosaurs",
        "text": "Spielberg's dinosaurs are one of cinema's great achievements — the initial appearance of the brachiosaurus is still breathtaking thirty years later. The film makes you feel the scale, the reality, the extraordinary wrongness of a living dinosaur. This is the area where the film most clearly surpasses the source."
      },
      {
        "heading": "The children",
        "text": "The novel's children are more actively involved in understanding what's happening and less purely there to be rescued. The film reduces them to conventional thriller children."
      },
      {
        "heading": "Hammond's fate",
        "text": "In the novel, Hammond is killed by a pack of small dinosaurs — the ones he dismissed as irrelevant. This is a piece of thematic precision that the film cuts entirely, giving Hammond a sentimental exit."
      }
    ],
    "readFirst": "Yes — specifically to get the novel's darker, more intellectually serious version before Spielberg's magnificent but somewhat defanged blockbuster replaces it.",
    "verdictBox": "Spielberg made one of cinema's great experiences and Crichton wrote a better, darker book. The film's dinosaurs are irreplaceable; the novel's argument is irreplaceable. See the film for the experience. Read the novel to understand what the experience was originally about.",
    "related": [
      {
        "href": "/the-martian.html",
        "label": "The Martian"
      },
      {
        "href": "/dune.html",
        "label": "Dune"
      },
      {
        "href": "/ready-player-one.html",
        "label": "Ready Player One"
      }
    ]
  },
  {
    "slug": "the-firm",
    "title": "The Firm",
    "genre": "Legal Thriller",
    "author": "John Grisham",
    "bookYear": "1991",
    "director": "Sydney Pollack",
    "filmYear": "1993",
    "verdict": "book",
    "verdictText": "Book Wins",
    "affiliateLink": "https://amzn.to/4tthbex",
    "image": "the-firm.jpg",
    "youtubeId": "FX3AXA3icR0",
    "trailerNote": "Starring Tom Cruise, Jeanne Tripplehorn, Gene Hackman &mdash; Film: 1993",
    "metaTitle": "The Firm: Book vs Movie — John Grisham vs Sydney Pollack",
    "metaDesc": "John Grisham's bestselling novel vs Sydney Pollack's 1993 film — Mitch McDeere, the mob law firm, and why Grisham changed the ending for the screen.",
    "subtitle": "Book (1991) vs. Movie (1993) &mdash; dir. Sydney Pollack",
    "storyBrief": "Mitch McDeere graduates top of his Harvard Law class and is recruited by a small Memphis firm with extraordinary financial inducements. The firm is controlled by the Mob. Mitch is caught between the FBI and the firm itself, which kills lawyers who try to leave. Grisham's breakthrough novel is a masterwork of legal thriller plotting. Pollack's film changes the ending entirely.",
    "differences": [
      {
        "heading": "The ending",
        "text": "Grisham's novel ends with Mitch using the firm's own billing fraud against them — a clever, non-violent resolution. Pollack's film ends with a conventional thriller chase sequence. Grisham has said the original ending was deemed 'not cinematic' enough. He's wrong — the novel's ending is more satisfying precisely because it's smarter than a foot chase."
      },
      {
        "heading": "The pacing",
        "text": "Grisham's novel builds with extraordinary patience — the trap closes slowly. The film compresses this significantly, which makes it faster but removes the slow accumulation of dread that makes Mitch's situation feel truly inescapable."
      },
      {
        "heading": "Tom Cruise",
        "text": "Cruise was at the height of his star power in 1993 and he's magnetic — energetic, charming, visibly frightened when the situation requires it."
      },
      {
        "heading": "The supporting cast",
        "text": "Gene Hackman as Avery Tolar and Ed Harris as the FBI agent give the film texture that enriches Grisham's supporting cast. The film is better cast than most Grisham adaptations."
      },
      {
        "heading": "The firm itself",
        "text": "Grisham builds the firm as a specific, believable institution — its culture, its inducements, its methods of control are detailed and plausible. The film renders this more efficiently but with less texture."
      }
    ],
    "readFirst": "Yes — primarily to experience the original ending before the film replaces it with something lesser. The novel's ending is one of thriller fiction's most satisfying resolutions.",
    "verdictBox": "Grisham's novel is a masterwork of thriller plotting with one of the genre's cleverest endings. Pollack's film is a compulsively watchable adaptation that throws away the best part. Read the novel for the ending. See the film for Cruise and Hackman.",
    "related": [
      {
        "href": "/silence-of-the-lambs.html",
        "label": "The Silence of the Lambs"
      },
      {
        "href": "/gone-girl.html",
        "label": "Gone Girl"
      },
      {
        "href": "/no-country-for-old-men.html",
        "label": "No Country for Old Men"
      }
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
  console.log('  1. Run node script_qa.js to verify');
  console.log('  2. Move HTML files to root: move *.html ..');
  console.log('  3. Run node script_update_sitemap.js');
  console.log('  4. Run node script_update_index.js');
  console.log('  5. Add book cover images to /images/');
  console.log('  6. Commit and push');
}

main();
