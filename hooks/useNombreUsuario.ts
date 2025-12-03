import { useState, useEffect } from 'react';
import { obtenerUsuarioDesdeToken } from '@/lib/authClient';

/**
 * Hook para obtener el nombre del usuario
 * Maneja carga, éxito y errores de forma accesible
 */
export function useNombreUsuario() {
  const [nombre, setNombre] = useState('Cargando...');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNombre = async () => {
      const usuarioToken = obtenerUsuarioDesdeToken();
      if (!usuarioToken?.id) {
        setNombre('Usuario');
        setStatus('success');
        return;
      }

      try {
        const res = await fetch(`/api/users/${usuarioToken.id}`);
        if (!res.ok) throw new Error('Error al obtener usuario');
        const data = await res.json();
        setNombre(data.name || 'Usuario');
        setStatus('success');
      } catch (err) {
        console.error(err);
        setNombre('Usuario');
        setError('No se pudo cargar el nombre del usuario.');
        setStatus('error');
      }
    };

    fetchNombre();
  }, []);

  return { nombre, status, error };
}
