// utils/getMenuByRole.ts
import {
  Home,
  Users,
  BookOpen,
  FileText,
  Search,
  User,
  Info,
} from "lucide-react";

// ✅ Exportamos el tipo para poder usarlo en controladores y vistas
export interface MenuItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

/**
 * Retorna el menú de navegación según el rol del usuario.
 * Normaliza el rol a minúsculas y maneja roles nulos.
 */
export default function getMenuByRole(role: string | null): MenuItem[] {
  // Normalizar rol
  const r = role?.toLowerCase() ?? "";

  // Opciones generales
  const buscar = { label: "Buscar Syllabus", path: "/buscar", icon: <Search size={18} /> };
  const perfil = { label: "Mi Perfil", path: "/perfil", icon: <User size={18} /> };
  const info = { label: "Información", path: "/informacion", icon: <Info size={18} /> };

  switch (r) {
    case "director":
      return [
        { label: "Inicio", path: "/director", icon: <Home size={18} /> },
        { label: "Gestión de docentes", path: "/director/docentes", icon: <Users size={18} /> },
        { label: "Gestión de cursos", path: "/cursos", icon: <BookOpen size={18} /> },
        buscar,
        perfil,
        info,
      ];

    case "coordinador":
      return [
        { label: "Mis Cursos", path: "/coordinador/cursos", icon: <BookOpen size={18} /> },
        buscar,
        perfil,
        info,
      ];

    case "docente":
      return [buscar, perfil, info];

    case "estudiante":
      return [
        buscar,
        perfil,
        info,
      ];

    default:
      // Menú por defecto si no hay rol válido
      return [buscar, perfil, info];
  }
}
