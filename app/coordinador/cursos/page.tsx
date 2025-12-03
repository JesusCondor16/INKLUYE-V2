'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import styles from "@/styles/coordinador.module.css";
import { obtenerUsuarioDesdeToken } from "@/lib/authClient"; // cliente

interface Curso {
  id: number;
  code: string;
  name: string;
  type?: string | null;
  cycle?: string | null;
  credits?: number | null;
  docentes?: { id: number; name: string }[];
  syllabusUrl?: string | null; // ruta al PDF en BD (se mantiene por si la usas en otro lugar)
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
        const data = await res.json();

        if (!mounted) return;

        if (!res.ok || data.success === false) {
          setError(data.error || "No se pudieron cargar los cursos");
          setCursos([]);
        } else {
          const mapped = (data.data ?? []).map((c: any) => ({
            id: c.id,
            code: c.code ?? c.codigo ?? "",
            name: c.name ?? c.nombre ?? "",
            type: c.type ?? c.tipo ?? null,
            cycle: c.cycle ?? c.ciclo ?? null,
            credits: c.credits ?? c.creditos ?? null,
            docentes: c.docentes ?? c.teachers ?? [],
            syllabusUrl: c.syllabus?.pdfUrl ?? null
          }));
          setCursos(mapped);
          setError(null);
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? "Error desconocido");
        setCursos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCursos();
    return () => { mounted = false; };
  }, []);

  // Redirige a la página del syllabus (donde están los modals y la generación)
  const handleIrASyllabus = (cursoId: number | undefined) => {
    if (!cursoId || isNaN(Number(cursoId))) {
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
