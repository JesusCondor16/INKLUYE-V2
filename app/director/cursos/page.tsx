'use client';

import { useEffect, useState } from 'react';
import ModalEditarCurso, {
  Curso as ModalCurso,
  ModalSavePayload
} from '@/components/ModalEditarCurso/ModalEditarCurso';

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

type UserOption = {
  id: number;
  name: string;
};

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

    const fetchCursos =
      fetch('/api/cursos').then(r => r.json());

    const fetchCoordinadores =
      fetch('/api/users?role=coordinador').then(r => r.json());

    const fetchDocentes =
      fetch('/api/users?role=docente').then(r => r.json());

    Promise.all([
      fetchCursos,
      fetchCoordinadores,
      fetchDocentes
    ])

    .then(([resCursos, resCoordinadores, resDocentes]) => {

      if (!mounted) return;

      const cursosList =
        Array.isArray(resCursos)
          ? resCursos
          : resCursos.data ?? [];

      const coordinadoresList =
        Array.isArray(resCoordinadores)
          ? resCoordinadores
          : resCoordinadores.data ?? [];

      const docentesList =
        Array.isArray(resDocentes)
          ? resDocentes
          : resDocentes.data ?? [];

      const mappedCursos: CursoListItem[] =
        cursosList.map((c: any) => ({

          id: c.id,
          code: c.code,
          name: c.name,
          type: c.type ?? null,
          cycle: c.cycle ?? null,
          credits: c.credits ?? null,

          // coordinador (según tu API)
          user: c.user
            ? {
                id: c.user.id,
                name: c.user.name
              }
            : null,

          // docentes (según tu API)
          cursodocente: (c.cursodocente ?? []).map((cd: any) => ({
            user: cd.user
              ? {
                  id: cd.user.id,
                  name: cd.user.name
                }
              : undefined
          }))

        }));

      setCursos(mappedCursos);

      setCoordinadores(
        coordinadoresList.map((u: any) => ({
          id: u.id,
          name: u.name
        }))
      );

      setDocentesOptions(
        docentesList.map((u: any) => ({
          id: u.id,
          name: u.name
        }))
      );

    })

    .catch((err: unknown) => {

      if (!mounted) return;

      const msg =
        err instanceof Error
          ? err.message
          : String(err);

      setError(msg || 'Error cargando datos');
      setCursos([]);

    })

    .finally(() => {

      if (mounted) setLoading(false);

    });

    return () => { mounted = false };

  }, []);

  const handleEdit = async (courseId: number) => {

    setError(null);

    try {

      const res = await fetch(`/api/cursos/${courseId}`);

      if (!res.ok) {

        const txt = await res.text().catch(() => '');

        throw new Error(txt || `HTTP ${res.status}`);

      }

      const data = await res.json();

      const modalCurso: ModalCurso = {

        ...data,

        user: data.user
          ? {
              id: data.user.id,
              name: data.user.name
            }
          : null,

        docentes: Array.isArray(data.cursodocente)
          ? data.cursodocente
              .map((d: any) => d.user)
              .filter(Boolean)
          : []

      };

      setEditingCurso(modalCurso);

    }

    catch (err: unknown) {

      const msg =
        err instanceof Error
          ? err.message
          : 'Error al abrir editor';

      setError(msg);

    }

  };

  const handleSave = async (
    payload: ModalSavePayload
  ) => {

    if (!editingCurso) return;

    setIsSaving(true);
    setError(null);

    try {

      const body = {

        cycle: payload.cycle ?? null,

        coordinadorId:
          payload.coordinadorId ?? null,

        docentes:
          payload.docentesIds ?? []

      };

      const res =
        await fetch(`/api/cursos/${editingCurso.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

      const json = await res.json();

      if (!res.ok) {

        throw new Error(
          json?.error
          ?? json?.detalle
          ?? `HTTP ${res.status}`
        );

      }

      const updated = json?.curso ?? null;

      if (updated) {

        setCursos(prev =>
          prev.map(c =>
            c.id === updated.id
              ? {

                  ...c,

                  cycle:
                    updated.cycle ?? c.cycle,

                  user:
                    updated.user
                      ? {
                          id: updated.user.id,
                          name: updated.user.name
                        }
                      : c.user,

                  cursodocente:
                    (updated.cursodocente ?? []).map((cd: any) => ({

                      user: cd.user
                        ? {
                            id: cd.user.id,
                            name: cd.user.name
                          }
                        : undefined

                    }))

                }
              : c
          )
        );

      }

      setEditingCurso(null);

    }

    catch (err: unknown) {

      const msg =
        err instanceof Error
          ? err.message
          : 'Error al guardar cambios';

      setError(msg);

    }

    finally {

      setIsSaving(false);

    }

  };

  return (

    <div className={stylesPage.wrapper}>
      <main className={stylesPage.mainContent}>
        <section className={stylesPage.containerCursos}>
          <h1 className={stylesPage.headerCursos}>
            Gestión de cursos (Director)
          </h1>

          {loading &&
            <div className={stylesPage.alertMensaje}>
              Cargando cursos…
            </div>
          }

          {error &&
            <div className={stylesPage.alertMensaje}>
              Error: {error}
            </div>
          }

          {!loading && !error && cursos.length === 0 &&
            <div className={stylesPage.alertMensaje}>
              No hay cursos registrados.
            </div>
          }

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

                      <td>
                        {(c.cursodocente ?? [])
                          .map(cd => cd.user?.name)
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </td>

                      <td>

                        <button
                          className={stylesPage.btnAccion}
                          onClick={() => handleEdit(c.id)}
                        >
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