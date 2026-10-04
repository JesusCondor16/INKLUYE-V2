import type { Metadata } from 'next';

// Titulo de la pestana para esta pagina (WCAG 2.4.2 Titulado de paginas).
// Las paginas son 'use client' y no pueden exportar metadata; por eso va en este layout.
export const metadata: Metadata = {
  // Objeto y no texto simple: un titulo de texto en un layout corta la plantilla
  // "%s · Inkluye" para sus subpaginas (p. ej. coordinador/...)
  title: {
    default: 'Inicio del coordinador',
    template: '%s · Inkluye',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
