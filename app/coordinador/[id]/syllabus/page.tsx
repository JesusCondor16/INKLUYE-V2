'use client';

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import styles from "@/styles/coordinador.module.css";
import ModalSeccion1 from "@/components/ModalsSyllabus/ModalSeccion1/ModalSeccion1";
import ModalSeccion2 from "@/components/ModalsSyllabus/ModalSeccion2/ModalSeccion2";
import ModalSeccion3 from "@/components/ModalsSyllabus/ModalSeccion3/ModalSeccion3";
import ModalSeccion4 from "@/components/ModalsSyllabus/ModalSeccion4/ModalSeccion4";
import { useSyllabusController } from "@/controllers/useSyllabusController";

export default function SyllabusCursoPage() {
  const params = useParams();
  const cursoId = Number(params?.id);

  const { curso, loading, error, loadCurso, generarPDF, generating } = useSyllabusController();
  const [modal, setModal] = useState({ s1: false, s2: false, s3: false, s4: false });

  // Cargar datos del curso al montar el componente
  useEffect(() => {
    if (!cursoId || isNaN(cursoId)) return;
    loadCurso(cursoId);
  }, [cursoId, loadCurso]);

  // Handler que llama a generarPDF y notifica a otras pestañas (BroadcastChannel + localStorage fallback)
  const handleGenerarYNotificar = useCallback(
    async (lang: "es" | "en" | "zh") => {
      if (!cursoId || isNaN(cursoId)) {
        alert("ID de curso inválido");
        return;
      }

      try {
         const result = await generarPDF(lang);

        const pdfUrl = result?.url ?? null;

        if (typeof window !== "undefined") {
          try {
            const bc = new BroadcastChannel("syllabus_channel");
            bc.postMessage({
              type: "updated",
              courseId: cursoId,
              pdfUrl: pdfUrl,
              ts: Date.now(),
            });
            bc.close();
          } catch (_err) {
            try {
              const payload = {
                type: "updated",
                courseId: cursoId,
                pdfUrl: pdfUrl,
                ts: Date.now(),
              };
              localStorage.setItem("syllabus_updated", JSON.stringify(payload));
            } catch (_err2) {
              console.warn("No se pudo notificar vía localStorage", _err2);
            }
          }
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Error desconocido');
        console.error("Error generando syllabus:", error);
        alert("Error al generar syllabus: " + error.message);
      }
    },
    [cursoId, generarPDF]
  );

  if (!cursoId || isNaN(cursoId))
    return <div className={styles.errorBox}>❌ ID de curso inválido</div>;
  if (loading) return <div className={styles.statusBox}>Cargando datos del curso...</div>;
  if (error) return <div className={styles.errorBox}>❌ {error}</div>;

  return (
    <div className={styles.wrapper}>
      <a href="#main-content" className={styles.skipLink}>
        Saltar al contenido
      </a>
      <Sidebar />

      <main
        id="main-content"
        className={styles.main}
        role="main"
        aria-labelledby="page-title"
      >
        <h1 id="page-title" className={styles.title}>
          {curso?.name || "Syllabus del Curso"}
        </h1>
        <p className={styles.lead}>
          Aquí puedes editar las secciones del syllabus y generar el PDF.
        </p>

        <table className={styles.table} role="table" aria-describedby="table-desc">
          <caption id="table-desc" className={styles.visuallyHidden}>
            Ítems del syllabus: Información general, Competencias, Capacidades y Estrategia didáctica.
          </caption>
          <thead>
            <tr>
              <th style={{ width: "10%" }}>Ítem</th>
              <th style={{ width: "60%" }}>Descripción</th>
              <th style={{ width: "30%" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {[{ id: 1, desc: "Información general, Sumilla", modal: "s1" },
              { id: 2, desc: "Competencias y Logros", modal: "s2" },
              { id: 3, desc: "Capacidades y Programación", modal: "s3" },
              { id: 4, desc: "Estrategia didáctica, Evaluación, Matriz y Bibliografía", modal: "s4" },
            ].map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.desc}</td>
                <td>
                  <button
                    className={styles.btn}
                    onClick={() => setModal({ ...modal, [item.modal]: true })}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 d-flex gap-2">
          <button
            className={`${styles.btn} btn-success`}
            onClick={() => handleGenerarYNotificar("es")}
            disabled={generating || !curso}
          >
            {generating ? "Generando..." : "📘 Generar y Abrir Syllabus (ES)"}
          </button>

          <button
            className={`${styles.btn} btn-outline-primary`}
            onClick={() => handleGenerarYNotificar("en")}
            disabled={generating || !curso}
          >
            {generating ? "Generando..." : "🌍 Generar y Abrir Syllabus (EN)"}
          </button>

          <button
            className={`${styles.btn} btn-outline-secondary`}
            onClick={() => handleGenerarYNotificar("zh")}
            disabled={generating || !curso}
          >
            {generating ? "Generando..." : "🇨🇳 Generar y Abrir Syllabus (ZH)"}
          </button>
        </div>

        {modal.s1 && (
          <ModalSeccion1
            show={modal.s1}
            onClose={() => setModal({ ...modal, s1: false })}
            cursoId={cursoId}
          />
        )}
        {modal.s2 && (
          <ModalSeccion2
            onClose={() => setModal({ ...modal, s2: false })}
            cursoId={cursoId}
          />
        )}
        {modal.s3 && (
          <ModalSeccion3
            cursoId={cursoId}
            onClose={() => setModal({ ...modal, s3: false })}
          />
        )}
        {modal.s4 && (
          <ModalSeccion4
            cursoId={cursoId}
            onClose={() => setModal({ ...modal, s4: false })}
          />
        )}
      </main>
    </div>
  );
}
