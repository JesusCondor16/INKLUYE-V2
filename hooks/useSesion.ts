'use client';

import { useEffect, useState } from 'react';
import { getPerfil, type ResultadoPerfil } from '@/controllers/perfilController';

type EstadoSesion = ResultadoPerfil | { estado: 'cargando' };

// Una sola consulta a /api/perfil por carga de pagina,
// compartida entre el Sidebar y la pagina que lo usa
let consultaEnCurso: Promise<ResultadoPerfil> | null = null;

function consultarSesion(): Promise<ResultadoPerfil> {
  if (!consultaEnCurso) {
    consultaEnCurso = getPerfil().then((r) => {
      // Si fallo, no se guarda: el siguiente componente vuelve a intentar
      if (r.estado === 'error') consultaEnCurso = null;
      return r;
    });
  }
  return consultaEnCurso;
}

// Se llama al cerrar sesion para que nadie reutilice el usuario anterior
export function olvidarSesion(): void {
  consultaEnCurso = null;
}

export function useSesion(): EstadoSesion {
  const [sesion, setSesion] = useState<EstadoSesion>({ estado: 'cargando' });

  useEffect(() => {
    let montado = true;
    consultarSesion().then((r) => {
      if (montado) setSesion(r);
    });
    return () => {
      montado = false;
    };
  }, []);

  return sesion;
}
