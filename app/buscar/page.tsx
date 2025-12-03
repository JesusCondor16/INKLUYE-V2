'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import styles from "@/styles/buscar-syllabus.module.css";

interface Curso {
  id: number;
  code: string;
  name: string;
  type?: string | null;
  cycle?: string | null;
  credits?: number | null;
  user?: { name?: string } | null;
  cursodocente?: { user?: { name?: string } | null }[];
  pdfUrl?: string | null; // <--- ahora sí
}

export default function BuscarSyllabusPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchCursos = async () => {
      try {
        const res = await fetch('/api/cursos/buscar');
        const data = await res.json();

        if (!res.ok || !data?.success) {
          setError(data?.error || "No se pudieron cargar los cursos");
          setCursos([]);
          setLoading(false);
          return;
        }

        // Mapeo inicial (sin pdfUrl todavía)
        const mapped: Curso[] = (data.data || []).map((c: any) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          type: c.type,
          cycle: c.cycle,
          credits: c.credits,
          user: c.user ?? null,
          cursodocente: c.cursodocente ?? [],
          pdfUrl: c.syllabus?.pdfUrl ?? null, // si ya viene en la lista, lo usamos
        }));

        if (!mounted) return;
        setCursos(mapped);
        setError(null);

        // Ahora, por cada curso que no tenga pdfUrl, intentar obtener metadata desde /api/cursos/:id
        // Usamos Promise.all para paralelo; protegemos cada llamada con try/catch para que una falla no afecte a las demás
        const fetchPdfForCourse = async (course: Curso) => {
          if (course.pdfUrl) return course; // ya lo tenemos
          try {
            const r = await fetch(`/api/cursos/${course.id}`);
            if (!r.ok) return course;
            const j = await r.json();
            // la respuesta puede estar en j.curso o en j directamente
            const payload = j?.curso ?? j ?? {};
            const pdfUrl = payload?.syllabus?.pdfUrl ?? payload?.syllabusUrl ?? null;
            return { ...course, pdfUrl };
          } catch (err) {
            // si algo falla, devolvemos el curso original sin bloquear todo
            console.warn(`No se pudo obtener syllabus para courseId=${course.id}`, err);
            return course;
          }
        };

        // Ejecutar todas (si son muchas, ajustar batching)
        const promises = mapped.map((c) => fetchPdfForCourse(c));
        const withPdf = await Promise.all(promises);

        if (!mounted) return;
        setCursos(withPdf);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Error desconocido");
        setCursos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCursos();

    // BroadcastChannel + localStorage listener para actualizaciones en caliente
    let bc: BroadcastChannel | null = null;
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "syllabus_updated" && ev.newValue) {
        try {
          const payload = JSON.parse(ev.newValue);
          if (payload?.courseId) {
            setCursos((prev) =>
              prev.map((c) =>
                c.id === payload.courseId ? { ...c, pdfUrl: payload.pdfUrl ?? c.pdfUrl ?? `/syllabus/${c.id}.pdf` } : c
              )
            );
          }
        } catch (e) {
          console.warn("Error parseando syllabus_updated desde storage", e);
        }
      }
    };

    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("syllabus_channel");
        bc.onmessage = (ev) => {
          const msg = ev.data;
          if (msg?.type === "updated" && msg.courseId) {
            setCursos((prev) =>
              prev.map((c) =>
                c.id === msg.courseId ? { ...c, pdfUrl: msg.pdfUrl ?? c.pdfUrl ?? `/syllabus/${c.id}.pdf` } : c
              )
            );
          }
        };
      }
    } catch (e) {
      // no fatal; si falla el canal, usamos solo storage
      console.warn("BroadcastChannel no disponible", e);
      bc = null;
    }

    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      if (bc) {
        try { bc.close(); } catch (e) { /* ignore */ }
      }
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const safeDocentesNames = (cursodocente: any): string => {
    if (!Array.isArray(cursodocente) || cursodocente.length === 0) return '—';
    const names = cursodocente.map((cd: any) => cd?.user?.name).filter(Boolean);
    return names.length > 0 ? names.join(', ') : '—';
  };

  return (
    <div className={styles.wrapper}>
      <a href="#main-content" className={styles.skipLink}>Saltar al contenido</a>
      <Sidebar />

      <main id="main-content" className={styles.main} role="main" aria-labelledby="page-title">
        <h1 id="page-title" className={styles.title}>Buscar Syllabus</h1>

        {loading && <p className={styles.info}>Cargando cursos...</p>}
        {error && <p className={styles.error}>Error: {error}</p>}
        {!loading && !error && cursos.length === 0 && (
          <p className={styles.info}>No hay cursos registrados en la base de datos.</p>
        )}

        {!loading && !error && cursos.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Ciclo</th>
                <th>Créditos</th>
                <th>Coordinador</th>
                <th>Docentes</th>
                <th>Syllabus</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map((c) => (
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td>{c.name}</td>
                  <td>{c.type ?? '—'}</td>
                  <td>{c.cycle ?? '—'}</td>
                  <td>{c.credits ?? '—'}</td>
                  <td>{c.user?.name ?? '—'}</td>
                  <td>{safeDocentesNames(c.cursodocente)}</td>
                  <td>
                    {c.pdfUrl ? (
                      <a
                        href={c.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.iconBtn}
                        aria-label={`Abrir syllabus de ${c.name}`}
                        title="Abrir Syllabus"
                      >
                        📄
                      </a>
                    ) : (
                      <span className={styles.noIcon}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
