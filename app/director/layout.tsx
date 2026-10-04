import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';

// Sin 'use client': el layout solo arma la estructura; Sidebar sigue siendo componente de cliente.
// Asi puede exportar el titulo de la pestana (WCAG 2.4.2)
export const metadata: Metadata = {
  // Objeto y no texto simple: un titulo de texto en un layout corta la plantilla
  // "%s · Inkluye" para sus subpaginas (p. ej. director/...)
  title: {
    default: 'Inicio del director',
    template: '%s · Inkluye',
  },
};

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  return (
    // div y no <main>: cada pagina del director ya tiene su propio <main id="main-content">
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: 'var(--ink-surface-alt)' }}>
      <Sidebar />
      <div className="flex-grow-1 p-4">{children}</div>
    </div>
  );
}
