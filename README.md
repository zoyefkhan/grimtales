# 🩸 GrimTales — Gothic Dark Fantasy Novel Platform

A complete, production-ready novel reading website. **Mysterious Gothic / Charcoal & Crimson** aesthetic.
Built with vanilla HTML/CSS/JS frontend + Node.js + Express + MongoDB backend.

---

## 📁 Complete File Structure (51 files)

```
grimtales/
│
├── FRONTEND HTML (13 pages)
├── index.html              ← Homepage: hero, featured, trending, genres
├── browse.html             ← Browse with filters, grid/list toggle, pagination
├── search.html             ← Search: novels, authors, tags tabs
├── novel-detail.html       ← Novel info, chapters list, comments, similar
├── chapter-read.html       ← Immersive reader: font/theme settings, progress
├── author-profile.html     ← Author bio, novels, stats, follow
├── user-profile.html       ← Reader: library, history, badges, following
├── dashboard.html          ← Author: stats, novel manager, chapter editor
├── settings.html           ← Account, notifications, reading prefs, privacy
├── notifications.html      ← All notifications with filters
├── login.html              ← Sign in page
├── register.html           ← Create account page
├── 404.html                ← Not found page
│
├── CSS (8 files)
├── css/global.css          ← Variables, typography, buttons, utilities
├── css/navbar.css          ← Navigation, mobile menu, search, user avatar
├── css/home.css            ← Hero, cards, trending, genres, newsletter, footer
├── css/reader.css          ← Reader layout, settings panel, comments
├── css/browse.css          ← Filters sidebar, grid/list views, pagination
├── css/auth.css            ← Login/register two-column layout
├── css/dashboard.css       ← Sidebar, stats, editor, activity feed
├── css/novel-detail.css    ← Novel hero, chapters list, sidebar panels
│
├── JAVASCRIPT (13 files)
├── js/app.js               ← Core: theme, navbar, user dropdown, mock data
├── js/home.js              ← Particles, grids, trending, counters
├── js/reader.js            ← Progress bar, font/theme settings, bookmarks
├── js/browse.js            ← Filters, search, grid/list toggle, pagination
├── js/search.js            ← Search tabs (novels, authors, tags), URL sync
├── js/novel.js             ← Synopsis toggle, chapters, follow/bookmark/rate
├── js/comments.js          ← Comments with likes, replies
├── js/auth.js              ← Login/register forms, password strength
├── js/dashboard.js         ← Panel switching, novel manager, editor
├── js/author.js            ← Author novels grid, recent updates, follow
├── js/user-profile.js      ← Library, history, badges, following tabs
├── js/settings.js          ← Panel switching, genre toggles, save handlers
├── js/notifications.js     ← Notification list, filters, mark as read
│
├── BACKEND (12 files)
├── backend/server.js               ← Entry point
├── backend/app.js                  ← Middleware, routes, error handlers
├── backend/db/connection.js        ← MongoDB connection
├── backend/db/seed.js              ← Sample data seeder
├── backend/config/cloudinary.js    ← Cloudinary SDK configuration
├── backend/utils/email.js          ← All transactional emails
├── backend/utils/cloudinary.js     ← Upload cover, avatar, optimize
├── backend/models/models.js        ← All 6 database models
├── backend/routes/routes.js        ← All API routes
├── backend/controllers/controllers.js ← All business logic
├── backend/middleware/middleware.js ← JWT auth, upload, rate limit
│
├── CONFIG (7 files)
├── package.json
├── .env.example
├── .gitignore
├── vercel.json
├── railway.toml
├── sitemap.xml
└── README.md
```

---

## 🚀 Quick Start

### Open frontend instantly (no install needed)
```bash
npx live-server --port=3000 --open=index.html
```

### Setup backend
```bash
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
node backend/db/seed.js  # seed sample data
```

---

## 🛠 Free Services

| Service | Purpose | URL |
|---------|---------|-----|
| MongoDB Atlas | Database | mongodb.com/atlas |
| Cloudinary | Images | cloudinary.com |
| Vercel | Frontend host | vercel.com |
| Railway | Backend host | railway.app |
| Resend | Email | resend.com |

---

## 🌐 Deploy

**Frontend → Vercel:** Push to GitHub → Import on vercel.com → Done

**Backend → Railway:** Connect GitHub → Add .env vars → npm start

---

## ✨ Features

- Gothic Charcoal & Crimson design with grain overlay & particles
- Immersive reader: font size/family/theme/line-height settings
- Browse with genre filters, status, rating, grid/list views
- Search page with novels/authors/tags tabs
- Author dashboard with stats, novel manager, rich text editor
- Comment sections with likes on every chapter and novel
- Bookmarks, reading progress, reading history
- User badges and achievement system
- Notifications with filters and mark-all-read
- Full settings: profile, account, notifications, reading prefs, privacy
- Dark/Light mode toggle (localStorage)
- Fully responsive — mobile, tablet, desktop
- JWT auth with email verification and password reset
- Transactional emails (welcome, reset, chapter alerts)
- Rate limiting & security headers

---

## 🎨 Design System

Fonts: Cinzel Decorative · Cinzel · Crimson Text · EB Garamond

Colors:
  --black:        #0a0a0b
  --charcoal:     #1a1a1e
  --crimson:      #8b1a1a
  --crimson-glow: #e74c3c
  --gold:         #c9a84c
  --white:        #f0eee8

---

*Crafted in darkness. © 2026 GrimTales*
