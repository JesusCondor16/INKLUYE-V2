'use client';
import styles from './PerfilCard.module.css';

interface Props {
  user: {
    name: string;
    email: string;
    role?: string | null; // permitimos que venga null
  };
}

// Nombre legible de cada rol del sistema
const NOMBRE_ROL: Record<string, string> = {
  director: 'Director',
  coordinador: 'Coordinador',
  docente: 'Docente',
  estudiante: 'Estudiante',
};

export default function PerfilCard({ user }: Props) {
  const rolBase = user.role?.trim().toLowerCase() ?? '';
  const role = NOMBRE_ROL[rolBase] ?? (rolBase !== '' ? user.role : 'Sin rol asignado');

  // <section> con titulo en vez de aria-label en <div> (que los lectores ignoran);
  // sin tabIndex en textos: solo lo interactivo debe recibir foco con Tab (2.4.3)
  return (
    <section className={styles.card} aria-labelledby="perfil-nombre">
      <header className={styles.header}>
        <h2 id="perfil-nombre">{user.name}</h2>
      </header>

      <dl className={styles.datos}>
        <dt className={styles.label}>Correo electrónico</dt>
        <dd className={styles.value}>{user.email}</dd>

        <dt className={styles.label}>Rol</dt>
        <dd className={styles.value}>{role}</dd>
      </dl>
    </section>
  );
}
