export async function obtenerPerfil(token?: string) {
  const t = token ?? localStorage.getItem('token');
  if (!t) throw new Error('No token');
  const res = await fetch('/api/perfil', { headers: { Authorization: `Bearer ${t}` } });
  if (!res.ok) throw res;
  return res.json();
}
