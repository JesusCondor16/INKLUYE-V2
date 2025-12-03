'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ModalEditarCurso, { Curso as ModalCurso, ModalSavePayload } from '@/components/ModalEditarCurso/ModalEditarCurso';
import stylesPage from '@/styles/directorCursos.module.css';

type CursoListItem = {
  id: number;
  code: string;
  name: string;
  type?: string | null;
  cycle?: string | null;
  credits?: number | null;
  user?: { id: number; name: string } | null;
  cursodocente?: { user?: { id: number; name: string } }[];
};

type UserOption = { id: number; name: string };

export default function DirectorCursosPage() {
  const [cursos, setCursos] = useState<CursoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [coordinadores, setCoordinadores] = useState<UserOption[]>([]);
  const [docentesOptions, setDocentesOptions] = useState<UserOption[]>([]);

  const [editingCurso, setEditingCurso] = useState<ModalCurso | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchCursos = fetch('/api/cursos').then(r => r.json());
    const fetchCoordinadores = fetch('/api/users?role=coordinador').then(r => r.json());
    const fetchDocentes = fetch('/api/users?role=docente').then(r => r.json());

    Promise.all([fetchCursos, fetchCoordinadores, fetchDocentes])
      .then(([resCursos, resCoordinadores, resDocentes]) => {
        if (!mounted) return;

        // Normalizar cursos
        const cursosData: unknown[] = Array.isArray(resCursos?.data) ? resCursos.data : (Array.isArray(resCursos) ? resCursos : []);
        const mappedCursos: CursoListItem[] = cursosData.map(c => {
          const curso = c as any; // internal mapping
          return {
            id: curso.id,
            code: curso.code,
            name: curso.name,
            type: curso.type,
            cycle: curso.cycle,
            credits: curso.credits,
            user: curso.user ? { id: curso.user.id, name: curso.user.name } : null,
            cursodocente: curso.cursodocente ?? [],
          };
        });
        setCursos(mappedCursos);

        const coordList: unknown[] = Array.isArray(resCoordinadores?.data) ? resCoordinadores.data : (Array.isArray(resCoordinadores) ? resCoordinadores : []);
        const docList: unknown[] = Array.isArray(resDocentes?.data) ? resDocentes.data : (Array.isArray(resDocentes) ? resDocentes : []);

        setCoordinadores(coordList.map(u => {
          const user = u as { id: number; name: string };
          return { id: user.id, name: user.name };
        }));
        setDocentesOptions(docList.map(u => {
          const user = u as { id: number; name: string };
          return { id: user.id, name: user.name };
        }));
      })
      .catch((err: unknown) => {
        console.error('Error cargando recursos iniciales:', err);
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || 'Error cargando datos');
        setCursos([]);
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  const handleEdit = async (courseId: number) => {
    setError(null);
    try {
      const res = await fetch(`/api/cursos/${courseId}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const payload: unknown = await res.json();
      const p = payload as any;
      const modalCurso: ModalCurso = {
        id: p.id,
        code: p.code,
        name: p.name,
        credits: p.credits ?? 0,
        type: p.type ?? '',
        area: p.area ?? null,
        weeks: p.weeks ?? null,
        theoryHours: p.theoryHours ?? null,
        practiceHours: p.practiceHours ?? null,
        labHours: p.labHours ?? null,
        semester: p.semester ?? null,
        cycle: p.cycle ?? null,
        modality: p.modality ?? null,
        group: p.group ?? null,
        sumilla: p.sumilla ?? null,
        user: p.coordinador ? { id: p.coordinador.id, name: p.coordinador.name } : null,
        docentes: Array.isArray(p.docentes) ? p.docentes.map((d: any) => ({ id: d.id, name: d.name })) : [],
      };
      setEditingCurso(modalCurso);
    } catch (err: unknown) {
      console.error('Error al obtener detalle del curso:', err);
      const msg = err instanceof Error ? err.message : 'Error al abrir editor';
      setError(msg);
    }
  };

  const handleSave = async (payload: ModalSavePayload) => {
    if (!editingCurso) return;
    setIsSaving(true);
    setError(null);

    try {
      const body = {
        cycle: payload.cycle ?? null,
        coordinadorId: payload.coordinadorId ?? null,
        docentes: Array.isArray(payload.docentesIds) ? payload.docentesIds : [],
      };

      const res = await fetch(`/api/cursos/${editingCurso.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const txt = await res.text();
      let json: unknown;
      try { json = JSON.parse(txt); } catch { json = { error: txt }; }
      const j = json as any;

      if (!res.ok) throw new Error(j?.error ?? j?.detalle ?? `HTTP ${res.status}`);

      const updated = j?.curso ?? j?.data ?? null;
      if (updated) {
        setCursos(prev =>
          prev.map(c =>
            c.id === updated.id
              ? {
                  ...c,
                  cycle: updated.cycle ?? c.cycle,
                  user: updated.coordinador ? { id: updated.coordinador.id, name: updated.coordinador.name } : c.user,
                  cursodocente: (updated.cursoDocentes ?? []).map((cd: any) => ({ user: cd.user ?? { id: cd.userId, name: cd.user?.name ?? '' } })),
                }
              : c
          )
        );
      } else {
        setCursos(prev =>
          prev.map(c =>
            c.id === editingCurso.id
              ? {
                  ...c,
                  cycle: body.cycle ?? c.cycle,
                  user: body.coordinadorId ? { id: body.coordinadorId, name: coordinadores.find(x => x.id === body.coordinadorId)?.name ?? '' } : c.user,
                }
              : c
          )
        );
      }

      setEditingCurso(null);
    } catch (err: unknown) {
      console.error('Error guardando curso:', err);
      const msg = err instanceof Error ? err.message : 'Error al guardar cambios';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={stylesPage.wrapper}>
      <Sidebar />
      <main className={stylesPage.mainContent}>
        <a href="#main-content" className="visually-hidden">Saltar al contenido</a>
        <section id="main-content" className={stylesPage.containerCursos}>
          <h1 className={stylesPage.headerCursos}>Gestión de cursos (Director)</h1>
          <p style={{ marginBottom: '1rem' }}>Aquí aparecen todos los cursos. Haz clic en <strong>Editar</strong> para modificar ciclo, coordinador o docentes.</p>

          {loading && <div className={stylesPage.alertMensaje}>Cargando cursos…</div>}
          {error && <div className={stylesPage.alertMensaje} role="alert">Error: {error}</div>}
          {!loading && !error && cursos.length === 0 && <div className={stylesPage.alertMensaje}>No hay cursos registrados.</div>}

          {!loading && !error && cursos.length > 0 && (
            <div className={stylesPage.tableResponsive}>
              <table className={stylesPage.tableCursos} aria-describedby="cursos-desc">
                <caption id="cursos-desc" className="visually-hidden">Listado de cursos con acción editar</caption>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Ciclo</th>
                    <th>Créditos</th>
                    <th>Coordinador</th>
                    <th>Docentes</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.map((c) => (
                    <tr key={c.id}>
                      <td>{c.code}</td>
                      <td style={{ textAlign: 'left' }}>{c.name}</td>
                      <td>{c.type ?? '—'}</td>
                      <td>{c.cycle ?? '—'}</td>
                      <td>{c.credits ?? '—'}</td>
                      <td>{c.user?.name ?? '—'}</td>
                      <td>{(c.cursodocente ?? []).map(cd => cd?.user?.name).filter(Boolean).join(', ') || '—'}</td>
                      <td>
                        <button className={stylesPage.btnAccion} onClick={() => handleEdit(c.id)} aria-label={`Editar curso ${c.name}`}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {editingCurso && (
        <ModalEditarCurso
          curso={editingCurso}
          coordinadores={coordinadores}
          docentesOptions={docentesOptions}
          isSaving={isSaving}
          onSave={handleSave}
          onClose={() => setEditingCurso(null)}
        />
      )}
    </div>
  );
}
