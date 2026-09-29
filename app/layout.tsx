import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "../styles/globals.css";

// Atkinson Hyperlegible (Braille Institute): disenada para baja vision.
// next/font la descarga en el build y la sirve desde el propio sistema (sin peticiones a Google).
const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-atkinson",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inkluye", // 🏷️ Título en la pestaña
  description: "Sistema de Gestión de Syllabus - Inkluye",
  icons: {
    icon: "/inkluye.png", // 🖼️ Ruta del logo
  },
  openGraph: {
    title: "Inkluye - Sistema de Gestión de Syllabus",
    description:
      "Plataforma inclusiva para la gestión de syllabus con accesibilidad WCAG 2.1 AAA.",
    images: ["/favicon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // La variable de la fuente va en <html> (:root) porque ahi se define --ink-font en globals.css
    <html lang="es" className={atkinson.variable}>
      <body className="bg-light">
        {/* Salta la barra lateral hasta el <main id="main-content"> de cada pagina */}
        <a href="#main-content" className="skip-link">
          Saltar al contenido
        </a>
        {/* div y no <main>: cada pagina ya tiene su propio <main> (un solo landmark principal) */}
        <div id="site-main" className="container-fluid p-0">{children}</div>
      </body>
    </html>
  );
}
