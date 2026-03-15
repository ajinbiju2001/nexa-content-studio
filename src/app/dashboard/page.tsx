'use client';
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import {
  Video, Download, Tv2, TrendingUp, Plus,
  Play, MoreHorizontal, Sparkles, ArrowUpRight, Zap, Loader, TriangleAlert,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getSession, SESSION_EVENT } from '@/lib/session';

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

const dateRanges = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Custom'];
const chartSeries = [
  { key: 'videos', label: 'Videos Generated', color: '#6366f1' },
  { key: 'ready', label: 'Ready Videos', color: '#a855f7' },
];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getRangeDays(range: string) {
  if (range === 'Last 30 days') return 30;
  if (range === 'Last 90 days') return 90;
  return 7;
}

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [dateRange, setDateRange] = useState('Last 7 days');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('Creator');
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

  useEffect(() => {
    const syncSession = () => {
      const session = getSession();
      if (session?.name) setDisplayName(session.name);
    };

    syncSession();
    window.addEventListener(SESSION_EVENT, syncSession);
    return () => window.removeEventListener(SESSION_EVENT, syncSession);
  }, []);

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${apiBaseUrl}/videos`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load dashboard data.');
        setVideos(data.videos || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [apiBaseUrl]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(videos.map(video => video.category).filter(Boolean)))],
    [videos]
  );

  const filtered = useMemo(
    () => (activeCategory === 'All' ? videos : videos.filter(video => video.category === activeCategory)),
    [activeCategory, videos]
  );

  const stats = useMemo(() => {
    const thisWeekCutoff = startOfDay(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
    const totalVideos = videos.length;
    const weeklyVideos = videos.filter(video => new Date(video.created_at) >= thisWeekCutoff).length;
    const channels = new Set(videos.map(video => video.channel || 'Unassigned')).size;
    const readyVideos = videos.filter(video => video.status === 'ready').length;

    return [
      { label: 'Total Videos', value: String(totalVideos), change: `${filtered.length} shown`, icon: Video, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
      { label: 'This Week', value: String(weeklyVideos), change: 'Last 7 days', icon: TrendingUp, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
      { label: 'Channels', value: String(channels), change: channels ? 'Active' : 'No channels', icon: Tv2, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
      { label: 'Ready Videos', value: String(readyVideos), change: `${Math.max(totalVideos - readyVideos, 0)} pending`, icon: Download, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    ];
  }, [filtered.length, videos]);

  const chartData = useMemo(() => {
    const days = getRangeDays(dateRange);
    const today = startOfDay(new Date());
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));

    const buckets = new Map<string, { day: string; videos: number; ready: number }>();

    for (let i = 0; i < days; i += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const key = day.toISOString().slice(0, 10);
      buckets.set(key, {
        day: day.toLocaleDateString('en-US', {
          weekday: days <= 7 ? 'short' : undefined,
          month: days > 7 ? 'short' : undefined,
          day: 'numeric',
        }),
        videos: 0,
        ready: 0,
      });
    }

    videos.forEach(video => {
      const created = new Date(video.created_at);
      const key = startOfDay(created).toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) return;
      bucket.videos += 1;
      if (video.status === 'ready') bucket.ready += 1;
    });

    return Array.from(buckets.values());
  }, [dateRange, videos]);

  return (
    <DashboardLayout>
      <div className="glass gradient-border dashboard-hero" style={{ borderRadius: 16, padding: '24px 28px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div className="glow-orb" style={{ width: 300, height: 300, background: '#6366f1', top: -100, right: -50, opacity: 0.1 }} />
        <div className="dashboard-hero-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Sparkles size={16} color="var(--accent-1)" />
              <span style={{ fontSize: 12, color: 'var(--accent-1)', fontWeight: 600, letterSpacing: '0.08em' }}>WELCOME BACK</span>
            </div>
            <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              Good morning, {displayName} 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Track your real video output, render status, and saved projects in one place.
            </p>
          </div>
          <div className="dashboard-hero-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/create')} className="btn-gradient" style={{ padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Sans, sans-serif' }}>
              <Zap size={14} /> Generate Video
            </button>
            <button onClick={() => router.push('/library')} style={{ padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} /> Open Library
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass card-lift" style={{ borderRadius: 14, padding: '20px', borderTop: `2px solid ${stat.color}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={stat.color} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: stat.color, background: `${stat.color}18`, padding: '3px 8px', borderRadius: 999 }}>
                  {stat.change}
                </span>
              </div>
              <div className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 2 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 280px)', gap: 20, marginBottom: 28 }}>
        <div className="glass-static" style={{ borderRadius: 14, padding: '20px' }}>
          <div className="dashboard-section-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>Performance From Real Projects</h3>
            <div className="dashboard-date-filters" style={{ display: 'flex', gap: 6 }}>
              {dateRanges.slice(0, 3).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 500,
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                    background: dateRange === range ? 'var(--accent-1)' : 'transparent',
                    color: dateRange === range ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  {range.replace('Last ', '')}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="videos" stroke="#6366f1" strokeWidth={2} fill="url(#gv)" />
              <Area type="monotone" dataKey="ready" stroke="#a855f7" strokeWidth={2} fill="url(#gr)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="dashboard-chart-legend" style={{ display: 'flex', gap: 20, marginTop: 8 }}>
            {chartSeries.map(series => (
              <div key={series.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                <div style={{ width: 10, height: 3, background: series.color, borderRadius: 999 }} />
                {series.label}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-static" style={{ borderRadius: 14, padding: '20px' }}>
          <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'AI Idea Generator', icon: '💡', path: '/create?mode=ai' },
              { label: 'Cartoon Story', icon: '🎭', path: '/create?mode=cartoon' },
              { label: 'Bulk Shorts', icon: '⚡', path: '/create?mode=bulk' },
              { label: 'Make Thumbnail', icon: '🖼️', path: '/thumbnails' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => router.push(action.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 18 }}>{action.icon}</span>
                <span style={{ flex: 1 }}>{action.label}</span>
                <ArrowUpRight size={14} color="var(--text-muted)" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="dashboard-videos-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>Generated Videos</h2>
          <div className="dashboard-category-filters" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  background: activeCategory === category ? 'var(--accent-1)' : 'transparent',
                  color: activeCategory === category ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="glass-static" style={{ borderRadius: 14, padding: '28px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
            <Loader size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Loading dashboard data...
          </div>
        ) : error ? (
          <div className="glass-static" style={{ borderRadius: 14, padding: '20px', border: '1px solid rgba(244,63,94,0.25)', background: 'rgba(244,63,94,0.06)', display: 'flex', gap: 10 }}>
            <TriangleAlert size={16} color="var(--accent-danger)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--accent-danger)', marginBottom: 4, fontSize: 14 }}>Dashboard data failed to load</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{error}</div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-static" style={{ borderRadius: 14, padding: '36px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              {videos.length === 0 ? 'No real videos yet' : 'No videos match this category'}
            </div>
            <div style={{ fontSize: 13 }}>
              {videos.length === 0 ? 'Create your first video and it will appear here automatically.' : 'Try a different category filter.'}
            </div>
          </div>
        ) : (
          <div className="dashboard-videos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            <button
              onClick={() => router.push('/create')}
              className="glass card-lift"
              style={{
                borderRadius: 14,
                padding: '0',
                border: '2px dashed var(--border)',
                background: 'transparent',
                cursor: 'pointer',
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={20} color="var(--accent-1)" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Create New Video</span>
            </button>

            {filtered.map(video => (
              <div key={video.id} className="glass card-lift" style={{ borderRadius: 14, overflow: 'hidden' }}>
                <div className="thumb-placeholder" style={{ height: 130, background: 'linear-gradient(135deg, rgba(99,102,241,0.28), rgba(15,23,42,0.88))', position: 'relative' }}>
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎬</div>
                  )}
                  {video.video_url && (
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', background: 'rgba(2,6,23,0.16)' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={16} color="#000" fill="#000" />
                      </div>
                    </a>
                  )}
                  <span className="badge" style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(15,23,42,0.75)', color: '#fff', backdropFilter: 'blur(8px)' }}>
                    {video.category}
                  </span>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.4, color: 'var(--text-primary)' }}>{video.title}</h4>
                  <div className="dashboard-video-card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {video.channel || 'Unassigned'} · {new Date(video.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="dashboard-video-card-actions" style={{ display: 'flex', gap: 4 }}>
                      {video.video_url ? (
                        <a
                          href={video.video_url}
                          download
                          style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'DM Sans, sans-serif', textDecoration: 'none' }}
                        >
                          <Download size={11} /> Download
                        </a>
                      ) : (
                        <div style={{ padding: '5px 10px', borderRadius: 7, border: '1px dashed var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                          Pending
                        </div>
                      )}
                      <button style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <MoreHorizontal size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
