import jwtDecode from 'jwt-decode';


interface CustomJwtPayload {
  id: number;
  name?: string;     // opcional
  nombre?: string;   // opcional también
  email?: string;
  role?: string;
  rol?: string;
  exp?: number;
}

export function obtenerUsuarioDesdeToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode<CustomJwtPayload>(token);

    // ✅ Soporte tanto para "name" como "nombre"
    const name = decoded.name || decoded.nombre || 'Usuario';

    return {
      ...decoded,
      name, // siempre tendrás un "name"
    };
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return null;
  }
}
