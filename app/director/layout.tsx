'use client';

import Sidebar from '@/components/Sidebar';

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#e6f0fa' }}>
      <Sidebar />
      <div className="flex-grow-1 p-4">{children}</div>
    </main>
  );
}
