'use client';

import React from 'react';
import { useModalSeccion2Controller } from './ModalSeccion2.controller';
import { Competencia, Logro } from './ModalSeccion2.model';

interface ModalSeccion2Props {
  cursoId: number;
  onClose: () => void;
}

export default function ModalSeccion2({ cursoId, onClose }: ModalSeccion2Props) {
  const { competenciasCurso, logros, loading } = useModalSeccion2Controller(cursoId);

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">3. Competencias del perfil de egreso</h2>
            <button className="btn-close"
              onClick={onClose}
              aria-label="Cerrar modal"
            ></button>
          </div>

          <div className="modal-body">
            {/* Competencias */}
            <table className="table table-bordered text-center align-middle">
              <thead className="table-primary">
                <tr>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th>Tipo</th>
                  <th>Nivel</th>
                </tr>
              </thead>
              <tbody>
                {competenciasCurso.length > 0 ? (
                  competenciasCurso.map((c: Competencia, i) => (
                    <tr key={i}>
                      <td>{c.codigo}</td>
                      <td>{c.descripcion}</td>
                      <td>{c.tipo}</td>
                      <td>{c.nivel}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>No hay competencias registradas</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Logros de aprendizaje */}
            <h2 className="mt-4 mb-3">4. Logros de aprendizaje</h2>
            <table className="table table-bordered text-center align-middle">
              <thead className="table-success">
                <tr>
                  <th style={{ width: '20%' }}>Código</th>
                  <th style={{ width: '80%' }}>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {logros.length > 0 ? (
                  logros.map((logro: Logro, i) => (
                    <tr key={i}>
                      <td>{logro.codigo}</td>
                      <td>{logro.descripcion}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2}>No hay logros registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
