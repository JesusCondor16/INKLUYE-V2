'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  INTERVALO_CONSULTA_MS,
  textoNoLeidas,
  leerPreferenciaAnuncios,
  guardarPreferenciaAnuncios,
  type Notificacion,
  type NotificacionesResponse,
} from './Notificaciones.model';

export function useNotificacionesController() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [anuncio, setAnuncio] = useState('');
  // null hasta la primera carga: asi solo se anuncian las que lleguen despues, no las de siempre
  const noLeidasPrevias = useRef<number | null>(null);
  // El usuario puede silenciar los anuncios de notificaciones nuevas (WCAG 2.1 - 2.2.4).
  // En un ref para que la consulta periodica lea siempre el valor actual
  const [anunciarNuevas, setAnunciarNuevas] = useState(true);
  const anunciarRef = useRef(true);

  useEffect(() => {
    const valor = leerPreferenciaAnuncios();
    anunciarRef.current = valor;
    setAnunciarNuevas(valor);
  }, []);

  const cambiarAnunciarNuevas = useCallback((valor: boolean) => {
    anunciarRef.current = valor;
    setAnunciarNuevas(valor);
    guardarPreferenciaAnuncios(valor);
  }, []);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/notificaciones', { credentials: 'include' });
      if (!res.ok) return; // sin sesion o error: la campanita simplemente no muestra nada
      const data = (await res.json()) as NotificacionesResponse;
      setNotificaciones(data.notificaciones);
      setNoLeidas(data.noLeidas);

      const previas = noLeidasPrevias.current;
      // Si el usuario silencio los anuncios, solo cambia el contador visible de la campanita
      if (previas !== null && data.noLeidas > previas && anunciarRef.current) {
        setAnuncio(`Nueva notificación. ${textoNoLeidas(data.noLeidas)}.`);
      }
      noLeidasPrevias.current = data.noLeidas;
    } catch (err: unknown) {
      console.warn('No se pudieron cargar las notificaciones', err);
    }
  }, []);

  // Carga inicial, consulta periodica y al volver a la pestana
  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, INTERVALO_CONSULTA_MS);
    const alVolver = () => {
      if (document.visibilityState === 'visible') cargar();
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [cargar]);

  const marcarLeida = useCallback((id: number) => {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    setNoLeidas((prev) => {
      const nuevo = Math.max(0, prev - 1);
      noLeidasPrevias.current = nuevo;
      return nuevo;
    });
    // keepalive: la peticion termina aunque el enlace cambie de pagina
    fetch(`/api/notificaciones/${id}`, { method: 'PATCH', credentials: 'include', keepalive: true }).catch(
      (err: unknown) => console.warn('No se pudo marcar la notificación', err),
    );
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    try {
      const res = await fetch('/api/notificaciones', { method: 'PATCH', credentials: 'include' });
      if (!res.ok) throw new Error('No se pudieron actualizar las notificaciones');
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
      noLeidasPrevias.current = 0;
      setAnuncio('Todas las notificaciones se marcaron como leídas.');
    } catch (err: unknown) {
      setAnuncio(err instanceof Error ? err.message : 'No se pudieron actualizar las notificaciones');
    }
  }, []);

  return {
    notificaciones,
    noLeidas,
    anuncio,
    marcarLeida,
    marcarTodasLeidas,
    anunciarNuevas,
    cambiarAnunciarNuevas,
  };
}
