// CoordinadorController.ts
import { NextRequest } from "next/server";
import { getCursosDelCoordinador } from "@/models/CoordinadorModel";
import { obtenerUsuarioDesdeTokenServer } from "@/lib/authServer";

export const obtenerCursosCoordinadorLogueado = async (req: NextRequest) => {
  try {
    const usuario = obtenerUsuarioDesdeTokenServer(req);
    if (!usuario) return { success: false, error: "Usuario no autenticado" };

    const cursos = await getCursosDelCoordinador(usuario.id);
    return { success: true, data: cursos };
  } catch (error) {
    console.error("❌ Error al obtener cursos logueado:", error);
    return { success: false, error: "No se pudieron cargar los cursos" };
  }
};
