'use client';
import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { Lightbulb, PenLine, Film, Zap, ChevronRight, Eye, Loader, CheckCircle, Download, Library } from 'lucide-react';

const modes = [
  { id: 'ai', icon: Lightbulb, title: 'AI Idea Generator', desc: 'Let AI generate viral ideas for you', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', placeholder: 'Enter a topic (e.g. "AI tools")', example: 'AI tools' },
  { id: 'custom', icon: PenLine, title: 'Create From My Idea', desc: 'Paste your own idea and generate instantly', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', placeholder: 'Paste your idea (e.g. "3 AI tools that feel illegal to use")', example: '3 AI tools that feel illegal to use' },
  { id: 'cartoon', icon: Film, title: 'Cartoon Story Generator', desc: 'Turn story ideas into animated cartoon videos', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', placeholder: 'Enter a story idea (e.g. "A lazy lion learns to work hard")', example: 'A lazy lion learns the value of hard work' },
  { id: 'bulk', icon: Zap, title: 'Bulk Shorts Generator', desc: 'Generate multiple shorts at once', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', placeholder: 'Enter a topic to generate multiple shorts', example: 'AI tools' },
];

const sampleIdeas = [
  '5 AI tools that will replace your job',
  '3 ChatGPT tricks nobody talks about',
  'How AI is changing the world in 2025',
  'The future of AI in 60 seconds',
];

export default function CreatePage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
  const scriptRef = useRef<HTMLDivElement>(null);

  const [selectedMode, setSelectedMode] = useState('ai');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('30');
  const [voice, setVoice] = useState('female');
  const [style, setStyle] = useState('stock');
  const [count, setCount] = useState('3');
  const [channel, setChannel] = useState('AI Tools Shorts');
  const [generating, setGenerating] = useState(false);
  const [showIdeas, setShowIdeas] = useState(false);
  const [done, setDone] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [scriptError, setScriptError] = useState('');
  const [scriptWarning, setScriptWarning] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState<null | { title: string; script?: string; video_url: string | null; thumbnail_url: string | null; status: string; warnings?: string[]; provider?: string }>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const mode = modes.find(m => m.id === selectedMode)!;
  const ModeIcon = mode.icon;

  // Health check
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${apiBaseUrl.replace(/\/api$/, '')}/health`);
        if (!cancelled) setApiStatus(res.ok ? 'online' : 'offline');
      } catch { if (!cancelled) setApiStatus('offline'); }
    };
    check();
    return () => { cancelled = true; };
  }, [apiBaseUrl]);

  const resetState = () => {
    setTopic(''); setShowIdeas(false); setDone(false);
    setGeneratedScript(''); setScriptError(''); setScriptWarning(''); setGeneratedVideo(null);
  };

  const handleGenerate = async () => {
    if (!topic || generating) return;
    setGenerating(true);
    setDone(false);
    setScriptError('');
    setScriptWarning('');
    setGeneratedScript('');
    setGeneratedVideo(null);

    try {
      const res = await fetch(`${apiBaseUrl}/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoIdea: topic, title: topic, style, voice, channel,
          mode: selectedMode,
          duration: Number(duration), // ✅ FIXED: duration now sent to backend
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || payload.message || 'Generation failed.');

      setGeneratedScript(payload.video?.script || '');
      setScriptWarning((payload.video?.warnings || []).join(' '));
      setGeneratedVideo(payload.video || null);
      setDone(true);

      // ✅ FIXED: scroll to script result
      setTimeout(() => scriptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    } catch (err) {
      if (err instanceof TypeError) {
        setScriptError('Cannot reach backend. Run "npm run backend:start" on port 4000.');
      } else {
        setScriptError(err instanceof Error ? err.message : 'Generation failed.');
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Create Video</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Choose a mode and let AI generate your content ✨</p>
        </div>

        {/* API status banner */}
        <div className="glass-static" style={{ borderRadius: 12, padding: '11px 14px', marginBottom: 20, border: `1px solid ${apiStatus === 'offline' ? 'rgba(244,63,94,0.24)' : apiStatus === 'online' ? 'rgba(16,185,129,0.24)' : 'var(--border)'}`, background: apiStatus === 'offline' ? 'rgba(244,63,94,0.06)' : apiStatus === 'online' ? 'rgba(16,185,129,0.04)' : 'transparent', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: apiStatus === 'offline' ? 'var(--accent-danger)' : apiStatus === 'online' ? 'var(--accent-success)' : '#888', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: apiStatus === 'offline' ? 'var(--accent-danger)' : apiStatus === 'online' ? 'var(--accent-success)' : 'var(--text-muted)' }}>
            {apiStatus === 'checking' ? 'Checking backend...' : apiStatus === 'online' ? 'Backend connected — ready to generate' : 'Backend offline — run: npm run backend:start'}
          </span>
        </div>

        {/* Mode selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 28 }}>
          {modes.map(m => {
            const Icon = m.icon;
            const active = selectedMode === m.id;
            return (
              <button key={m.id} onClick={() => { setSelectedMode(m.id); resetState(); }}
                className={`mode-card glass ${active ? 'selected' : ''}`}
                style={{ borderRadius: 14, padding: '18px 20px', textAlign: 'left', border: `1px solid ${active ? 'var(--accent-1)' : 'var(--border)'}`, background: active ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)', display: 'flex', alignItems: 'flex-start', gap: 14, fontFamily: 'DM Sans, sans-serif' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={m.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.desc}</div>
                </div>
                {active && <ChevronRight size={16} color="var(--accent-1)" />}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <div className="glass-static" style={{ borderRadius: 16, padding: '28px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: mode.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ModeIcon size={18} color={mode.color} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{mode.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{mode.desc}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Topic */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>TOPIC / IDEA *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea className="nexa-input" placeholder={mode.placeholder} value={topic} onChange={e => setTopic(e.target.value)} rows={2} style={{ resize: 'none', flex: 1, lineHeight: 1.5 }} />
                {selectedMode === 'ai' && (
                  <button onClick={() => setShowIdeas(!showIdeas)} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: showIdeas ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: showIdeas ? 'var(--accent-1)' : 'var(--text-secondary)', fontFamily: 'DM Sans, sans-serif', flexShrink: 0, alignSelf: 'flex-start', borderColor: showIdeas ? 'var(--accent-1)' : 'var(--border)' }}>
                    Get Ideas
                  </button>
                )}
              </div>
              {!topic && <button onClick={() => setTopic(mode.example)} style={{ marginTop: 6, fontSize: 11, color: 'var(--accent-1)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', padding: 0 }}>Try: "{mode.example}"</button>}
            </div>

            {/* Ideas panel */}
            {showIdeas && (
              <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-1)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lightbulb size={13} /> AI GENERATED IDEAS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sampleIdeas.map(idea => (
                    <button key={idea} onClick={() => { setTopic(idea); setShowIdeas(false); }} style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.15)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-1)'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.15)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}>
                      <ChevronRight size={13} color="var(--accent-1)" />
                      {idea}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Settings */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
              {/* Duration */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>DURATION</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['30', '60'].map(d => (
                    <button key={d} onClick={() => setDuration(d)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--border)', background: duration === d ? 'var(--accent-1)' : 'transparent', color: duration === d ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>{d}s</button>
                  ))}
                </div>
              </div>
              {/* Voice */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>VOICE</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ v: 'male', label: '♂ Male' }, { v: 'female', label: '♀ Female' }].map(({ v, label }) => (
                    <button key={v} onClick={() => setVoice(v)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--border)', background: voice === v ? 'var(--accent-1)' : 'transparent', color: voice === v ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>{label}</button>
                  ))}
                </div>
              </div>
              {/* Style */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>STYLE</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ v: 'stock', label: 'Stock' }, { v: 'cartoon', label: 'Cartoon' }].map(({ v, label }) => (
                    <button key={v} onClick={() => setStyle(v)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--border)', background: style === v ? 'var(--accent-1)' : 'transparent', color: style === v ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>{label}</button>
                  ))}
                </div>
              </div>
              {/* Bulk count */}
              {selectedMode === 'bulk' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>COUNT</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['1', '3', '5'].map(n => (
                      <button key={n} onClick={() => setCount(n)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--border)', background: count === n ? 'var(--accent-1)' : 'transparent', color: count === n ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>{n}</button>
                    ))}
                  </div>
                </div>
              )}
              {/* Channel */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>CHANNEL</label>
                <select className="nexa-select" value={channel} onChange={e => setChannel(e.target.value)} style={{ width: '100%' }}>
                  <option>AI Tools Shorts</option>
                  <option>Tech Facts</option>
                  <option>Cartoon Stories</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button onClick={handleGenerate} disabled={!topic || generating} className="btn-gradient"
                style={{ flex: 1, padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!topic || generating) ? 0.6 : 1, cursor: (!topic || generating) ? 'not-allowed' : 'pointer' }}>
                {generating ? <><Loader size={16} style={{ animation: 'spin 0.7s linear infinite' }} />Generating...</> : done ? <><CheckCircle size={16} /> Video Ready!</> : <><Zap size={16} fill="white" />Generate {selectedMode === 'bulk' ? `${count} Shorts` : 'Video'}</>}
              </button>
              {/* ✅ FIXED: Preview Script now scrolls to script output */}
              <button onClick={() => scriptRef.current?.scrollIntoView({ behavior: 'smooth' })} disabled={!generatedScript}
                style={{ padding: '13px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', cursor: generatedScript ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'DM Sans, sans-serif', opacity: generatedScript ? 1 : 0.5 }}>
                <Eye size={15} /> Preview Script
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {scriptError && (
          <div className="glass-static" style={{ borderRadius: 14, padding: '16px 18px', marginBottom: 20, border: '1px solid rgba(244,63,94,0.25)', background: 'rgba(244,63,94,0.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-danger)', marginBottom: 4 }}>Generation failed</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{scriptError}</div>
          </div>
        )}

        {/* Warning */}
        {scriptWarning && !scriptError && (
          <div className="glass-static" style={{ borderRadius: 14, padding: '16px 18px', marginBottom: 20, border: '1px solid rgba(245,158,11,0.24)', background: 'rgba(245,158,11,0.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>Fallback mode</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{scriptWarning}</div>
          </div>
        )}

        {/* Generating steps */}
        {generating && (
          <div className="glass-static" style={{ borderRadius: 14, padding: '20px', marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader size={15} color="var(--accent-1)" style={{ animation: 'spin 0.7s linear infinite' }} />
              Building your AI video project...
            </div>
            {['Writing script', 'Generating thumbnail', 'Creating narration', 'Rendering & uploading video'].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {i === 0 ? <CheckCircle size={12} color="var(--accent-success)" /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: i === 1 ? 'var(--accent-1)' : 'var(--border)' }} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: i <= 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Script output */}
        {generatedScript && (
          <div ref={scriptRef} className="glass-static" style={{ borderRadius: 14, padding: '20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>Generated Script</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ready to record or narrate</div>
              </div>
              <span className="badge" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent-success)' }}>
                {generatedVideo?.status === 'ready' ? '✅ Video Ready' : '📝 Script Ready'}
              </span>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {generatedScript}
            </div>
          </div>
        )}

        {/* Generated video result */}
        {generatedVideo && (
          <div className="glass-static" style={{ borderRadius: 14, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <div className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>Generated Project</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {generatedVideo.status === 'ready' ? 'Saved to Cloudinary + Supabase ✅' : 'Script & thumbnail saved. FFmpeg needed for MP4.'}
                </div>
              </div>
              <Link href="/library" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-1)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                <Library size={14} /> Open Library
              </Link>
            </div>
            {generatedVideo.thumbnail_url && (
              <img src={generatedVideo.thumbnail_url} alt={generatedVideo.title} style={{ width: 160, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 14 }} />
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {generatedVideo.video_url && (
                <>
                  <a href={generatedVideo.video_url} target="_blank" rel="noreferrer" className="btn-gradient" style={{ padding: '10px 16px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                    <Eye size={14} /> Watch Video
                  </a>
                  <a href={generatedVideo.video_url} download style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', color: 'var(--text-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <Download size={14} /> Download
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
