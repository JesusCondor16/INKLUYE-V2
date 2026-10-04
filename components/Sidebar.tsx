'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';
import ModalCerrarSesion from './ModalCerrarSesion/ModalCerrarSesion';
import Notificaciones from './Notificaciones/Notificaciones';
import { normalizarRol, getSidebarMenu, logoutUser } from '../controllers/sidebarController';
import { useSesion, olvidarSesion } from '../hooks/useSesion';
import type { MenuItem } from '../utils/getMenuByRole';

export default function Sidebar() {
  const sesion = useSesion();
  const [modalOpen, setModalOpen] = useState(false);
  const [liveMsg, setLiveMsg] = useState('');
  const liveRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname() ?? '/';

  // El rol viene de /api/perfil (cookie httpOnly). Mientras carga no se muestra
  // ningun menu (antes se asumia 'docente' y aparecia un menu equivocado)
  const role = sesion.estado === 'activa' ? normalizarRol(sesion.user.role) : null;
  const menuItems: MenuItem[] = role ? getSidebarMenu(role) : [];

  /* Live region: limpio y reescribo para forzar anuncio en SR */
  useEffect(() => {
    const el = liveRef.current;
    if (!el) return;

    if (liveMsg) {
      el.textContent = '';
      const t = setTimeout(() => {
        el.textContent = liveMsg;
      }, 50);
      return () => clearTimeout(t);
    } else {
      el.textContent = '';
    }
  }, [liveMsg]);

  const openLogoutModal = () => {
    setModalOpen(true);
    setLiveMsg('Se ha abierto el diálogo de cierre de sesión');
  };

  const closeLogoutModal = () => {
    setModalOpen(false);
    setLiveMsg('Se ha cerrado el diálogo de cierre de sesión');
  };

  const handleLogoutConfirm = async () => {
    await logoutUser();
    olvidarSesion();
    // Recarga completa: no queda estado del usuario anterior en memoria
    window.location.replace('/login');
  };

  const isMenuItemActive = (itemPath: string): boolean => {
    try {
      if (!itemPath) return false;
      const pathSegments = pathname.split('/').filter(Boolean);
      const itemSegments = itemPath.split('/').filter(Boolean);
      return itemSegments.every((seg, i) => seg === pathSegments[i]);
    } catch {
      return false;
    }
  };

  return (
    <aside className={styles.sidebar} aria-label="Barra lateral de navegación principal">
      <div
        ref={liveRef}
        className={styles.srOnly}
        aria-live="polite"
        aria-atomic="true"
        role="status"
      />

      <div className={styles.header}>
        <Image src="/images/inkluye.png" alt="Logo Inkluye" width={40} height={40} priority />
        <h2 className={styles.brand}>Sistema Inkluye</h2>
      </div>

      <Notificaciones />

      <nav className={styles.nav} aria-label="Menú principal del sistema">
        <ul className={styles.menuList}>
          {menuItems.map((item: MenuItem) => {
            const itemPath = item.path ?? '/';
            const active = isMenuItemActive(itemPath);
            const className = `${styles.link} ${active ? styles.linkActive : ''}`.trim();

            return (
              <li key={itemPath} className={styles.menuItemWrapper}>
                <Link href={itemPath} className={className} aria-current={active ? 'page' : undefined}>
                  <span className={styles.icon} aria-hidden="true">{item.icon}</span>
                  <span className={styles.linkText}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.logout}
          onClick={openLogoutModal}
          aria-haspopup="dialog"
          aria-expanded={modalOpen}
          aria-controls="modal-cerrar-sesion"
        >
          <LogOut size={18} aria-hidden="true" focusable={false} />
          <span className={styles.logoutText}>Cerrar sesión</span>
        </button>
      </div>

      {modalOpen && (
        <ModalCerrarSesion
          id="modal-cerrar-sesion"
          isOpen={modalOpen}
          title="Confirmar cierre de sesión"
          description="¿Desea cerrar su sesión actualmente activa?"
          onCancel={closeLogoutModal}
          onConfirm={handleLogoutConfirm}
        />
      )}
    </aside>
  );
}
