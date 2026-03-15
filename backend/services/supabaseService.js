const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getClient() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null; // Will fall back to in-memory storage
  }

  _client = createClient(url, key);
  return _client;
}

function isConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

// ─── In-memory fallback (used when Supabase not configured) ──────────────────
// This keeps videos in memory during the server session
const memoryStore = [];

// ─── Database operations ─────────────────────────────────────────────────────

async function getAllVideos() {
  const client = getClient();

  if (!client) {
    console.warn('[nexa] Supabase not configured. Using in-memory store.');
    return [...memoryStore].reverse();
  }

  const { data, error } = await client
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[nexa] Supabase read error:', error.message);
    return [...memoryStore].reverse();
  }

  return data || [];
}

async function insertVideo(video) {
  const client = getClient();

  if (!client) {
    memoryStore.push(video);
    return video;
  }

  const { data, error } = await client
    .from('videos')
    .insert([video])
    .select()
    .single();

  if (error) {
    console.error('[nexa] Supabase insert error:', error.message);
    memoryStore.push(video);
    return video;
  }

  return data;
}

async function deleteVideo(id) {
  const client = getClient();

  if (!client) {
    const idx = memoryStore.findIndex(v => v.id === id);
    if (idx !== -1) memoryStore.splice(idx, 1);
    return true;
  }

  const { error } = await client.from('videos').delete().eq('id', id);

  if (error) {
    console.error('[nexa] Supabase delete error:', error.message);
    return false;
  }

  return true;
}

async function getVideoById(id) {
  const client = getClient();

  if (!client) {
    return memoryStore.find(v => v.id === id) || null;
  }

  const { data, error } = await client
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

// ─── SQL for Supabase table setup ────────────────────────────────────────────
// Run this once in your Supabase SQL editor:
const SETUP_SQL = `
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

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict later with auth)
CREATE POLICY "Allow all" ON videos FOR ALL USING (true);
`;

module.exports = {
  isConfigured,
  getAllVideos,
  insertVideo,
  deleteVideo,
  getVideoById,
  SETUP_SQL,
};
