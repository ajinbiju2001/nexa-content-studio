'use client';
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Download, Play, Search, Loader, TriangleAlert, Trash2, RefreshCw } from 'lucide-react';

type VideoItem = {
  id: string;
  title: string;
  category: string;
  channel?: string;
  created_at: string;
  video_url: string | null;
  thumbnail_url: string | null;
  status?: string;
  warnings?: string[];
  provider?: string;
};

const providerColor: Record<string, string> = {
  openai: '#10b981', groq: '#f59e0b', ollama: '#06b6d4', fallback: '#8888aa',
};

export default function LibraryPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [channelFilter, setChannelFilter] = useState('All');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadVideos = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/videos`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load videos.');
      setVideos(data.videos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVideos(); }, [apiBaseUrl]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${apiBaseUrl}/videos/${id}`, { method: 'DELETE' });
      if (res.ok) setVideos(v => v.filter(x => x.id !== id));
    } catch { alert('Delete failed.'); }
    finally { setDeletingId(null); }
  };

  const cats = useMemo(() => ['All', ...Array.from(new Set(videos.map(v => v.category).filter(Boolean)))], [videos]);
  const channels = useMemo(() => ['All', ...Array.from(new Set(videos.map(v => v.channel || 'Unassigned')))], [videos]);
  const filtered = useMemo(() => videos.filter(v => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || v.category === catFilter;
    const matchChan = channelFilter === 'All' || (v.channel || 'Unassigned') === channelFilter;
    return matchSearch && matchCat && matchChan;
  }), [videos, search, catFilter, channelFilter]);

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Video Library</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{videos.length} saved projects</p>
        </div>
        <button onClick={loadVideos} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'DM Sans, sans-serif' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="glass-static" style={{ borderRadius: 14, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px' }}>
          <Search size={14} color="var(--text-muted)" />
          <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', flex: 1, fontFamily: 'DM Sans, sans-serif' }} placeholder="Search videos..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', background: catFilter === c ? 'var(--accent-1)' : 'transparent', color: catFilter === c ? 'white' : 'var(--text-secondary)', transition: 'all 0.15s' }}>{c}</button>
          ))}
        </div>
        <select className="nexa-select" value={channelFilter} onChange={e => setChannelFilter(e.target.value)}>
          {channels.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-static" style={{ borderRadius: 14, padding: '32px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
          <Loader size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Loading your saved videos...
        </div>
      ) : error ? (
        <div className="glass-static" style={{ borderRadius: 14, padding: '20px', border: '1px solid rgba(244,63,94,0.25)', background: 'rgba(244,63,94,0.06)', display: 'flex', gap: 10 }}>
          <TriangleAlert size={16} color="var(--accent-danger)" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent-danger)', marginBottom: 4, fontSize: 14 }}>Library failed to load</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{error}</div>
            <button onClick={loadVideos} style={{ marginTop: 8, fontSize: 12, color: 'var(--accent-1)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', padding: 0, fontWeight: 600 }}>Try again →</button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{videos.length === 0 ? 'No videos yet' : 'No videos match filters'}</div>
          <div style={{ fontSize: 13 }}>{videos.length === 0 ? 'Generate your first video from the Create page.' : 'Try changing your search or filters.'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
          {filtered.map(video => {
            const date = new Date(video.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const isDeleting = deletingId === video.id;
            return (
              <div key={video.id} className="glass card-lift" style={{ borderRadius: 14, overflow: 'hidden', opacity: isDeleting ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                <div style={{ height: 200, background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(15,23,42,0.9))', position: 'relative', overflow: 'hidden' }}>
                  {video.thumbnail_url && <img src={video.thumbnail_url} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                  {video.video_url ? (
                    <a href={video.video_url} target="_blank" rel="noreferrer" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', textDecoration: 'none' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={18} color="#020617" fill="#020617" />
                      </div>
                    </a>
                  ) : (
                    <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>FFmpeg needed for MP4</div>
                  )}
                  <span className="badge" style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(15,23,42,0.75)', color: '#fff', backdropFilter: 'blur(6px)' }}>{video.category}</span>
                  {video.provider && <span className="badge" style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)', color: providerColor[video.provider] || '#888' }}>{video.provider}</span>}
                </div>
                <div style={{ padding: '14px' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 5, lineHeight: 1.4, color: 'var(--text-primary)' }}>{video.title}</h4>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{video.channel || 'Unassigned'} · {date}</div>
                  {video.warnings && video.warnings.length > 0 && (
                    <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 10, padding: '5px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                      ⚠️ {video.warnings[0]}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: video.status === 'ready' ? 'var(--accent-success)' : '#f59e0b' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{video.status || 'partial'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {video.video_url ? (
                      <a href={video.video_url} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12 }}>
                        <Play size={12} /> Watch
                      </a>
                    ) : (
                      <div style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px dashed var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>Pending Render</div>
                    )}
                    {video.video_url && (
                      <a href={video.video_url} download style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <Download size={12} />
                      </a>
                    )}
                    <button onClick={() => handleDelete(video.id)} disabled={isDeleting} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--accent-danger)', transition: 'all 0.15s' }}>
                      {isDeleting ? <Loader size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
