'use client';
import { Bell, Sun, Moon, ChevronDown, Menu } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, getSession, SESSION_EVENT, updateSessionName } from '@/lib/session';

interface NavbarProps {
  theme: string;
  toggleTheme: () => void;
  sidebarWidth: number;
  isMobile: boolean;
  onMenuToggle: () => void;
}

const notifications = [
  { id: 1, text: 'Video generation completed', time: '2m ago', icon: '✅', read: false },
  { id: 2, text: 'Thumbnail ready for download', time: '15m ago', icon: '🖼️', read: false },
  { id: 3, text: '3 new viral ideas generated', time: '1h ago', icon: '💡', read: true },
  { id: 4, text: 'Channel "AI Tools" synced', time: '3h ago', icon: '📺', read: true },
];

export default function Navbar({ theme, toggleTheme, sidebarWidth, isMobile, onMenuToggle }: NavbarProps) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('User');
  const [email, setEmail] = useState('');
  const router = useRouter();
  const unread = notifications.filter(n => !n.read).length;
  const overlayShadow = '0 24px 70px rgba(2, 12, 16, 0.34)';
  const initials = useMemo(() => name.trim().slice(0, 1).toUpperCase() || 'U', [name]);

  useEffect(() => {
    const syncSession = () => {
      const session = getSession();
      if (!session) return;
      setName(session.name);
      setEmail(session.email);
    };

    syncSession();
    window.addEventListener(SESSION_EVENT, syncSession);
    return () => window.removeEventListener(SESSION_EVENT, syncSession);
  }, []);

  const handleSaveName = () => {
    const next = updateSessionName(name);
    if (next) setName(next.name);
    setEditingName(false);
  };

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <header className="glass-static" style={{
      position: 'fixed', top: 0, left: sidebarWidth, right: 0, height: 64, zIndex: 99,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '0 14px' : '0 24px', borderBottom: '1px solid var(--border)', borderRadius: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {isMobile && (
          <button
            onClick={onMenuToggle}
            aria-label="Open navigation menu"
            style={{
              width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', flexShrink: 0,
            }}
          >
            <Menu size={18} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <div className="font-display" style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Nexa Studio
          </div>
          {!isMobile && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              AI content dashboard
            </div>
          )}
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme} style={{
          width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
          background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', transition: 'all 0.2s',
        }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
            style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', position: 'relative',
            }}
          >
            <Bell size={16} />
            {unread > 0 && <div className="notif-dot" />}
          </button>

          {showNotifs && (
            <div className="panel-solid" style={{
              position: 'absolute', top: '110%', right: 0, width: 320, borderRadius: 14,
              boxShadow: overlayShadow, zIndex: 200, overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Notifications</span>
                <span className="badge" style={{ background: 'rgba(27,179,171,0.14)', color: 'var(--accent-1)' }}>{unread} new</span>
              </div>
              {notifications.map(n => (
                <div key={n.id} style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  background: n.read ? 'transparent' : 'rgba(27,179,171,0.08)',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: n.read ? 500 : 700 }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{n.time}</div>
                  </div>
                  {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-1)', flexShrink: 0, marginTop: 4 }} />}
                </div>
              ))}
              <div style={{ padding: '10px 16px', textAlign: 'center' }}>
                <a href="#" style={{ fontSize: 12, color: 'var(--accent-1)', textDecoration: 'none', fontWeight: 500 }}>View all notifications</a>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px 6px 6px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--gradient-main)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>{initials}</div>
            {!isMobile && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{name}</span>}
            {!isMobile && <ChevronDown size={12} color="var(--text-muted)" />}
          </button>

          {showProfile && (
            <div className="panel-solid" style={{
              position: 'absolute', top: '110%', right: 0, width: 240, borderRadius: 12,
              boxShadow: overlayShadow, zIndex: 200, overflow: 'hidden', padding: '8px',
            }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{email}</div>
              </div>
              <div style={{ padding: '4px 8px 10px' }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.06em' }}>DISPLAY NAME</label>
                <input
                  className="nexa-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  readOnly={!editingName}
                  style={{ fontSize: 13, padding: '9px 11px', opacity: editingName ? 1 : 0.8 }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {editingName ? (
                    <>
                      <button
                        onClick={handleSaveName}
                        style={{ flex: 1, borderRadius: 8, border: 'none', padding: '8px 10px', background: 'var(--accent-1)', color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          const session = getSession();
                          setName(session?.name || 'User');
                          setEditingName(false);
                        }}
                        style={{ flex: 1, borderRadius: 8, border: '1px solid var(--border)', padding: '8px 10px', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingName(true)}
                      className="menu-item"
                      style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}
                    >
                      Edit name
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="menu-item"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', transition: 'background 0.15s, color 0.15s' }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
