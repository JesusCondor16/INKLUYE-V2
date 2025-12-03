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

// Tipos para respuestas de la API
interface ApiResponse<T> {
  success: boolean;
  data?: T[];
  error?: string;
}

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

    const fetchCursos = fetch('/api/cursos').then(r => r.json() as Promise<ApiResponse<CursoListItem>>);
    const fetchCoordinadores = fetch('/api/users?role=coordinador').then(r => r.json() as Promise<ApiResponse<UserOption>>);
    const fetchDocentes = fetch('/api/users?role=docente').then(r => r.json() as Promise<ApiResponse<UserOption>>);

    Promise.all([fetchCursos, fetchCoordinadores, fetchDocentes])
      .then(([resCursos, resCoordinadores, resDocentes]) => {
        if (!mounted) return;

        const mappedCursos: CursoListItem[] = (resCursos.data ?? []).map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
          type: c.type ?? null,
          cycle: c.cycle ?? null,
          credits: c.credits ?? null,
          user: c.user ? { id: c.user.id, name: c.user.name } : null,
          cursodocente: c.cursodocente ?? [],
        }));
        setCursos(mappedCursos);

        setCoordinadores((resCoordinadores.data ?? []).map(u => ({ id: u.id, name: u.name })));
        setDocentesOptions((resDocentes.data ?? []).map(u => ({ id: u.id, name: u.name })));
      })
      .catch((err: unknown) => {
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
      const p: ModalCurso = await res.json();
      // Aseguramos que docentes estén tipados
      const modalCurso: ModalCurso = {
        ...p,
        docentes: Array.isArray(p.docentes) ? p.docentes.map(d => ({ id: d.id, name: d.name })) : [],
        user: p.user ? { id: p.user.id, name: p.user.name } : null,
      };
      setEditingCurso(modalCurso);
    } catch (err: unknown) {
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
        docentes: payload.docentesIds ?? [],
      };

      const res = await fetch(`/api/cursos/${editingCurso.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(async () => ({ error: await res.text() }));
      if (!res.ok) throw new Error(json?.error ?? json?.detalle ?? `HTTP ${res.status}`);

      const updated = json?.curso ?? null;
      if (updated) {
        setCursos(prev =>
          prev.map(c =>
            c.id === updated.id
              ? {
                  ...c,
                  cycle: updated.cycle ?? c.cycle,
                  user: updated.coordinador ? { id: updated.coordinador.id, name: updated.coordinador.name } : c.user,
                  cursodocente: (updated.cursoDocentes ?? []).map(cd => ({ user: cd.user ?? { id: cd.userId, name: cd.user?.name ?? '' } })),
                }
              : c
          )
        );
      }

      setEditingCurso(null);
    } catch (err: unknown) {
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
          {loading && <div className={stylesPage.alertMensaje}>Cargando cursos…</div>}
          {error && <div className={stylesPage.alertMensaje} role="alert">Error: {error}</div>}
          {!loading && !error && cursos.length === 0 && <div className={stylesPage.alertMensaje}>No hay cursos registrados.</div>}
          {!loading && !error && cursos.length > 0 && (
            <div className={stylesPage.tableResponsive}>
              <table className={stylesPage.tableCursos}>
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
                  {cursos.map(c => (
                    <tr key={c.id}>
                      <td>{c.code}</td>
                      <td>{c.name}</td>
                      <td>{c.type ?? '—'}</td>
                      <td>{c.cycle ?? '—'}</td>
                      <td>{c.credits ?? '—'}</td>
                      <td>{c.user?.name ?? '—'}</td>
                      <td>{(c.cursodocente ?? []).map(cd => cd.user?.name).filter(Boolean).join(', ') || '—'}</td>
                      <td>
                        <button className={stylesPage.btnAccion} onClick={() => handleEdit(c.id)}>Editar</button>
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
