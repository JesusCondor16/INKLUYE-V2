'use client';

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { FileDown } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import styles from "@/styles/coordinador.module.css";
import ModalSeccion1 from "@/components/ModalsSyllabus/ModalSeccion1/ModalSeccion1";
import ModalSeccion2 from "@/components/ModalsSyllabus/ModalSeccion2/ModalSeccion2";
import ModalSeccion3 from "@/components/ModalsSyllabus/ModalSeccion3/ModalSeccion3";
import ModalSeccion4 from "@/components/ModalsSyllabus/ModalSeccion4/ModalSeccion4";
import { useSyllabusController } from "@/controllers/useSyllabusController";
import EstadoSyllabus from "@/components/EstadoSyllabus/EstadoSyllabus";

export default function SyllabusCursoPage() {
  const params = useParams();
  const cursoId = Number(params?.id);

  const { curso, loading, error, loadCurso, generarPDF, generating, aviso } = useSyllabusController();
  // Error al generar, mostrado junto a los botones (antes: alert())
  const [errorGeneracion, setErrorGeneracion] = useState<string | null>(null);
  const [modal, setModal] = useState({ s1: false, s2: false, s3: false, s4: false });
  // Se incrementa tras generar un PDF para que el panel de estado vuelva a consultar (regenerar lo deja en borrador)
  const [recargarEstado, setRecargarEstado] = useState(0);

  // Cargar datos del curso al montar el componente
  useEffect(() => {
    if (!cursoId || isNaN(cursoId)) return;
    loadCurso(cursoId);
  }, [cursoId, loadCurso]);

  // Genera el PDF en el idioma indicado; el servidor lo guarda y deja el syllabus en borrador
  const handleGenerar = useCallback(
    async (lang: "es" | "en" | "zh") => {
      // (sin id valido la pagina ya muestra "ID de curso inválido" y no hay botones)
      if (!cursoId || isNaN(cursoId)) return;

      setErrorGeneracion(null);
      try {
        await generarPDF(lang);
        setRecargarEstado((n) => n + 1);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Error desconocido');
        console.error("Error generando syllabus:", error);
        setErrorGeneracion("No se pudo generar el syllabus: " + error.message);
      }
    },
    [cursoId, generarPDF]
  );

  if (!cursoId || isNaN(cursoId))
    return <div className={styles.errorBox} role="alert">ID de curso inválido</div>;
  if (loading) return <div className={styles.statusBox}>Cargando datos del curso...</div>;
  if (error) return <div className={styles.errorBox} role="alert">{error}</div>;

  return (
    <div className={styles.wrapper}>

      <Sidebar />

      <main
        id="main-content"
        className={styles.main}
        role="main"
        aria-labelledby="page-title"
        tabIndex={-1}
      >
        <h1 id="page-title" className={styles.title}>
          {curso?.name || "Syllabus del Curso"}
        </h1>
        <p className={styles.lead}>
          Aquí puedes editar las secciones del syllabus, generar el PDF y enviarlo a los docentes para su revisión.
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

        {/* Iconos SVG en vez de emojis (el lector leia "libro azul", "bandera de China") */}
        <div className="mt-3 d-flex flex-wrap gap-2">
          <button type="button" className={styles.btn} onClick={() => handleGenerar("es")} disabled={generating || !curso}>
            <FileDown size={18} aria-hidden="true" focusable={false} />
            {generating ? "Generando..." : "Generar y abrir syllabus (ES)"}
          </button>

          <button type="button" className={styles.btn} onClick={() => handleGenerar("en")} disabled={generating || !curso}>
            <FileDown size={18} aria-hidden="true" focusable={false} />
            {generating ? "Generando..." : "Generar y abrir syllabus (EN)"}
          </button>

          <button type="button" className={styles.btn} onClick={() => handleGenerar("zh")} disabled={generating || !curso}>
            <FileDown size={18} aria-hidden="true" focusable={false} />
            {generating ? "Generando..." : <>Generar y abrir syllabus (<span lang="zh">中文</span>)</>}
          </button>
        </div>

        {/* Avisos del generador: el error con role="alert", la traduccion no disponible con role="status" */}
        {errorGeneracion && <div className={styles.errorBox} role="alert">{errorGeneracion}</div>}
        {aviso && !errorGeneracion && <div className={styles.statusBox} role="status">{aviso}</div>}

        <EstadoSyllabus cursoId={cursoId} nombreCurso={curso?.name ?? "este curso"} recargarKey={recargarEstado} />

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
