export async function getPerfil(token: string) {
  try {
    const res = await fetch('/api/perfil', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) return { user: null, error: data.error };

    // Aseguramos que role siempre esté presente
    const userWithRole = {
      ...data.user,
      role: data.user.role ?? 'N/A', // si no viene, ponemos 'N/A'
    };

    return { user: userWithRole, error: null };
  } catch {
    return { user: null, error: 'Error al obtener perfil' };
  }
}
