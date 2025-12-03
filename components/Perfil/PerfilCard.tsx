'use client';
import styles from './PerfilCard.module.css';

interface Props {
  user: {
    name: string;
    email: string;
    role?: string | null; // permitimos que venga null
  };
}

export default function PerfilCard({ user }: Props) {
  // Garantizamos que role siempre tenga un valor legible
  const role = user.role && user.role.trim() !== '' ? user.role : 'N/A';

  return (
    <div className={styles.card} role="region" aria-label="Perfil del usuario">
      <header className={styles.header}>
        <h2 tabIndex={0}>{user.name}</h2>
      </header>

      <div className={styles.fieldGroup} aria-label="Correo electrónico">
        <span className={styles.label}>Correo electrónico</span>
        <p className={styles.value} tabIndex={0}>{user.email}</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.profileMeta} aria-label="Rol del usuario">
        <div className={styles.metaItem} tabIndex={0}>
          Rol: {role}
        </div>
      </div>
    </div>
  );
}
