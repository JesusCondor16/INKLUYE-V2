import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-light`}>
        <a href="#site-main" className="skip-link">
          Saltar al contenido
        </a>
        <main id="site-main" className="container-fluid p-0">{children}</main>
      </body>
    </html>
  );
}
