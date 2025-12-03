'use client';

import { useEffect, useState } from 'react';
import ModalAgregarDocente from '@/components/ModalAgregarDocente/ModalAgregarDocente';
import ModalEditarDocente from '@/components/ModalEditarDocente/ModalEditarDocente';
import ModalHistorialDocente from '@/components/ModalHistorialDocente/ModalHistorialDocente';
import { Pencil, Trash2, Clock } from 'lucide-react';
import styles from '@/styles/GestionDocentes.module.css'; // ⚡ CSS separado

interface Docente {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function GestionDocentesPage() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<Docente | null>(null);

  const cargarDocentes = async () => {
    try {
      const res = await fetch('/api/docentes');
      if (!res.ok) {
        const errData: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? 'Error al obtener docentes');
      }
      const data: Docente[] = await res.json();
      setDocentes(data);
    } catch (error: unknown) {
      console.error('Error al cargar docentes:', error);
      const msg = error instanceof Error ? error.message : String(error);
      setMensaje(`❌ ${msg}`);
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  useEffect(() => {
    cargarDocentes();
  }, []);

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Seguro que desea eliminar este docente?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const resData: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.error ?? 'No se pudo eliminar');
      setMensaje('✅ Docente eliminado correctamente.');
      cargarDocentes();
      setTimeout(() => setMensaje(''), 5000);
    } catch (error: unknown) {
      console.error('Error al eliminar docente:', error);
      const msg = error instanceof Error ? error.message : String(error);
      setMensaje(`❌ ${msg}`);
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  const handleEditClick = (docente: Docente) => {
    setDocenteSeleccionado(docente);
    setMostrarEditar(true);
  };

  const handleVerHistorial = (docente: Docente) => {
    setDocenteSeleccionado(docente);
    setMostrarHistorial(true);
  };

  return (
    <main className={styles.container} role="main" aria-label="Gestión de docentes">
      <header className={styles.header}>
        <h1 tabIndex={0} className={styles.title}>
          👩‍🏫 Gestión de Docentes
        </h1>
        <button
          className={styles.btnPrimary}
          onClick={() => {
            setDocenteSeleccionado(null);
            setMostrarAgregar(true);
          }}
          aria-label="Agregar nuevo docente"
        >
          + Añadir Docente
        </button>
      </header>

      {mensaje && (
        <div className={styles.alert} role="alert" aria-live="polite" tabIndex={0}>
          {mensaje}
        </div>
      )}

      <div className={styles.tableContainer} role="region" aria-labelledby="tabla-docentes">
        <table className={styles.table}>
          <caption id="tabla-docentes">
            Lista de docentes con acciones de edición, eliminación e historial
          </caption>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {docentes.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.noData} tabIndex={0}>
                  No hay docentes registrados actualmente.
                </td>
              </tr>
            ) : (
              docentes.map((docente, index) => (
                <tr key={docente.id}>
                  <td>{index + 1}</td>
                  <td>{docente.name}</td>
                  <td>{docente.email}</td>
                  <td>{docente.role.charAt(0).toUpperCase() + docente.role.slice(1)}</td>
                  <td>
                    <div className={styles.actionGroup} role="group" aria-label={`Acciones para ${docente.name}`}>
                      <button className={styles.btnEdit} onClick={() => handleEditClick(docente)}>
                        <Pencil size={16} className={styles.icon} /> Editar
                      </button>
                      <button className={styles.btnDelete} onClick={() => handleEliminar(docente.id)}>
                        <Trash2 size={16} className={styles.icon} /> Eliminar
                      </button>
                      <button className={styles.btnHistorial} onClick={() => handleVerHistorial(docente)}>
                        <Clock size={16} className={styles.icon} /> Historial
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarAgregar && (
        <ModalAgregarDocente
          onClose={() => setMostrarAgregar(false)}
          onSuccess={() => {
            setMostrarAgregar(false);
            cargarDocentes();
          }}
        />
      )}

      {mostrarEditar && docenteSeleccionado && (
        <ModalEditarDocente
          docente={docenteSeleccionado}
          onClose={() => {
            setMostrarEditar(false);
            setDocenteSeleccionado(null);
          }}
          onSuccess={() => {
            setMostrarEditar(false);
            setDocenteSeleccionado(null);
            cargarDocentes();
          }}
        />
      )}

      {mostrarHistorial && docenteSeleccionado && (
        <ModalHistorialDocente
          docente={docenteSeleccionado}
          onClose={() => {
            setMostrarHistorial(false);
            setDocenteSeleccionado(null);
          }}
        />
      )}
    </main>
  );
}
