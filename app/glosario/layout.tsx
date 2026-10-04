import type { Metadata } from 'next';

// Titulo de la pestana para esta pagina (WCAG 2.4.2 Titulado de paginas).
// Las paginas son 'use client' y no pueden exportar metadata; por eso va en este layout.
export const metadata: Metadata = {
  title: 'Glosario',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
