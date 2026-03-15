require('dotenv').config();

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');

const app = express();
const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 8080);

// ─── CORS ─────────────────────────────────────────────────────────────────────
// ✅ FIXED: locked to your frontend URL only (not open to all origins)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In production, allow Vercel preview URLs too
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health & info routes ─────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'nexa-backend',
    version: '2.0.0',
    message: 'Nexa Content Studio backend is running.',
    storage: {
      cloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME),
      supabase: !!(process.env.SUPABASE_URL),
    },
    ai: {
      provider: process.env.NEXA_AI_PROVIDER || 'free',
      groq: !!(process.env.GROQ_API_KEY),
      openai: !!(process.env.OPENAI_API_KEY),
    },
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'nexa-backend', time: new Date().toISOString() });
});

app.get('/api', (_req, res) => {
  res.json({
    ok: true,
    endpoints: [
      'POST /api/generate-script',
      'POST /api/generate-thumbnail',
      'POST /api/generate-video',
      'GET  /api/videos',
      'DELETE /api/videos/:id',
    ],
  });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', message: 'This route does not exist.' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[nexa error]', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {  console.log(`\n🚀 Nexa backend running on http://localhost:${PORT}`);
  console.log(`   Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ configured' : '⚠️  not configured (thumbnails will use placeholder)'}`);
  console.log(`   Supabase:   ${process.env.SUPABASE_URL ? '✅ configured' : '⚠️  not configured (using in-memory store)'}`);
  console.log(`   AI:         ${process.env.GROQ_API_KEY ? '✅ Groq (free)' : process.env.OPENAI_API_KEY ? '✅ OpenAI' : '⚠️  fallback mode'}\n`);
});
