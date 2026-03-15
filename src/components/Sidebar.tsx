'use client';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Video, Library, Image, Tv2, Settings, ChevronLeft, ChevronRight, X } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Video, label: 'Create Video', path: '/create' },
  { icon: Library, label: 'Video Library', path: '/library' },
  { icon: Image, label: 'Thumbnails', path: '/thumbnails' },
  { icon: Tv2, label: 'Channels', path: '/channels' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  isMobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed, isMobile, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarWidth = isMobile ? 280 : (collapsed ? 64 : 220);

  return (
    <aside className="sidebar glass-static" style={{
      width: sidebarWidth,
      minHeight: '100vh',
      position: 'fixed',
      left: 0, top: 0,
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
      borderRight: '1px solid var(--border)',
      borderRadius: 0,
      transform: isMobile ? `translateX(${mobileOpen ? '0' : '-100%'})` : 'translateX(0)',
      transition: 'transform 0.25s ease, width 0.25s ease',
    }}>
      {/* Logo */}
      <div style={{ padding: isMobile ? '20px' : (collapsed ? '20px 0' : '20px 20px'), display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', justifyContent: isMobile || !collapsed ? 'flex-start' : 'center', minHeight: 64 }}>
        <BrandMark size={32} iconSize={16} radius={8} />
        {(isMobile || !collapsed) && (
          <div>
            <div className="font-display gradient-text" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
              NEXA
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Studio
            </div>
          </div>
        )}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = pathname === path || pathname.startsWith(path + '/');
          return (
            <button
              key={path}
              onClick={() => {
                router.push(path);
                if (isMobile) setMobileOpen(false);
              }}
              className={active ? 'nav-active' : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: isMobile ? '12px 14px' : (collapsed ? '10px 0' : '10px 12px'),
                borderRadius: 10, width: '100%',
                justifyContent: isMobile || !collapsed ? 'flex-start' : 'center',
                border: 'none', cursor: 'pointer',
                background: active ? undefined : 'transparent',
                color: active ? 'var(--accent-1)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 500,
                fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.15s',
                borderLeft: active ? '2px solid var(--accent-1)' : '2px solid transparent',
              }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              {(isMobile || !collapsed) && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      {!isMobile && (
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end',
              padding: '8px 12px', borderRadius: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', transition: 'color 0.15s',
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      )}
    </aside>
  );
}
