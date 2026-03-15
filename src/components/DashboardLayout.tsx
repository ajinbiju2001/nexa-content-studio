'use client';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import Companion from '@/components/Companion';
import CommandPalette from '@/components/CommandPalette';
import { ThemeCtx } from '@/components/ThemeProvider';
import { getSession } from '@/lib/session';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeCtx);
  const router = useRouter();
  const sidebarWidth = isMobile ? 0 : (collapsed ? 64 : 220);

  useEffect(() => {
    const syncViewport = () => {
      const mobile = window.innerWidth <= 960;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileSidebarOpen(false);
      }
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    setAuthChecked(true);
  }, [router]);

  if (!authChecked) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        sidebarWidth={sidebarWidth}
        isMobile={isMobile}
        onMenuToggle={() => setMobileSidebarOpen((open) => !open)}
      />

      {isMobile && mobileSidebarOpen && (
        <button
          aria-label="Close navigation menu"
          className="dashboard-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <main className="dashboard-main" style={{
        marginLeft: sidebarWidth, paddingTop: 64,
        minHeight: '100vh', position: 'relative', zIndex: 1,
        transition: 'margin-left 0.3s ease',
      }}>
        <div className="dashboard-content page-enter" style={{ padding: '32px 28px' }}>
          {children}
        </div>
      </main>

      <Companion />
      <CommandPalette />
    </div>
  );
}
