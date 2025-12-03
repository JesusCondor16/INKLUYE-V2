'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './ModalEditarDocente.module.css';
import { updateDocenteView } from '@/controllers/docenteViewController';

interface Docente {
  id?: number;
  name: string;
  email: string;
  role: string;
}

interface Props {
  docente?: Docente;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalEditarDocente({ docente, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ name: '', email: '', role: 'docente' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const titleId = 'editar-docente-title';
  const errId = 'editar-docente-error';

  useEffect(() => {
    if (docente) {
      setForm({
        name: docente.name ?? '',
        email: docente.email ?? '',
        role: docente.role ?? 'docente',
      });
    }
  }, [docente]);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const t = setTimeout(() => firstFieldRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab') {
        trapFocus(e);
      }
    };

    window.addEventListener('keydown', onKey, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [onClose]);

  const trapFocus = (e: KeyboardEvent) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      '[tabindex]:not([tabindex="-1"])',
      '[contentEditable=true]',
    ];
    const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelectors.join(',')))
      .filter((n) => n.offsetParent !== null);

    if (nodes.length === 0) {
      e.preventDefault();
      return;
    }

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    }
  };

  const validate = (): { name?: string; email?: string } => {
    const errors: { name?: string; email?: string } = {};
    const nameTrim = (form.name || '').trim();
    const emailTrim = (form.email || '').trim();

    if (nameTrim.length < 3) errors.name = 'El nombre debe tener al menos 3 caracteres.';
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(emailTrim)) errors.email = 'Ingrese un correo electrónico válido.';

    setFieldErrors(errors);
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: undefined }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!docente?.id) {
      setError('No se encontró el ID del docente a editar.');
      (document.getElementById(errId) as HTMLDivElement | null)?.focus();
      return;
    }

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      if (errors.name) {
        (document.getElementById('name') as HTMLInputElement | null)?.focus();
      } else if (errors.email) {
        (document.getElementById('email') as HTMLInputElement | null)?.focus();
      }
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
      };

      const res = await updateDocenteView(docente.id, payload);

      if (!res.ok) {
        setError(res.message || 'Error al actualizar el docente.');
        (document.getElementById(errId) as HTMLDivElement | null)?.focus();
        return;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error('Error inesperado');
      setError(e.message);
      (document.getElementById(errId) as HTMLDivElement | null)?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} role="presentation" aria-hidden={false}>
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={error ? errId : undefined}
        ref={dialogRef}
      >
        <form onSubmit={handleSubmit} noValidate>
          <header className={styles.modalHeader}>
            <h2 id={titleId} className={styles.title}>
              Editar docente
            </h2>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar diálogo"
              className={styles.closeButton}
            >
              ✖
            </button>
          </header>

          {error && (
            <div
              id={errId}
              className={styles.error}
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
            >
              {error}
            </div>
          )}

          <main className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.formLabel}>
                Nombre completo
              </label>
              <input
                id="name"
                name="name"
                ref={firstFieldRef}
                type="text"
                className={styles.input}
                value={form.name}
                onChange={handleChange}
                aria-invalid={fieldErrors.name ? 'true' : 'false'}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                required
                minLength={3}
              />
              {fieldErrors.name && (
                <div id="name-error" role="alert" aria-live="polite" className={styles.fieldError}>
                  {fieldErrors.name}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={styles.input}
                value={form.email}
                onChange={handleChange}
                aria-invalid={fieldErrors.email ? 'true' : 'false'}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                required
                inputMode="email"
              />
              {fieldErrors.email && (
                <div id="email-error" role="alert" aria-live="polite" className={styles.fieldError}>
                  {fieldErrors.email}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="role" className={styles.formLabel}>
                Rol
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className={styles.select}
                aria-required="true"
              >
                <option value="docente">Docente</option>
                <option value="coordinador">Coordinador</option>
              </select>
            </div>
          </main>

          <footer className={styles.modalFooter}>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
              aria-disabled={loading}
            >
              {loading ? 'Guardando…' : 'Guardar'}
            </button>

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              disabled={loading}
              aria-disabled={loading}
            >
              Cancelar
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
