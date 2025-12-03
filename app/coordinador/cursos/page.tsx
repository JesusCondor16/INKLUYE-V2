'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import styles from "@/styles/coordinador.module.css";
import { obtenerUsuarioDesdeToken } from "@/lib/authClient"; // cliente

interface Docente {
  id: number;
  name: string;
}

interface Curso {
  id: number;
  code: string;
  name: string;
  type?: string | null;
  cycle?: string | null;
  credits?: number | null;
  docentes?: Docente[];
  syllabusUrl?: string | null; // ruta al PDF en BD
}

export default function CursosCoordinadorPage() {
  const router = useRouter();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchCursos = async () => {
      const usuario = obtenerUsuarioDesdeToken();
      if (!usuario) {
        setError("No se pudo obtener información del usuario");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/coordinador/cursos`);
        const data: { success: boolean; data?: unknown[]; error?: string } = await res.json();

        if (!mounted) return;

        if (!res.ok || data.success === false) {
          setError(data.error || "No se pudieron cargar los cursos");
          setCursos([]);
        } else {
          const mapped: Curso[] = (data.data ?? []).map((c) => {
            const cursoObj = c as {
              id: number;
              code?: string;
              codigo?: string;
              name?: string;
              nombre?: string;
              type?: string | null;
              tipo?: string | null;
              cycle?: string | null;
              ciclo?: string | null;
              credits?: number | null;
              creditos?: number | null;
              docentes?: Docente[];
              teachers?: Docente[];
              syllabus?: { pdfUrl?: string };
            };

            return {
              id: cursoObj.id,
              code: cursoObj.code ?? cursoObj.codigo ?? "",
              name: cursoObj.name ?? cursoObj.nombre ?? "",
              type: cursoObj.type ?? cursoObj.tipo ?? null,
              cycle: cursoObj.cycle ?? cursoObj.ciclo ?? null,
              credits: cursoObj.credits ?? cursoObj.creditos ?? null,
              docentes: cursoObj.docentes ?? cursoObj.teachers ?? [],
              syllabusUrl: cursoObj.syllabus?.pdfUrl ?? null,
            };
          });
          setCursos(mapped);
          setError(null);
        }
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Error desconocido");
        setCursos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCursos();
    return () => { mounted = false; };
  }, []);

  const handleIrASyllabus = (cursoId: number | undefined) => {
    if (!cursoId || isNaN(cursoId)) {
      alert("ID de curso inválido");
      return;
    }
    router.push(`/coordinador/${cursoId}/syllabus`);
  };

  return (
    <div className={styles.wrapper}>
      <a href="#main-content" className={styles.skipLink}>Saltar al contenido</a>
      <Sidebar />
      <main id="main-content" className={styles.main} role="main" aria-labelledby="page-title">
        <h1 id="page-title" className={styles.title}>Mis Cursos Asignados</h1>
        <p className={styles.lead}>
          Panel de cursos asignados. Usa el teclado para navegar y los enlaces para ver o generar syllabus.
        </p>

        {loading && <div role="status" aria-live="polite" className={styles.statusBox}><p>Cargando cursos…</p></div>}
        {error && !loading && <div role="alert" className={styles.errorBox}><p>{error}</p></div>}
        {!loading && !error && cursos.length === 0 && <p>No se encontraron cursos asignados.</p>}

        {!loading && !error && cursos.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Ciclo</th>
                  <th>Créditos</th>
                  <th>Docentes</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {cursos.map((c) => (
                  <tr key={c.id}>
                    <td>{c.code}</td>
                    <td>{c.name}</td>
                    <td>{c.type ?? "—"}</td>
                    <td>{c.cycle ?? "—"}</td>
                    <td>{c.credits ?? "—"}</td>
                    <td>{c.docentes?.map(d => d.name).join(", ") || "—"}</td>
                    <td>
                      <button
                        className={styles.generateButton}
                        onClick={() => handleIrASyllabus(c.id)}
                        aria-label={`Generar syllabus para ${c.name}`}
                      >
                        Generar Syllabus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
