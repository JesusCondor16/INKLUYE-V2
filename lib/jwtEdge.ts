// lib/jwtEdge.ts
// Verificacion del JWT para el middleware.
// El middleware de Next.js corre en el runtime "edge", donde la libreria jsonwebtoken
// no funciona; por eso aqui se verifica la firma HS256 con Web Crypto (crypto.subtle).
// El token lo sigue firmando lib/jwt.ts con jsonwebtoken (HS256 por defecto).

export interface PayloadSesion {
  id: number;
  role?: string;
  exp?: number;
}

function base64UrlABytes(texto: string): Uint8Array<ArrayBuffer> {
  const base64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  const relleno = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binario = atob(relleno);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

function base64UrlATexto(texto: string): string {
  return new TextDecoder().decode(base64UrlABytes(texto));
}

/**
 * Devuelve el contenido del token si la firma es valida y no expiro; si no, null.
 * `ahora` (en segundos) solo se pasa en las pruebas.
 */
export async function verificarTokenEdge(
  token: string,
  secreto: string,
  ahora: number = Math.floor(Date.now() / 1000)
): Promise<PayloadSesion | null> {
  try {
    if (!token || !secreto) return null;

    const partes = token.split('.');
    if (partes.length !== 3) return null;
    const [cabecera, contenido, firma] = partes;

    // Solo se acepta HS256: rechaza tokens con "alg": "none" u otro algoritmo
    const header = JSON.parse(base64UrlATexto(cabecera));
    if (header.alg !== 'HS256') return null;

    const clave = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secreto),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const firmaValida = await crypto.subtle.verify(
      'HMAC',
      clave,
      base64UrlABytes(firma),
      new TextEncoder().encode(`${cabecera}.${contenido}`)
    );
    if (!firmaValida) return null;

    const payload = JSON.parse(base64UrlATexto(contenido));
    if (typeof payload.exp === 'number' && payload.exp <= ahora) return null;
    if (payload.id === undefined || payload.id === null) return null;

    return payload as PayloadSesion;
  } catch {
    // Token mal formado (base64 o JSON invalido)
    return null;
  }
}
