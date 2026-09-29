'use client';

import { useEffect, useRef } from 'react';

// Elementos que pueden recibir foco con Tab
const ENFOCABLES =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento accesible de un dialogo modal (WAI-ARIA Dialog pattern):
 *  - al abrir, el foco entra al dialogo (primer elemento enfocable)
 *  - Escape lo cierra (WCAG 2.1.2)
 *  - Tab / Shift+Tab no salen del dialogo mientras esta abierto
 *  - al cerrar, el foco vuelve al boton que lo abrio (WCAG 2.4.3)
 *
 * @param onClose - funcion que cierra el dialogo
 * @param listo - false mientras el dialogo aun no se muestra (p. ej. "Cargando...")
 * @returns ref que se asigna al elemento con role="dialog"
 */
export function useDialogoAccesible<T extends HTMLElement>(onClose: () => void, listo = true) {
  const ref = useRef<T>(null);

  // Se guarda en un ref para no reiniciar el efecto cada vez que el padre cree un onClose nuevo
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Recordar quien tenia el foco al abrir y devolverselo al cerrar
  useEffect(() => {
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => previo?.focus();
  }, []);

  useEffect(() => {
    const dialogo = ref.current;
    if (!listo || !dialogo) return;

    const enfocables = () =>
      Array.from(dialogo.querySelectorAll<HTMLElement>(ENFOCABLES)).filter(
        (el) => !el.hasAttribute('disabled') && el.getClientRects().length > 0,
      );

    (enfocables()[0] ?? dialogo).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const lista = enfocables();
      if (lista.length === 0) return;
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [listo]);

  return ref;
}
