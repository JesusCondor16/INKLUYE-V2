'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import styles from "@/styles/buscar-syllabus.module.css";

interface Usuario {
  id?: number;
  name?: string;
}

interface CursoDocente {
  user?: Usuario | null;
}

interface Curso {
  id: number;
  code: string;
  name: string;
  type?: string | null;
  cycle?: string | null;
  credits?: number | null;
  user?: Usuario | null;
  cursodocente?: CursoDocente[];
  pdfUrl?: string | null;
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
        const data = await res.json() as { success?: boolean; error?: string; data?: Curso[] };

        if (!res.ok || !data?.success) {
          setError(data?.error || "No se pudieron cargar los cursos");
          setCursos([]);
          setLoading(false);
          return;
        }

        // El servidor solo envia syllabusUrl si este usuario puede ver el PDF (segun el estado del syllabus)
        const mapped: Curso[] = (data.data || []).map((c: Curso & { syllabusUrl?: string | null }) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          type: c.type,
          cycle: c.cycle,
          credits: c.credits,
          user: c.user ?? null,
          cursodocente: c.cursodocente ?? [],
          pdfUrl: c.syllabusUrl ?? null,
        }));

        if (!mounted) return;
        setCursos(mapped);
        setError(null);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Error desconocido");
        setCursos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCursos();

    return () => {
      mounted = false;
    };
  }, []);

  const safeDocentesNames = (cursodocente?: CursoDocente[]): string => {
    if (!cursodocente || cursodocente.length === 0) return '—';
    const names = cursodocente.map(cd => cd.user?.name).filter(Boolean);
    return names.length > 0 ? names.join(', ') : '—';
  };

  return (
    <div className={styles.wrapper}>
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
              {cursos.map(c => (
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
                      <span className={styles.noIcon}>No disponible</span>
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
