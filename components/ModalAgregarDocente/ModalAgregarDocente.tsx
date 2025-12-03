'use client';

import { useState, useEffect } from 'react';
import styles from './ModalAgregarDocente.module.css';

interface Docente {
  id?: number;
  name: string;
  email: string;
  role: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  docente?: Docente;
}

export default function ModalAgregarDocente({ onClose, onSuccess, docente }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DOCENTE',
  });

  useEffect(() => {
    if (docente) {
      setForm({
        name: docente.name,
        email: docente.email,
        password: '',
        role: docente.role,
      });
    }
  }, [docente]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('Token no encontrado. Inicia sesión nuevamente.');

    const url = docente?.id ? `/api/users/${docente.id}` : '/api/users';
    const method = docente?.id ? 'PUT' : 'POST';

    // Convertir rol a minúscula
    const payload: any = {
        name: form.name,
        email: form.email,
        role: form.role.toLowerCase(), // <-- aquí
    };
    if (!docente) payload.password = form.password;

    try {
        const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
        });

        if (res.ok) {
        onClose();
        onSuccess();
        } else {
        const err = await res.text();
        alert(`Error al ${docente ? 'editar' : 'registrar'} docente: ${err}`);
        }
    } catch (error) {
        console.error('Error en la petición:', error);
        alert('Ocurrió un error al enviar el formulario.');
    }
    };

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-agregar-docente-titulo"
      aria-describedby="modal-agregar-docente-desc"
    >
      <div className={styles.modalContent}>
        <form onSubmit={handleSubmit} aria-label="Formulario para añadir o editar un docente">
          {/* Header */}
          <div className={styles.modalHeader}>
            <h5 id="modal-agregar-docente-titulo">
              {docente ? 'Editar Docente' : 'Añadir a personal'}
            </h5>
            <button type="button" onClick={onClose} aria-label="Cerrar modal de docente">
              ✖
            </button>
          </div>

          <div id="modal-agregar-docente-desc" className="visually-hidden">
            Este formulario permite registrar o editar los datos de un docente, incluyendo nombre, correo, contraseña y rol.
          </div>

          {/* Body */}
          <div className={styles.modalBody}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Nombre</label>
              <input type="text" id="name" name="name" className="form-control" value={form.name} onChange={handleChange} required />
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Correo</label>
              <input type="email" id="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
            </div>

            {!docente && (
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Contraseña</label>
                <input type="password" id="password" name="password" className="form-control" value={form.password} onChange={handleChange} required />
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="role" className="form-label">Rol</label>
              <select id="role" name="role" className="form-select" value={form.role} onChange={handleChange} required>
                <option value="DOCENTE">Docente</option>
                <option value="COORDINADOR">Coordinador</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button type="submit" className={styles.btnPrimary} aria-label={docente ? 'Guardar cambios del docente' : 'Registrar nuevo docente'}>
              Guardar
            </button>
            <button type="button" className={styles.btnSecondary} onClick={onClose} aria-label="Cancelar registro o edición de docente">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
