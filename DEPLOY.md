# ☁️ Nexa Content Studio — Full Cloud Deployment Guide

Everything runs in the cloud. Zero files on your Mac after setup.

---

## 🗺️ What We're Deploying

| Part | Platform | Cost |
|---|---|---|
| Frontend (Next.js) | **Vercel** | Free |
| Backend (Express) | **Railway** | Free $5 credit/month |
| File Storage (videos, thumbnails) | **Cloudinary** | Free 25GB |
| Database (replaces videos.json) | **Supabase** | Free 500MB |
| AI Script Generation | **Groq** | Free 14,400 req/day |

**Total = $0/month to start** ✅

---

## STEP 1 — Set Up Supabase (Database)

1. Go to **https://supabase.com** → Sign up free
2. Click **New Project** → name it `nexa-studio`
3. Choose a region close to you → Create project (takes ~1 min)
4. Go to **Settings → API** → copy:
   - `Project URL` → this is your `SUPABASE_URL`
   - `anon public` key → this is your `SUPABASE_ANON_KEY`

5. Go to **SQL Editor** → New Query → paste this and click Run:

```sql
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  channel TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  video_url TEXT,
  thumbnail_url TEXT,
  script TEXT,
  provider TEXT,
  status TEXT DEFAULT 'partial',
  warnings JSONB DEFAULT '[]'
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON videos FOR ALL USING (true);
```

✅ Database ready!

---

## STEP 2 — Set Up Cloudinary (File Storage)

1. Go to **https://cloudinary.com** → Sign up free
2. After login → go to **Dashboard**
3. Copy these 3 values:
   - `Cloud Name`
   - `API Key`
   - `API Secret`

✅ Storage ready!

---

## STEP 3 — Set Up Groq (Free AI — 14,400 req/day)

1. Go to **https://groq.com** → Sign up free
2. Go to **API Keys** → Create API Key
3. Copy the key (starts with `gsk_...`)

✅ Free AI ready!

---

## STEP 4 — Deploy Backend to Railway

1. Go to **https://railway.app** → Sign up with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your `Nexa` repo
4. Railway auto-detects the `railway.toml` and starts building

5. After deploy → go to **Variables** tab → add all these:

```
BACKEND_PORT=4000
NEXA_AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_URL=https://your-app.vercel.app
```

6. Go to **Settings → Networking → Generate Domain**
   - You get a URL like: `https://nexa-backend-production.up.railway.app`
   - Copy this URL — you need it for Vercel

✅ Backend live!

---

## STEP 5 — Deploy Frontend to Vercel

### Option A — Vercel CLI (easiest from VS Code)

```bash
# Install Vercel CLI
npm install -g vercel

# In your project folder
cd nexa-content-studio
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: nexa-content-studio
# - Which directory: ./
# - Override settings? No
```

### Option B — Vercel Dashboard

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **Add New Project → Import Git Repository**
3. Select your `Nexa` repo
4. Set **Environment Variables**:

```
NEXT_PUBLIC_API_BASE_URL=https://your-railway-app.up.railway.app/api
```

5. Click **Deploy**

✅ Frontend live!

---

## STEP 6 — Update CORS on Railway

Now that Vercel gave you a URL (e.g. `https://nexa-content-studio.vercel.app`):

1. Go back to **Railway → Variables**
2. Update `FRONTEND_URL`:
```
FRONTEND_URL=https://nexa-content-studio.vercel.app
```
3. Railway auto-redeploys

✅ Everything connected!

---

## STEP 7 — Test Everything

Open your Vercel URL in browser.

Test checklist:
- [ ] Login page loads
- [ ] Dashboard loads
- [ ] Create page shows "Backend connected" (green dot)
- [ ] Generate a video → script appears
- [ ] Thumbnail appears (from Cloudinary)
- [ ] Library shows saved videos

---

## 🔧 Local Development (still works!)

For developing on your Mac:

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your keys in `.env`

3. Run both servers:
```bash
# Terminal 1 — Backend
npm run backend:start

# Terminal 2 — Frontend
npm run dev
```

4. Open http://localhost:3000

---

## 🆓 Free Tier Limits

| Service | Free Limit | Enough For? |
|---|---|---|
| Vercel | Unlimited deploys | ✅ Yes |
| Railway | $5/month credit | ✅ ~500 video generations |
| Cloudinary | 25GB storage, 25k transforms | ✅ ~2,000 thumbnails |
| Supabase | 500MB database | ✅ ~50,000 videos |
| Groq | 14,400 requests/day | ✅ 14,400 scripts/day |

---

## 🐛 Troubleshooting

**"Backend offline" on Create page:**
- Check Railway deploy logs
- Make sure all env vars are set

**Thumbnails not showing:**
- Check Cloudinary credentials in Railway env vars
- Look for Cloudinary errors in Railway logs

**Videos not saving:**
- Check Supabase SQL table was created (Step 1)
- Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Railway

**CORS error in browser console:**
- Make sure `FRONTEND_URL` in Railway matches your Vercel URL exactly

---

## 📁 Files Added in This Update

```
nexa-content-studio/
├── railway.toml                          ← Railway deployment config
├── vercel.json                           ← Vercel deployment config
├── .env.example                          ← Updated with all new keys
├── backend/
│   ├── server.js                         ← Fixed CORS + startup logs
│   ├── services/
│   │   ├── openaiService.js              ← Fixed + Groq + Ollama support
│   │   ├── cloudinaryService.js          ← NEW: cloud file storage
│   │   ├── supabaseService.js            ← NEW: cloud database
│   │   ├── thumbnailService.js           ← Uploads SVG to Cloudinary
│   │   └── videoGenerationService.js     ← Uploads MP4 to Cloudinary
│   ├── controllers/
│   │   └── videoController.js            ← Added DELETE endpoint
│   └── routes/index.js                   ← Added DELETE /videos/:id
└── src/app/
    ├── create/page.tsx                   ← Fixed duration + preview scroll
    └── library/page.tsx                  ← Real delete button + Cloudinary URLs
```

---

Built with ❤️ — Nexa Content Studio v2.0 Cloud Edition
