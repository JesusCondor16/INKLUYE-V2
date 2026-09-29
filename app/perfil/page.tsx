'use client';

import { useEffect, useState } from 'react';
import PerfilCard from '@/components/Perfil/PerfilCard';
import { getPerfil } from '@/controllers/perfilController';
import Sidebar from '@/components/Sidebar';
import styles from '@/styles/PerfilPage.module.css';

interface User {
  name: string;
  email: string;
  role?: string | null;
}

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No hay token para identificar al usuario.');
      setLoading(false);
      return;
    }

    getPerfil(token)
      .then(({ user, error }) => {
        if (error) setError(error);
        else setUser(user);
      })
      .catch(() => {
        setError('Error al obtener el perfil.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
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

  if (error) {
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

  const userWithRole = {
    ...user!,
    role: user?.role && user.role.trim() !== '' ? user.role : 'N/A',
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
