'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './ModalEditarCurso.module.css';

interface DocenteOption { id: number; name: string; }
interface CoordinadorOption { id: number; name: string; }

export interface Curso {
  id: number;
  code: string;
  name: string;
  credits: number;
  type: string;
  area?: string | null;
  weeks?: number | null;
  theoryHours?: number | null;
  practiceHours?: number | null;
  labHours?: number | null;
  semester?: string | null;
  cycle?: string | null;
  modality?: string | null;
  group?: string | null;
  sumilla?: string | null;
  user?: { id: number; name: string } | null; // coordinador
  docentes?: { id: number; name: string }[]; // normalized
}

export type ModalSavePayload = {
  cycle?: string | null;
  coordinadorId?: number | null;
  docentesIds?: number[];
};

interface Props {
  curso: Curso;
  coordinadores: CoordinadorOption[];
  docentesOptions: DocenteOption[];
  isSaving?: boolean;
  onSave: (payload: ModalSavePayload) => void | Promise<void>;
  onClose: () => void;
}

export default function ModalEditarCurso({
  curso,
  coordinadores,
  docentesOptions,
  isSaving = false,
  onSave,
  onClose,
}: Props) {
  const [cycle, setCycle] = useState<string>(curso.cycle ?? '');
  const [coordinadorId, setCoordinadorId] = useState<number | ''>(curso.user?.id ?? '');
  const [docentesIds, setDocentesIds] = useState<number[]>(curso.docentes?.map(d => d.id) ?? []);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusableRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // focus first element after open
    setTimeout(() => firstFocusableRef.current?.focus(), 0);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            (last as HTMLElement).focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            (first as HTMLElement).focus();
          }
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const toggleDocente = (id: number) => {
    setDocentesIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const payload: ModalSavePayload = {
      cycle: cycle || null,
      coordinadorId: coordinadorId === '' ? null : coordinadorId,
      docentesIds,
    };
    void onSave(payload);
  };

  return (
    <div className={styles.overlay} role="presentation" aria-hidden={false}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`modal-title-${curso.id}`}
        ref={modalRef}
      >
        <h2 id={`modal-title-${curso.id}`} className={styles.title}>
          Editar curso — {curso.code}
        </h2>

        <form onSubmit={submit} className={styles.form}>
          <h3 className={styles.sectionTitle}>Sección 1: Información general</h3>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span className={styles.labelText}>Código</span>
              <input className={styles.control} value={curso.code} readOnly />
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>Nombre</span>
              <input className={styles.control} value={curso.name} readOnly />
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>Créditos</span>
              <input className={styles.control} value={String(curso.credits ?? '')} readOnly />
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>Tipo</span>
              <input className={styles.control} value={curso.type ?? ''} readOnly />
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>Área</span>
              <input className={styles.control} value={curso.area ?? ''} readOnly />
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>Semanas</span>
              <input className={styles.control} value={String(curso.weeks ?? '')} readOnly />
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>Horas (Teoría)</span>
              <input className={styles.control} value={String(curso.theoryHours ?? '')} readOnly />
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>Horas (Práctica)</span>
              <input className={styles.control} value={String(curso.practiceHours ?? '')} readOnly />
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>Horas (Laboratorio)</span>
              <input className={styles.control} value={String(curso.labHours ?? '')} readOnly />
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>Semestre</span>
              <input className={styles.control} value={curso.semester ?? ''} readOnly />
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>Ciclo (editable)</span>
              <input
                className={styles.control}
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                aria-describedby={`cycle-hint-${curso.id}`}
              />
              <div id={`cycle-hint-${curso.id}`} className={styles.hint}>Editable</div>
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>Modalidad</span>
              <input className={styles.control} value={curso.modality ?? ''} readOnly />
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>Grupo</span>
              <input className={styles.control} value={curso.group ?? ''} readOnly />
            </label>
          </div>

          <label className={styles.fullWidth}>
            <span className={styles.labelText}>Coordinador (editable)</span>
            <select
              className={styles.control}
              value={coordinadorId === '' ? '' : String(coordinadorId)}
              onChange={(e) => setCoordinadorId(e.target.value === '' ? '' : Number(e.target.value))}
              required
            >
              <option value="">— Seleccione —</option>
              {coordinadores.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <div className={styles.fullWidth}>
            <p className={styles.subTitle}>Docentes (editable)</p>
            <div className={styles.docentesList}>
              {docentesOptions.map(d => (
                <label key={d.id} className={styles.docenteItem}>
                  <input
                    type="checkbox"
                    checked={docentesIds.includes(d.id)}
                    onChange={() => toggleDocente(d.id)}
                    className={styles.checkbox}
                    aria-checked={docentesIds.includes(d.id)}
                  />
                  <span>{d.name}</span>
                </label>
              ))}
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Sección 2: Sumilla</h3>

          <div className={styles.sumillaBox}>
            <label className={styles.labelText}>Sumilla</label>
            <textarea
              className={styles.sumillaTextarea}
              value={curso.sumilla ?? ''}
              readOnly
              aria-readonly="true"
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
              ref={firstFocusableRef}
            >
              Cancelar
            </button>

            <button
              type="submit"
              onClick={(e) => submit(e)}
              disabled={isSaving}
              aria-disabled={isSaving}
              className={styles.btnSave}
              ref={lastFocusableRef}
            >
              {isSaving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
