'use client';

import Sidebar from '@/components/Sidebar';

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  return (
    // div y no <main>: cada pagina del director ya tiene su propio <main id="main-content">
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: 'var(--ink-surface-alt)' }}>
      <Sidebar />
      <div className="flex-grow-1 p-4">{children}</div>
    </div>
  );
}
