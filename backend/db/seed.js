/* ============================================
   db/seed.js — Seed Sample Data
   Run: node backend/db/seed.js
============================================ */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./connection');

// We'll use inline schemas here for simplicity
const bcrypt = require('bcryptjs');

const seed = async () => {
  await connectDB();
  const db = mongoose.connection.db;

  console.log('🌱 Starting seed...\n');

  // Clear existing data
  await db.collection('users').deleteMany({});
  await db.collection('novels').deleteMany({});
  await db.collection('chapters').deleteMany({});
  await db.collection('comments').deleteMany({});
  await db.collection('ratings').deleteMany({});
  console.log('🗑  Cleared existing collections');

  // ─── Seed Users ───────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  const users = await db.collection('users').insertMany([
    {
      username: 'marcus_vale', email: 'marcus@grimtales.com',
      password: passwordHash, role: 'author',
      bio: 'Weaving darkness into prose since 2018. Dark fantasy and political intrigue.',
      location: 'Edinburgh, Scotland', isVerified: true, isEmailVerified: true,
      followers: [], following: [], library: [], createdAt: new Date('2018-01-10'),
    },
    {
      username: 'lyra_mourne', email: 'lyra@grimtales.com',
      password: passwordHash, role: 'author',
      bio: 'Gothic romance author. Court of Bleeding Stars is my magnum opus.',
      location: 'Dublin, Ireland', isVerified: true, isEmailVerified: true,
      followers: [], following: [], library: [], createdAt: new Date('2019-03-22'),
    },
    {
      username: 'shadowreader92', email: 'shadow@example.com',
      password: passwordHash, role: 'reader',
      bio: 'Dark fantasy reader since forever.',
      location: 'London, UK', isVerified: false, isEmailVerified: true,
      followers: [], following: [], library: [], createdAt: new Date('2024-01-15'),
    },
    {
      username: 'nocturnalist', email: 'nocturnal@example.com',
      password: passwordHash, role: 'reader',
      bio: 'Reading in the dark, always.',
      location: 'New York, USA', isVerified: false, isEmailVerified: true,
      followers: [], following: [], library: [], createdAt: new Date('2024-02-08'),
    },
  ]);

  const [marcus, lyra, reader1, reader2] = users.insertedIds;
  console.log(`✅ Seeded ${Object.keys(users.insertedIds).length} users`);

  // ─── Seed Novels ──────────────────────────
  const novels = await db.collection('novels').insertMany([
    {
      title: 'The Obsidian Court', slug: 'the-obsidian-court',
      author: marcus, synopsis: 'In a kingdom where shadows hold more power than swords, a disgraced nobleman must navigate the treacherous politics of the Obsidian Court — where every ally is a potential assassin, and every secret costs a piece of your soul.',
      cover: '', genres: ['Dark Fantasy', 'Political Intrigue'], tags: ['anti-hero', 'magic system', 'court intrigue', 'slow burn', 'dark mc'],
      status: 'ongoing', contentRating: 'mature', language: 'English',
      totalViews: 1240000, totalChapters: 284, totalWords: 842000,
      avgRating: 4.8, totalRatings: 3240, isFeatured: true, isVisible: true,
      lastChapterAt: new Date(), createdAt: new Date('2023-03-14'),
    },
    {
      title: 'Court of Bleeding Stars', slug: 'court-of-bleeding-stars',
      author: lyra, synopsis: 'A gothic romance set in a dying celestial empire where the last empress must choose between love and the survival of her people.',
      cover: '', genres: ['Gothic Romance', 'Dark Fantasy'], tags: ['gothic', 'romance', 'celestial', 'tragedy', 'completed'],
      status: 'completed', contentRating: 'mature', language: 'English',
      totalViews: 5100000, totalChapters: 445, totalWords: 1340000,
      avgRating: 4.7, totalRatings: 8840, isFeatured: false, isVisible: true,
      lastChapterAt: new Date('2024-08-15'), createdAt: new Date('2021-06-01'),
    },
    {
      title: 'Pale Kings Rising', slug: 'pale-kings-rising',
      author: marcus, synopsis: 'The prequel to The Obsidian Court. Five centuries before the events of the main series, the first Pale King rises from the ashes of a fallen civilisation.',
      cover: '', genres: ['Dark Fantasy', 'Historical'], tags: ['prequel', 'dark fantasy', 'epic', 'completed', 'magic system'],
      status: 'completed', contentRating: 'mature', language: 'English',
      totalViews: 3800000, totalChapters: 512, totalWords: 1560000,
      avgRating: 4.9, totalRatings: 6120, isFeatured: false, isVisible: true,
      lastChapterAt: new Date('2023-12-01'), createdAt: new Date('2020-11-20'),
    },
  ]);

  const [novel1, novel2, novel3] = Object.values(novels.insertedIds);
  console.log(`✅ Seeded ${Object.keys(novels.insertedIds).length} novels`);

  // ─── Seed Chapters ────────────────────────
  const chapterData = [
    { novel: novel1, author: marcus, title: 'The Fall of House Morn', number: 1, isPublished: true, wordCount: 4200, views: 280000, content: 'The execution order came on parchment stained with the King\'s seal — red wax pressed in the shape of a crown that looked, to Kael Morn\'s eyes, exactly like a wound...' },
    { novel: novel1, author: marcus, title: 'The Exiled Road', number: 2, isPublished: true, wordCount: 3800, views: 240000, content: 'He rode out in the grey morning...' },
    { novel: novel1, author: marcus, title: 'The Court of Shadows', number: 3, isPublished: true, wordCount: 4100, views: 210000, content: 'The Obsidian Court was not a place you found. It found you...' },
  ];

  const chapters = await db.collection('chapters').insertMany(
    chapterData.map(c => ({ ...c, publishedAt: new Date(), createdAt: new Date() }))
  );
  console.log(`✅ Seeded ${Object.keys(chapters.insertedIds).length} chapters`);

  const [ch1] = Object.values(chapters.insertedIds);

  // ─── Seed Comments ────────────────────────
  await db.collection('comments').insertMany([
    {
      chapter: ch1, novel: novel1, author: reader1,
      text: "The ending of this chapter hit me harder than I expected. The moment Kael burns the execution order — pure character establishment.",
      likes: [reader2], parentComment: null, isDeleted: false, isHidden: false, createdAt: new Date(),
    },
    {
      chapter: ch1, novel: novel1, author: reader2,
      text: "Marcus Vale writes political intrigue unlike anyone else on this platform. I read chapter 2 immediately after finishing this.",
      likes: [], parentComment: null, isDeleted: false, isHidden: false, createdAt: new Date(),
    },
  ]);
  console.log('✅ Seeded comments');

  // ─── Seed Ratings ─────────────────────────
  await db.collection('ratings').insertMany([
    { user: reader1, novel: novel1, score: 5, review: 'Absolutely phenomenal. Best dark fantasy on the platform.', createdAt: new Date() },
    { user: reader2, novel: novel1, score: 5, review: 'The political intrigue is unmatched.', createdAt: new Date() },
    { user: reader1, novel: novel2, score: 5, review: 'Lyra Mourne is a genius.', createdAt: new Date() },
  ]);
  console.log('✅ Seeded ratings');

  console.log('\n✨ Seed complete!\n');
  console.log('─────────────────────────────');
  console.log('Test accounts:');
  console.log('  Author:  marcus@grimtales.com / password123');
  console.log('  Author:  lyra@grimtales.com / password123');
  console.log('  Reader:  shadow@example.com / password123');
  console.log('─────────────────────────────\n');

  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
