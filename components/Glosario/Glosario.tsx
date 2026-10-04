// components/Glosario/Glosario.tsx
// Piezas reutilizables para explicar terminos y siglas (WCAG 2.1 - 3.1.3, 3.1.4 y 3.3.5)
import { definicion } from '@/lib/glosario';
import base from '../ModalsSyllabus/ModalBase.module.css';

/**
 * Ayuda en linea bajo el titulo de una seccion: "Sumilla: Resumen corto del curso..."
 * <dfn> marca el termino que se esta definiendo (tecnica G112 / H54 de WCAG).
 */
export function AyudaTermino({ id }: { id: string }) {
  const e = definicion(id);
  return (
    <p className={base.hint}>
      <dfn>{e.termino}</dfn>: {e.definicion}
    </p>
  );
}

/**
 * Sigla con su significado (tecnica H28 de WCAG): <abbr title="...">WCAG</abbr>.
 * Ademas todas las siglas estan explicadas en la pagina /glosario.
 */
export function Sigla({ id }: { id: string }) {
  const e = definicion(id);
  return <abbr title={e.definicion}>{e.termino}</abbr>;
}
