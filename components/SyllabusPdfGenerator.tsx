// components/SyllabusPdfGenerator.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type Competencia = { codigo: string; descripcion: string; tipo?: string; nivel?: string; };
type Logro = { codigo: string; descripcion: string; tipo?: string; nivel?: string; };
type Matriz = { unidad?: string; criterio?: string; producto?: string; instrumento?: string; nota_peso?: number | null; nota_sum?: string | null; };
type Biblio = { id: number; texto: string; };
type Estrategia = { id: number; texto: string; };
type Recurso = { id: number; descripcion: string; };

interface Props {
  cursoId: number;
  autoLoad?: boolean; // si quieres cargar data automáticamente
}

export default function SyllabusPdfGenerator({ cursoId, autoLoad = true }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoLoad) return;
    (async () => {
      setLoadingData(true);
      try {
        const res = await fetch(`/api/cursos/${cursoId}/syllabus-data`);
        if (!res.ok) throw new Error('Error al cargar datos del syllabus');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error cargando syllabus-data:", err);
        setData(null);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [cursoId, autoLoad]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/cursos/${cursoId}/syllabus-data`);
      if (!res.ok) throw new Error('Error al cargar datos del syllabus');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error cargando syllabus-data:", err);
      setData(null);
    } finally {
      setLoadingData(false);
    }
  };

  // Generación PDF con multipágina
  const generarPDF = async (openInNewTab = false) => {
    if (!printRef.current) {
      alert("No hay contenido para generar el PDF. Asegúrate de que los datos estén cargados.");
      return;
    }
    setLoading(true);
    try {
      const nodo = printRef.current;

      // Si está oculto, hacer visible temporalmente para html2canvas
      const originalDisplay = nodo.style.display;
      if (originalDisplay === "none") nodo.style.display = "block";

      // Esperar un tick para permitir render
      await new Promise((r) => setTimeout(r, 50));

      const canvas = await html2canvas(nodo, { scale: 2, useCORS: true, allowTaint: true, logging: false });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      } else {
        // multipágina: cortar por secciones verticales
        const pxPerMm = canvas.width / imgWidth;
        const pagePxHeight = Math.floor(pdfHeight * pxPerMm);
        let positionY = 0;
        while (positionY < canvas.height) {
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(pagePxHeight, canvas.height - positionY);
          const ctx = pageCanvas.getContext("2d")!;
          ctx.drawImage(canvas, 0, positionY, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);
          const pageData = pageCanvas.toDataURL("image/png");
          const pageImgHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;

          if (positionY > 0) pdf.addPage();
          pdf.addImage(pageData, "PNG", 0, 0, imgWidth, pageImgHeight);

          positionY += pagePxHeight;
        }
      }

      // Restaurar display original
      nodo.style.display = originalDisplay;

      if (openInNewTab) {
        const dataUrl = pdf.output("dataurlstring");
        window.open(dataUrl, "_blank");
      } else {
        pdf.save(`syllabus_${cursoId}.pdf`);
      }
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Ocurrió un error generando el PDF. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  // Si no data cargada todavía, mostrar botón para cargar (o autoLoad lo hizo)
  return (
    <div>
      <div className="mb-3">
        <button className="btn btn-primary me-2" onClick={() => generarPDF(false)} disabled={loading || loadingData}>
          {loading ? "Generando..." : "Descargar PDF"}
        </button>
        <button className="btn btn-outline-primary me-2" onClick={() => generarPDF(true)} disabled={loading || loadingData}>
          {loading ? "Generando..." : "Ver en ventana"}
        </button>
        <button className="btn btn-secondary" onClick={fetchData} disabled={loadingData}>
          {loadingData ? "Cargando datos..." : "Recargar datos"}
        </button>
      </div>

      {loadingData && <p>Cargando datos del syllabus...</p>}
      {!loadingData && !data && <p>No hay datos. Haz clic en "Recargar datos".</p>}

      {/* Contenedor oculto para html2canvas (se muestra temporalmente durante la captura) */}
      <div
        ref={printRef}
        style={{
          display: "none",
          width: 794,
          padding: 28,
          background: "white",
          color: "#0f172a",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {/* Cabecera */}
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <h1 style={{ margin: 0 }}>{data?.curso?.name ?? "Curso"}</h1>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Código: {data?.curso?.code ?? ""} — Créditos: {data?.curso?.credits ?? ""}
          </div>
        </div>

        {/* Sumilla */}
        <section style={{ marginTop: 10 }}>
          <h3 style={{ marginBottom: 6 }}>Sumilla</h3>
          <p style={{ marginTop: 0 }}>{data?.curso?.sumilla ?? "No hay sumilla registrada."}</p>
        </section>

        {/* Competencias */}
        <section style={{ marginTop: 6 }}>
          <h3 style={{ marginBottom: 6 }}>Competencias</h3>
          {Array.isArray(data?.competencias) && data.competencias.length > 0 ? (
            <ol>
              {data.competencias.map((c: Competencia, i: number) => (
                <li key={i}><strong>{c.codigo}</strong> — {c.descripcion}</li>
              ))}
            </ol>
          ) : (
            <p>No hay competencias registradas.</p>
          )}
        </section>

        {/* Logros */}
        <section style={{ marginTop: 6 }}>
          <h3 style={{ marginBottom: 6 }}>Logros</h3>
          {Array.isArray(data?.logros) && data.logros.length > 0 ? (
            <ol>
              {data.logros.map((l: Logro, i: number) => (
                <li key={i}><strong>{l.codigo}</strong> — {l.descripcion}</li>
              ))}
            </ol>
          ) : (
            <p>No hay logros registrados.</p>
          )}
        </section>

        {/* Matriz */}
        <section style={{ marginTop: 6 }}>
          <h3 style={{ marginBottom: 6 }}>Matriz de evaluación</h3>
          {Array.isArray(data?.matriz) && data.matriz.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>Unidad</th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>Criterio y logros</th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>Procedimiento</th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>Instrumento</th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>Peso</th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>Nota SUM</th>
                </tr>
              </thead>
              <tbody>
                {data.matriz.map((m: Matriz, i: number) => (
                  <tr key={i}>
                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{m.unidad ?? ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{m.criterio ?? ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{m.producto ?? ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{m.instrumento ?? ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{m.nota_peso ?? ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{m.nota_sum ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay matriz de evaluación registrada.</p>
          )}
        </section>

        {/* Estrategias */}
        <section style={{ marginTop: 6 }}>
          <h3 style={{ marginBottom: 6 }}>Estrategias didácticas</h3>
          {Array.isArray(data?.estrategia) && data.estrategia.length > 0 ? (
            <ol>
              {data.estrategia.map((e: Estrategia, i: number) => <li key={i}>{e.texto}</li>)}
            </ol>
          ) : (
            <p>No hay estrategia didáctica registrada.</p>
          )}
        </section>

        {/* Recursos */}
        <section style={{ marginTop: 6 }}>
          <h3 style={{ marginBottom: 6 }}>Recursos</h3>
          {Array.isArray(data?.recursos) && data.recursos.length > 0 ? (
            <ol>
              {data.recursos.map((r: Recurso, i: number) => <li key={i}>{r.descripcion}</li>)}
            </ol>
          ) : (
            <p>No hay recursos registrados.</p>
          )}
        </section>

        {/* Bibliografía */}
        <section style={{ marginTop: 6 }}>
          <h3 style={{ marginBottom: 6 }}>Bibliografía</h3>
          {Array.isArray(data?.bibliografia) && data.bibliografia.length > 0 ? (
            <ol>
              {data.bibliografia.map((b: Biblio, i: number) => <li key={i}>{b.texto}</li>)}
            </ol>
          ) : (
            <p>No hay bibliografía registrada.</p>
          )}
        </section>

        <div style={{ marginTop: 20, fontSize: 10, textAlign: "center" }}>
          <span>Generado por el sistema — {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
