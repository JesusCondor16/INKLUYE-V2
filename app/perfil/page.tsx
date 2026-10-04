'use client';

import PerfilCard from '@/components/Perfil/PerfilCard';
import { useSesion } from '@/hooks/useSesion';
import Sidebar from '@/components/Sidebar';
import styles from '@/styles/PerfilPage.module.css';

export default function PerfilPage() {
  // La sesion sale de la cookie httpOnly (via /api/perfil), ya no de localStorage
  const sesion = useSesion();

  if (sesion.estado === 'cargando') {
    return (
      <div className={styles.pageWrapper}>
        <Sidebar />

        {/* role="status" va en el parrafo: en el <main> borraba la region principal */}
        <main id="main-content" tabIndex={-1} className={styles.main}>
          <p className={styles.loading} role="status">Cargando perfil…</p>
        </main>
      </div>
    );
  }

  if (sesion.estado !== 'activa') {
    const error =
      sesion.estado === 'sin-sesion'
        ? 'Su sesión no está iniciada o expiró. Inicie sesión nuevamente.'
        : sesion.error;

    return (
      <div className={styles.pageWrapper}>
        <Sidebar />

        <main id="main-content" tabIndex={-1} className={styles.main}>
          <div role="alert" className={styles.errorBox}>
            <h2 className={styles.errorTitle}>Acceso al perfil</h2>
            <p className={styles.errorText}>{error}</p>

            <div className={styles.center}>
              <a href="/login" className={styles.loginBtn}>
                Ir a iniciar sesión
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { user } = sesion;
  const userWithRole = {
    ...user,
    role: user.role && user.role.trim() !== '' ? user.role : 'N/A',
  };

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />

      <main id="main-content" tabIndex={-1} className={styles.main} aria-labelledby="perfil-titulo">
        <div className={styles.cardWrapper}>
          {/* Titulo principal de la pagina (antes no habia ningun h1) */}
          <h1 id="perfil-titulo" className={styles.titulo}>Mi perfil</h1>
          <PerfilCard user={userWithRole} />
        </div>
      </main>
    </div>
  );
}
