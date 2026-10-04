'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPerfil } from '@/controllers/perfilController';
import { faseSesion, type FaseSesion } from './AvisoSesion.model';

const ahoraEnSegundos = () => Math.floor(Date.now() / 1000);

export function useAvisoSesionController() {
  const [expiraEn, setExpiraEn] = useState<number | null>(null);
  const [usuario, setUsuario] = useState<{ id: number; email: string } | null>(null);
  const [ahora, setAhora] = useState(ahoraEnSegundos);
  // El usuario cerro el aviso con Escape: no se vuelve a mostrar hasta que venza
  const [avisoDescartado, setAvisoDescartado] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  // Vencimiento real de la sesion (viene del token, lo informa /api/perfil)
  useEffect(() => {
    getPerfil().then((r) => {
      if (r.estado === 'activa') {
        setExpiraEn(r.expiraEn);
        setUsuario({ id: r.user.id, email: r.user.email });
      }
    });
  }, []);

  // Reloj: cada 15 s y al volver a la pestaña (tras suspender el equipo los temporizadores se atrasan)
  useEffect(() => {
    const actualizar = () => setAhora(ahoraEnSegundos());
    const id = setInterval(actualizar, 15_000);
    document.addEventListener('visibilitychange', actualizar);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', actualizar);
    };
  }, []);

  const faseReal: FaseSesion = faseSesion(expiraEn, ahora);
  const fase: FaseSesion = faseReal === 'aviso' && avisoDescartado ? 'normal' : faseReal;

  // "Seguir conectado": la sesion sigue vigente, se pide un token nuevo
  const renovar = useCallback(async () => {
    setProcesando(true);
    setError('');
    try {
      const res = await fetch('/api/auth/renovar', { method: 'POST' });
      const data: { expiraEn?: number | null; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.expiraEn) throw new Error(data.error ?? 'No se pudo extender la sesión.');
      setExpiraEn(data.expiraEn);
      setAvisoDescartado(false);
      setAhora(ahoraEnSegundos());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo extender la sesión.');
    } finally {
      setProcesando(false);
    }
  }, []);

  // Sesion vencida: volver a ingresar la contraseña SIN salir de la pagina (WCAG 2.1 - 2.2.5),
  // asi no se pierde lo que estaba escrito en formularios y modales
  const reautenticar = useCallback(
    async (password: string) => {
      if (!usuario) return;
      setProcesando(true);
      setError('');
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: usuario.email, password }),
        });
        const data: { message?: string } = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message ?? 'No se pudo iniciar sesión.');

        const perfil = await getPerfil();
        if (perfil.estado !== 'activa' || perfil.user.id !== usuario.id) {
          // No deberia pasar (el correo es fijo), pero si cambia el usuario no se reutiliza la pagina
          window.location.reload();
          return;
        }
        setExpiraEn(perfil.expiraEn);
        setAvisoDescartado(false);
        setAhora(ahoraEnSegundos());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
      } finally {
        setProcesando(false);
      }
    },
    [usuario],
  );

  const cerrarSesion = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    window.location.replace('/login');
  }, []);

  return {
    fase,
    expiraEn,
    ahora,
    email: usuario?.email ?? '',
    procesando,
    error,
    renovar,
    reautenticar,
    cerrarSesion,
    descartarAviso: () => setAvisoDescartado(true),
  };
}
