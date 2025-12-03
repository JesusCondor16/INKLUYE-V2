// controllers/gestionCursosController.ts
export const gestionCursosController = {
  async obtenerCursos() {
    const res = await fetch('/api/cursos');
    if (!res.ok) throw new Error('Error al obtener cursos desde la API');
    return res.json();
  },
};
