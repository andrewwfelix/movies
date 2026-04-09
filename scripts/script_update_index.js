#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Index Page Generator
 * Rebuilds index.html from the master SECTIONS data array.
 * Add new pages here and re-run to update the homepage.
 *
 * Usage:
 *   node script_update_index.js
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------ //
// MASTER PAGE DATA
// ------------------------------------------------------------------ //

const SECTIONS = [
  {
    heading: '2026 Adaptations',
    pages: [
      { file: 'project-hail-mary.html', image: 'project-hail-mary.jpg', genre: 'Science Fiction', title: 'Project Hail Mary', author: 'Andy Weir &mdash; Ryan Gosling stars', footer: 'In theaters March 20, 2026 &middot; Book Wins' },
      { file: 'verity.html', image: 'verity.jpg', genre: 'Psychological Thriller', title: 'Verity', author: 'Colleen Hoover &mdash; Anne Hathaway stars', footer: 'In theaters October 2, 2026 &middot; Book Wins' },
      { file: 'hunger-games-sunrise.html', image: 'hunger-games-sunrise.jpg', genre: 'Dystopian Fiction', title: 'Hunger Games: Sunrise on the Reaping', author: 'Suzanne Collins &mdash; Joseph Zada stars', footer: 'In theaters November 20, 2026 &middot; Too Close to Call' },
      { file: 'narnia-magicians-nephew.html', image: 'narnia-magicians-nephew.jpg', genre: 'Fantasy', title: "Narnia: The Magician's Nephew", author: 'C.S. Lewis &mdash; dir. Greta Gerwig', footer: 'In theaters November 26, 2026 &middot; Book Wins' },
      { file: 'hamnet.html', image: 'hamnet.jpg', genre: 'Historical Fiction', title: 'Hamnet', author: "Maggie O'Farrell &mdash; Jessie Buckley stars", footer: 'In theaters early 2026 &middot; Book Wins' },
      { file: 'remarkably-bright-creatures.html', image: 'remarkably-bright-creatures.jpg', genre: 'Literary Fiction', title: 'Remarkably Bright Creatures', author: 'Shelby Van Pelt &mdash; Sally Field stars', footer: 'Streaming May 8, 2026 &middot; Book Wins' },
      { file: 'devil-wears-prada.html', image: 'devil-wears-prada.jpg', genre: 'Comedy / Drama', title: 'The Devil Wears Prada', author: 'Lauren Weisberger &mdash; Meryl Streep stars', footer: 'In theaters May 1, 2026 &middot; Book Wins' },
      { file: 'reminders-of-him.html', image: 'reminders-of-him.jpg', genre: 'Romance / Drama', title: 'Reminders of Him', author: 'Colleen Hoover &mdash; Maika Monroe stars', footer: 'In theaters March 13, 2026 &middot; Book Wins' },
      { file: 'people-we-meet-on-vacation.html', image: 'people-we-meet-on-vacation.jpg', genre: 'Romance', title: 'People We Meet on Vacation', author: 'Emily Henry &mdash; Tom Blyth, Emily Bader', footer: 'Netflix Jan 9, 2026 &middot; Book Wins' },
      { file: 'margos-got-money-troubles.html', image: 'margos-got-money-troubles.jpg', genre: 'Comedy / Drama', title: "Margo's Got Money Troubles", author: 'Rufi Thorpe &mdash; Elle Fanning stars', footer: 'Apple TV+ April 15, 2026 &middot; Book Wins' },
      { file: 'the-housemaid.html', image: 'the-housemaid.jpg', genre: 'Psychological Thriller', title: 'The Housemaid', author: 'Freida McFadden &mdash; Sydney Sweeney stars', footer: 'Released December 2025 &middot; Book Wins' },
      { file: 'fourth-wing.html', image: 'fourth-wing.jpg', genre: 'Fantasy Romance', title: 'Fourth Wing', author: 'Rebecca Yarros &mdash; Prime Video (TBA)', footer: 'Series in development &middot; Book Wins' },
      { file: 'a-knight-of-the-seven-kingdoms.html', image: 'a-knight-of-the-seven-kingdoms.jpg', genre: 'Fantasy', title: 'A Knight of the Seven Kingdoms', author: 'George R.R. Martin &mdash; HBO series', footer: 'HBO 2025 &middot; Too Close to Call' },
      { file: 'wuthering-heights.html', image: 'wuthering-heights.jpg', genre: 'Gothic Romance', title: 'Wuthering Heights', author: 'Emily Bront&euml; &mdash; Margot Robbie stars', footer: 'In theaters 2026 &middot; Book Wins' },
    ]
  },
  {
    heading: 'Thrillers &amp; Page-Turners',
    pages: [
      { file: 'gone-girl.html', image: 'gone-girl.jpg', genre: 'Psychological Thriller', title: 'Gone Girl', author: 'Gillian Flynn &mdash; dir. David Fincher', footer: 'Film: 2014 &middot; Too Close to Call' },
      { file: 'girl-on-the-train.html', image: 'girl-on-the-train.jpg', genre: 'Psychological Thriller', title: 'The Girl on the Train', author: 'Paula Hawkins &mdash; Emily Blunt stars', footer: 'Film: 2016 &middot; Book Wins' },
      { file: 'big-little-lies.html', image: 'big-little-lies.jpg', genre: 'Domestic Thriller', title: 'Big Little Lies', author: 'Liane Moriarty &mdash; Kidman &amp; Witherspoon', footer: 'HBO: 2017 &middot; Too Close to Call' },
      { file: 'no-country-for-old-men.html', image: 'no-country-for-old-men.jpg', genre: 'Crime / Neo-Western', title: 'No Country for Old Men', author: 'Cormac McCarthy &mdash; dir. Coen Brothers', footer: 'Film: 2007 &middot; Too Close to Call' },
      { file: 'the-shining.html', image: 'the-shining.jpg', genre: 'Horror / Psychological', title: 'The Shining', author: 'Stephen King &mdash; dir. Stanley Kubrick', footer: 'Film: 1980 &middot; Book Wins' },
      { file: 'where-the-crawdads-sing.html', image: 'where-the-crawdads-sing.jpg', genre: 'Mystery / Literary Fiction', title: 'Where the Crawdads Sing', author: 'Delia Owens &mdash; Daisy Edgar-Jones stars', footer: 'Film: 2022 &middot; Book Wins' },
      { file: 'silence-of-the-lambs.html', image: 'silence-of-the-lambs.jpg', genre: 'Crime Thriller', title: 'The Silence of the Lambs', author: 'Thomas Harris &mdash; Jodie Foster stars', footer: 'Film: 1991 &middot; Too Close to Call' },
      { file: 'american-psycho.html', image: 'american-psycho.jpg', genre: 'Psychological Thriller', title: 'American Psycho', author: 'Bret Easton Ellis &mdash; Christian Bale stars', footer: 'Film: 2000 &middot; Book Wins' },
      { file: 'misery.html', image: 'misery.jpg', genre: 'Horror / Thriller', title: 'Misery', author: 'Stephen King &mdash; Kathy Bates stars', footer: 'Film: 1990 &middot; Too Close to Call' },
      { file: 'la-confidential.html', image: 'la-confidential.jpg', genre: 'Crime / Noir', title: 'L.A. Confidential', author: 'James Ellroy &mdash; dir. Curtis Hanson', footer: 'Film: 1997 &middot; Too Close to Call' },
      { file: 'the-firm.html', image: 'the-firm.jpg', genre: 'Legal Thriller', title: 'The Firm', author: 'John Grisham &mdash; Tom Cruise stars', footer: 'Film: 1993 &middot; Book Wins' },
      { file: 'da-vinci-code.html', image: 'da-vinci-code.jpg', genre: 'Mystery / Thriller', title: 'The Da Vinci Code', author: 'Dan Brown &mdash; Tom Hanks stars', footer: 'Film: 2006 &middot; Book Wins' },
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
      { file: 'normal-people.html', image: 'normal-people.jpg', genre: 'Literary Fiction / Romance', title: 'Normal People', author: 'Sally Rooney &mdash; Paul Mescal stars', footer: 'Hulu/BBC: 2020 &middot; Too Close to Call' },
      { file: 'pachinko.html', image: 'pachinko.jpg', genre: 'Historical Fiction / Family Saga', title: 'Pachinko', author: 'Min Jin Lee &mdash; Apple TV+ series', footer: 'Apple TV+: 2022 &middot; Book Wins' },
      { file: 'beloved.html', image: 'beloved.jpg', genre: 'Literary Fiction / Historical', title: 'Beloved', author: 'Toni Morrison &mdash; Oprah Winfrey stars', footer: 'Film: 1998 &middot; Book Wins' },
      { file: 'station-eleven.html', image: 'station-eleven.jpg', genre: 'Literary Fiction / Sci-Fi', title: 'Station Eleven', author: 'Emily St. John Mandel &mdash; HBO Max series', footer: 'HBO Max: 2021 &middot; Book Wins' },
      { file: 'the-great-gatsby.html', image: 'the-great-gatsby.jpg', genre: 'Literary Fiction / Classic', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald &mdash; Leonardo DiCaprio stars', footer: 'Film: 2013 &middot; Book Wins' },
      { file: 'on-the-road.html', image: 'on-the-road.jpg', genre: 'Literary Fiction / Classic', title: 'On the Road', author: 'Jack Kerouac &mdash; dir. Walter Salles', footer: 'Film: 2012 &middot; Book Wins' },
      { file: 'brooklyn.html', image: 'brooklyn.jpg', genre: 'Literary Fiction / Romance', title: 'Brooklyn', author: 'Colm T&oacute;ib&iacute;n &mdash; Saoirse Ronan stars', footer: 'Film: 2015 &middot; Book Wins' },
      { file: 'the-hours.html', image: 'the-hours.jpg', genre: 'Literary Fiction / Drama', title: 'The Hours', author: 'Michael Cunningham &mdash; Meryl Streep stars', footer: 'Film: 2002 &middot; Too Close to Call' },
      { file: 'remains-of-the-day.html', image: 'remains-of-the-day.jpg', genre: 'Literary Fiction / Drama', title: 'The Remains of the Day', author: 'Kazuo Ishiguro &mdash; Anthony Hopkins stars', footer: 'Film: 1993 &middot; Book Wins' },
    ]
  },
  {
    heading: 'Romance &amp; Drama',
    pages: [
      { file: 'pride-and-prejudice.html', image: 'pride-and-prejudice.jpg', genre: 'Classic Romance', title: 'Pride and Prejudice', author: 'Jane Austen &mdash; Keira Knightley stars', footer: 'Film: 2005 &middot; Book Wins' },
      { file: 'sense-and-sensibility.html', image: 'sense-and-sensibility.jpg', genre: 'Classic Romance', title: 'Sense and Sensibility', author: 'Jane Austen &mdash; Emma Thompson stars', footer: 'Film: 1995 &middot; Book Wins' },
      { file: 'jane-eyre.html', image: 'jane-eyre.jpg', genre: 'Gothic Romance', title: 'Jane Eyre', author: 'Charlotte Bront&euml; &mdash; Mia Wasikowska stars', footer: 'Film: 2011 &middot; Book Wins' },
      { file: 'rebecca.html', image: 'rebecca.jpg', genre: 'Gothic Thriller', title: 'Rebecca', author: 'Daphne du Maurier &mdash; dir. Alfred Hitchcock', footer: 'Film: 1940 &middot; Book Wins' },
      { file: 'outlander.html', image: 'outlander.jpg', genre: 'Historical Romance / Fantasy', title: 'Outlander', author: 'Diana Gabaldon &mdash; Caitriona Balfe stars', footer: 'Starz: 2014 &middot; Book Wins' },
      { file: 'the-notebook.html', image: 'the-notebook.jpg', genre: 'Romance / Drama', title: 'The Notebook', author: 'Nicholas Sparks &mdash; Ryan Gosling stars', footer: 'Film: 2004 &middot; Book Wins' },
      { file: 'me-before-you.html', image: 'me-before-you.jpg', genre: 'Romance / Drama', title: 'Me Before You', author: 'Jojo Moyes &mdash; Emilia Clarke stars', footer: 'Film: 2016 &middot; Book Wins' },
      { file: 'it-ends-with-us.html', image: 'it-ends-with-us.jpg', genre: 'Romance / Drama', title: 'It Ends with Us', author: 'Colleen Hoover &mdash; Blake Lively stars', footer: 'Film: 2024 &middot; Book Wins' },
      { file: 'ugly-love.html', image: 'ugly-love.jpg', genre: 'Romance / Drama', title: 'Ugly Love', author: 'Colleen Hoover &mdash; dir. Michael Mohan', footer: 'Film: 2023 &middot; Book Wins' },
      { file: 'eat-pray-love.html', image: 'eat-pray-love.jpg', genre: 'Memoir / Drama', title: 'Eat Pray Love', author: 'Elizabeth Gilbert &mdash; Julia Roberts stars', footer: 'Film: 2010 &middot; Book Wins' },
      { file: 'cold-mountain.html', image: 'cold-mountain.jpg', genre: 'Historical Romance / War', title: 'Cold Mountain', author: 'Charles Frazier &mdash; Jude Law stars', footer: 'Film: 2003 &middot; Book Wins' },
    ]
  },
  {
    heading: 'Science Fiction &amp; Speculative',
    pages: [
      { file: 'dune.html', image: 'dune.jpg', genre: 'Science Fiction / Epic', title: 'Dune', author: 'Frank Herbert &mdash; dir. Denis Villeneuve', footer: 'Film: 2021&ndash;2024 &middot; Book Wins' },
      { file: 'the-martian.html', image: 'the-martian.jpg', genre: 'Science Fiction', title: 'The Martian', author: 'Andy Weir &mdash; Matt Damon stars', footer: 'Film: 2015 &middot; Too Close to Call' },
      { file: 'the-road.html', image: 'the-road.jpg', genre: 'Literary Fiction / Post-Apocalyptic', title: 'The Road', author: 'Cormac McCarthy &mdash; Viggo Mortensen stars', footer: 'Film: 2009 &middot; Book Wins' },
      { file: 'the-handmaids-tale.html', image: 'the-handmaids-tale.jpg', genre: 'Dystopian Fiction', title: "The Handmaid's Tale", author: 'Margaret Atwood &mdash; Elisabeth Moss stars', footer: 'Hulu: 2017 &middot; Book Wins' },
      { file: 'dark-matter.html', image: 'dark-matter.jpg', genre: 'Science Fiction', title: 'Dark Matter', author: 'Blake Crouch &mdash; Joel Edgerton stars', footer: 'Apple TV+: 2024 &middot; Too Close to Call' },
      { file: 'ready-player-one.html', image: 'ready-player-one.jpg', genre: 'Science Fiction / Adventure', title: 'Ready Player One', author: 'Ernest Cline &mdash; dir. Steven Spielberg', footer: 'Film: 2018 &middot; Book Wins' },
      { file: 'the-maze-runner.html', image: 'the-maze-runner.jpg', genre: 'Dystopian Fiction / YA', title: 'The Maze Runner', author: "James Dashner &mdash; Dylan O'Brien stars", footer: 'Film: 2014 &middot; Book Wins' },
      { file: 'divergent.html', image: 'divergent.jpg', genre: 'Dystopian Fiction / YA', title: 'Divergent', author: 'Veronica Roth &mdash; Shailene Woodley stars', footer: 'Film: 2014 &middot; Book Wins' },
    ]
  },
  {
    heading: 'Classics Worth Revisiting',
    pages: [
      { file: 'one-flew-over-the-cuckoos-nest.html', image: 'one-flew-over-the-cuckoos-nest.jpg', genre: 'Literary Fiction / Drama', title: "One Flew Over the Cuckoo's Nest", author: 'Ken Kesey &mdash; Jack Nicholson stars', footer: 'Film: 1975 &middot; Too Close to Call' },
      { file: 'frankenstein.html', image: 'frankenstein.jpg', genre: 'Gothic Fiction / Horror', title: 'Frankenstein', author: 'Mary Shelley &mdash; dir. Guillermo del Toro', footer: 'Netflix: 2025 &middot; Book Wins' },
      { file: 'dracula.html', image: 'dracula.jpg', genre: 'Gothic Horror / Classic', title: 'Dracula', author: 'Bram Stoker &mdash; Gary Oldman stars', footer: 'Film: 1992 &middot; Book Wins' },
      { file: 'animal-farm.html', image: 'animal-farm.jpg', genre: 'Political Satire / Classic', title: 'Animal Farm', author: 'George Orwell &mdash; animated film', footer: 'Film: 1954 &middot; Book Wins' },
      { file: 'the-odyssey.html', image: 'the-odyssey.jpg', genre: 'Epic / Classic', title: 'The Odyssey', author: 'Homer &mdash; dir. Christopher Nolan', footer: 'In theaters July 17, 2026 &middot; Too Close to Call' },
      { file: 'schindlers-list.html', image: 'schindlers-list.jpg', genre: 'Historical Fiction / Drama', title: "Schindler's List", author: 'Thomas Keneally &mdash; dir. Steven Spielberg', footer: 'Film: 1993 &middot; Too Close to Call' },
      { file: 'catch-22.html', image: 'catch-22.jpg', genre: 'Literary Fiction / Satire', title: 'Catch-22', author: 'Joseph Heller &mdash; George Clooney stars', footer: 'Hulu: 2019 &middot; Book Wins' },
      { file: 'lord-of-the-flies.html', image: 'lord-of-the-flies.jpg', genre: 'Literary Fiction / Classic', title: 'Lord of the Flies', author: 'William Golding &mdash; dir. Peter Brook', footer: 'Film: 1963 &middot; Book Wins' },
      { file: 'to-kill-a-mockingbird.html', image: 'to-kill-a-mockingbird.jpg', genre: 'Literary Fiction / Classic', title: 'To Kill a Mockingbird', author: 'Harper Lee &mdash; Gregory Peck stars', footer: 'Film: 1962 &middot; Too Close to Call' },
      { file: 'fight-club.html', image: 'fight-club.jpg', genre: 'Literary Fiction / Thriller', title: 'Fight Club', author: 'Chuck Palahniuk &mdash; dir. David Fincher', footer: 'Film: 1999 &middot; Too Close to Call' },
      { file: 'lonesome-dove.html', image: 'lonesome-dove.jpg', genre: 'Western / Epic', title: 'Lonesome Dove', author: 'Larry McMurtry &mdash; Robert Duvall stars', footer: 'Miniseries: 1989 &middot; Book Wins' },
      { file: 'band-of-brothers.html', image: 'band-of-brothers.jpg', genre: 'Historical Fiction / War', title: 'Band of Brothers', author: 'Stephen E. Ambrose &mdash; HBO series', footer: 'HBO: 2001 &middot; Too Close to Call' },
      { file: 'the-princess-bride.html', image: 'the-princess-bride.jpg', genre: 'Fantasy / Adventure / Comedy', title: 'The Princess Bride', author: 'William Goldman &mdash; dir. Rob Reiner', footer: 'Film: 1987 &middot; Too Close to Call' },
      { file: 'coraline.html', image: 'coraline.jpg', genre: 'Fantasy / Horror', title: 'Coraline', author: 'Neil Gaiman &mdash; dir. Henry Selick', footer: 'Film: 2009 &middot; Too Close to Call' },
      { file: 'about-a-boy.html', image: 'about-a-boy.jpg', genre: 'Literary Fiction / Comedy', title: 'About a Boy', author: 'Nick Hornby &mdash; Hugh Grant stars', footer: 'Film: 2002 &middot; Too Close to Call' },
      { file: 'high-fidelity.html', image: 'high-fidelity.jpg', genre: 'Literary Fiction / Comedy', title: 'High Fidelity', author: 'Nick Hornby &mdash; John Cusack stars', footer: 'Film: 2000 &middot; Too Close to Call' },
      { file: 'into-the-wild.html', image: 'into-the-wild.jpg', genre: 'Memoir / Adventure', title: 'Into the Wild', author: 'Jon Krakauer &mdash; Emile Hirsch stars', footer: 'Film: 2007 &middot; Book Wins' },
      { file: 'perks-of-being-a-wallflower.html', image: 'perks-of-being-a-wallflower.jpg', genre: 'YA / Coming of Age', title: 'The Perks of Being a Wallflower', author: 'Stephen Chbosky &mdash; Logan Lerman stars', footer: 'Film: 2012 &middot; Book Wins' },
    ]
  },

  // ── NEW PAGES (built from spreadsheet) ──────────────────────────────
  {
    heading: 'Romance &amp; Drama — New',
    pages: [
      { file: 'a-walk-to-remember.html', image: 'a-walk-to-remember.jpg', genre: 'YA Romance / Drama', title: 'A Walk to Remember', author: 'Nicholas Sparks &mdash; dir. Adam Shankman', footer: 'Film: 2002 &middot; Book Wins' },
      { file: 'the-fault-in-our-stars.html', image: 'the-fault-in-our-stars.jpg', genre: 'YA Romance / Drama', title: 'The Fault in Our Stars', author: 'John Green &mdash; dir. Josh Boone', footer: 'Film: 2014 &middot; Book Wins' },
      { file: 'the-longest-ride.html', image: 'the-longest-ride.jpg', genre: 'Romance / Drama', title: 'The Longest Ride', author: 'Nicholas Sparks &mdash; dir. George Tillman Jr.', footer: 'Film: 2015 &middot; Book Wins' },
      { file: 'bridgerton.html', image: 'bridgerton.jpg', genre: 'Historical Romance', title: 'Bridgerton', author: 'Julia Quinn &mdash; created by Shonda Rhimes', footer: 'Netflix: 2020 &middot; Book Wins' },
      { file: 'one-day.html', image: 'one-day.jpg', genre: 'Romance / Drama', title: 'One Day', author: 'David Nicholls &mdash; dir. Lone Scherfig', footer: 'Film: 2011 &middot; Book Wins' },
      { file: 'daisy-jones-and-the-six.html', image: 'daisy-jones-and-the-six.jpg', genre: 'Historical Fiction / Drama', title: 'Daisy Jones &amp; The Six', author: 'Taylor Jenkins Reid &mdash; Riley Keough stars', footer: 'Prime Video: 2023 &middot; Book Wins' },
    ]
  },
  {
    heading: 'Thrillers &amp; Crime — New',
    pages: [
      { file: 'sharp-objects.html', image: 'sharp-objects.jpg', genre: 'Psychological Thriller', title: 'Sharp Objects', author: 'Gillian Flynn &mdash; Amy Adams stars', footer: 'HBO: 2018 &middot; Book Wins' },
      { file: 'the-girl-with-the-dragon-tattoo-fincher.html', image: 'the-girl-with-the-dragon-tattoo-fincher.jpg', genre: 'Crime Thriller', title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson &mdash; dir. David Fincher', footer: 'Film: 2011 &middot; Too Close to Call' },
      { file: 'big-little-lies-hbo.html', image: 'big-little-lies-hbo.jpg', genre: 'Mystery / Drama', title: 'Big Little Lies', author: 'Liane Moriarty &mdash; Kidman &amp; Witherspoon', footer: 'HBO: 2017 &middot; Too Close to Call' },
      { file: 'the-lincoln-lawyer.html', image: 'the-lincoln-lawyer.jpg', genre: 'Legal Thriller', title: 'The Lincoln Lawyer', author: 'Michael Connelly &mdash; Matthew McConaughey stars', footer: 'Film: 2011 &middot; Book Wins' },
      { file: 'gone-girl-2.html', image: 'gone-girl-2.jpg', genre: 'Psychological Thriller', title: 'Gone Girl', author: 'Gillian Flynn &mdash; dir. David Fincher', footer: 'Film: 2014 &middot; Too Close to Call' },
      { file: 'presumed-innocent.html', image: 'presumed-innocent.jpg', genre: 'Legal Thriller', title: 'Presumed Innocent', author: 'Scott Turow &mdash; Jake Gyllenhaal stars', footer: 'Apple TV+: 2024 &middot; Book Wins' },
    ]
  },
  {
    heading: 'Science Fiction — New',
    pages: [
      { file: 'annihilation.html', image: 'annihilation.jpg', genre: 'Science Fiction / Horror', title: 'Annihilation', author: 'Jeff VanderMeer &mdash; dir. Alex Garland', footer: 'Film: 2018 &middot; Book Wins' },
      { file: 'the-maze-runner-film.html', image: 'the-maze-runner-film.jpg', genre: 'Dystopian Fiction / YA', title: 'The Maze Runner', author: "James Dashner &mdash; Dylan O'Brien stars", footer: 'Film: 2014 &middot; Book Wins' },
      { file: 'the-giver.html', image: 'the-giver.jpg', genre: 'Dystopian Fiction / YA', title: 'The Giver', author: 'Lois Lowry &mdash; dir. Phillip Noyce', footer: 'Film: 2014 &middot; Book Wins' },
      { file: 'enders-game-film.html', image: 'enders-game-film.jpg', genre: 'Science Fiction / YA', title: "Ender's Game", author: 'Orson Scott Card &mdash; Asa Butterfield stars', footer: 'Film: 2013 &middot; Book Wins' },
      { file: 'contact.html', image: 'contact.jpg', genre: 'Science Fiction', title: 'Contact', author: 'Carl Sagan &mdash; Jodie Foster stars', footer: 'Film: 1997 &middot; Too Close to Call' },
      { file: 'sphere.html', image: 'sphere.jpg', genre: 'Science Fiction / Thriller', title: 'Sphere', author: 'Michael Crichton &mdash; Dustin Hoffman stars', footer: 'Film: 1998 &middot; Book Wins' },
      { file: 'i-robot.html', image: 'i-robot.jpg', genre: 'Science Fiction / Action', title: 'I, Robot', author: 'Isaac Asimov &mdash; Will Smith stars', footer: 'Film: 2004 &middot; Book Wins' },
    ]
  },
  {
    heading: 'Fantasy &amp; Supernatural — New',
    pages: [
      { file: 'interview-with-the-vampire-amcplus.html', image: 'interview-with-the-vampire-amcplus.jpg', genre: 'Horror / Fantasy', title: 'Interview with the Vampire', author: 'Anne Rice &mdash; Jacob Anderson stars', footer: 'AMC+: 2022 &middot; Book Wins' },
      { file: 'good-omens.html', image: 'good-omens.jpg', genre: 'Fantasy / Comedy', title: 'Good Omens', author: 'Pratchett &amp; Gaiman &mdash; Sheen &amp; Tennant', footer: 'Prime Video: 2019 &middot; Too Close to Call' },
      { file: 'stardust.html', image: 'stardust.jpg', genre: 'Fantasy / Romance', title: 'Stardust', author: 'Neil Gaiman &mdash; dir. Matthew Vaughn', footer: 'Film: 2007 &middot; Too Close to Call' },
      { file: 'american-gods.html', image: 'american-gods.jpg', genre: 'Fantasy / Drama', title: 'American Gods', author: 'Neil Gaiman &mdash; Ian McShane stars', footer: 'Starz: 2017 &middot; Book Wins' },
      { file: 'howls-moving-castle.html', image: 'howls-moving-castle.jpg', genre: 'Fantasy', title: "Howl's Moving Castle", author: 'Diana Wynne Jones &mdash; dir. Hayao Miyazaki', footer: 'Film: 2004 &middot; Too Close to Call' },
      { file: 'shadow-and-bone.html', image: 'shadow-and-bone.jpg', genre: 'Fantasy / YA', title: 'Shadow and Bone', author: 'Leigh Bardugo &mdash; Netflix series', footer: 'Netflix: 2021 &middot; Book Wins' },
      { file: 'the-witcher.html', image: 'the-witcher.jpg', genre: 'Fantasy / Adventure', title: 'The Witcher', author: 'Andrzej Sapkowski &mdash; Henry Cavill stars', footer: 'Netflix: 2019 &middot; Book Wins' },
    ]
  },
  {
    heading: 'Horror — New',
    pages: [
      { file: 'it-muschietti.html', image: 'it-muschietti.jpg', genre: 'Horror / Coming of Age', title: 'It', author: 'Stephen King &mdash; dir. Andy Muschietti', footer: 'Film: 2017 &middot; Book Wins' },
      { file: 'the-haunting-of-hill-house.html', image: 'the-haunting-of-hill-house.jpg', genre: 'Horror / Drama', title: 'The Haunting of Hill House', author: 'Shirley Jackson &mdash; dir. Mike Flanagan', footer: 'Netflix: 2018 &middot; Too Close to Call' },
      { file: 'pet-sematary-2019.html', image: 'pet-sematary-2019.jpg', genre: 'Horror', title: 'Pet Sematary', author: 'Stephen King &mdash; John Lithgow stars', footer: 'Film: 2019 &middot; Book Wins' },
      { file: 'geralds-game.html', image: 'geralds-game.jpg', genre: 'Horror / Thriller', title: "Gerald's Game", author: 'Stephen King &mdash; Carla Gugino stars', footer: 'Netflix: 2017 &middot; Book Wins' },
      { file: 'doctor-sleep.html', image: 'doctor-sleep.jpg', genre: 'Horror / Drama', title: 'Doctor Sleep', author: 'Stephen King &mdash; Ewan McGregor stars', footer: 'Film: 2019 &middot; Book Wins' },
      { file: 'the-outsider.html', image: 'the-outsider.jpg', genre: 'Horror / Crime', title: 'The Outsider', author: 'Stephen King &mdash; Ben Mendelsohn stars', footer: 'HBO: 2020 &middot; Book Wins' },
      { file: "rosemarys-baby.html", image: 'rosemarys-baby.jpg', genre: 'Horror / Psychological Thriller', title: "Rosemary's Baby", author: 'Ira Levin &mdash; dir. Roman Polanski', footer: 'Film: 1968 &middot; Too Close to Call' },
      { file: 'hannibal-series.html', image: 'hannibal.jpg', genre: 'Horror / Crime Thriller', title: 'Hannibal', author: 'Thomas Harris &mdash; Mads Mikkelsen stars', footer: 'NBC: 2013 &middot; Book Wins' },
    ]
  },
  {
    heading: 'Historical Fiction &amp; War — New',
    pages: [
      { file: 'the-book-thief.html', image: 'the-book-thief.jpg', genre: 'Historical Fiction / War Drama', title: 'The Book Thief', author: 'Markus Zusak &mdash; dir. Brian Percival', footer: 'Film: 2013 &middot; Book Wins' },
      { file: 'all-the-light-we-cannot-see.html', image: 'all-the-light-we-cannot-see.jpg', genre: 'Historical Fiction / War Drama', title: 'All the Light We Cannot See', author: 'Anthony Doerr &mdash; Aria Mia Loberti stars', footer: 'Netflix: 2023 &middot; Book Wins' },
      { file: 'all-quiet-on-the-western-front.html', image: 'all-quiet-on-the-western-front.jpg', genre: 'War / Historical Fiction', title: 'All Quiet on the Western Front', author: 'Erich Maria Remarque &mdash; dir. Edward Berger', footer: 'Film: 2022 &middot; Too Close to Call' },
      { file: 'wolf-hall.html', image: 'wolf-hall.jpg', genre: 'Historical Fiction', title: 'Wolf Hall', author: 'Hilary Mantel &mdash; Mark Rylance stars', footer: 'BBC: 2015 &middot; Book Wins' },
      { file: 'shogun-2024.html', image: 'shogun-2024.jpg', genre: 'Historical Fiction / Adventure', title: 'Shogun', author: 'James Clavell &mdash; Hiroyuki Sanada stars', footer: 'FX/Hulu: 2024 &middot; Book Wins' },
      { file: 'the-pillars-of-the-earth.html', image: 'the-pillars-of-the-earth.jpg', genre: 'Historical Fiction', title: 'The Pillars of the Earth', author: 'Ken Follett &mdash; Eddie Redmayne stars', footer: 'Starz: 2010 &middot; Book Wins' },
      { file: 'the-help.html', image: 'the-help.jpg', genre: 'Historical Fiction / Drama', title: 'The Help', author: 'Kathryn Stockett &mdash; Viola Davis stars', footer: 'Film: 2011 &middot; Book Wins' },
    ]
  },
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
    <nav><a href="/">Home</a> &nbsp;&middot;&nbsp; <a href="/index_alt.html">Browse All</a> &nbsp;&middot;&nbsp; <a href="/about.html">About</a></nav>
  </div>
</header>

<div class="home-hero">
  <h1>The book was<br><em>probably</em> better.</h1>
  <p>Honest, in-depth comparisons of books and their film adaptations. What each version does well. What gets lost. Whether to read first.</p>
</div>

${sections}

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
  const output = buildIndex();
  fs.writeFileSync(path.join(process.cwd(), 'index.html'), output, 'utf8');
  const total = SECTIONS.reduce((sum, s) => sum + s.pages.length, 0);
  console.log(`✅ index.html rebuilt — ${total} pages across ${SECTIONS.length} sections.`);
  SECTIONS.forEach(s => console.log(`   • ${s.heading}: ${s.pages.length} pages`));
}

main();
