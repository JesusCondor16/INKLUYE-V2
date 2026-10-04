// lib/correo/enviar.ts
// Envio de correos con nodemailer por SMTP. Solo funciona si estan estas variables en .env:
//
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=465
//   SMTP_USER=su.correo@unmsm.edu.pe
//   SMTP_PASS=contraseña-de-aplicacion-de-16-letras   (NUNCA la contraseña normal de la cuenta)
//   CORREO_REMITENTE="Inkluye <su.correo@unmsm.edu.pe>"
//   APP_URL=http://localhost:3000                       (para armar los enlaces de los correos)
//   CORREO_PERMITIDOS=a@unmsm.edu.pe,b@gmail.com        (OPCIONAL, recomendado en pruebas)
//
// CORREO_PERMITIDOS es un candado: si existe, SOLO se envia a esas direcciones y cualquier
// otra se omite, aunque este en la base de datos. Asi nunca le llega un correo de prueba
// a una persona real. En produccion se quita esa linea.
//
// Sin esas variables el sistema sigue funcionando: solo se omiten los correos
// (las notificaciones dentro de Inkluye se crean igual).
import nodemailer, { type Transporter } from 'nodemailer';
import type { Correo } from './plantillas';

export interface DestinoCorreo {
  para: string;
  correo: Correo;
}

let transporte: Transporter | null = null;

/** Lista de correos permitidos (en minusculas), o null si no hay candado */
export function correosPermitidos(): Set<string> | null {
  const lista = (process.env.CORREO_PERMITIDOS ?? '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  return lista.length ? new Set(lista) : null;
}

export function correoConfigurado(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** URL base para los enlaces de los correos (sin barra final) */
export function urlBase(): string {
  return (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

function obtenerTransporte(): Transporter {
  if (!transporte) {
    const puerto = Number(process.env.SMTP_PORT ?? 465);
    transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: puerto,
      secure: puerto === 465, // 465: TLS directo; 587: STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporte;
}

/**
 * Envia los correos sin detener el flujo: si uno falla se registra en la consola del servidor
 * y los demas siguen. Devuelve cuantos se enviaron.
 */
export async function enviarCorreos(todos: DestinoCorreo[]): Promise<number> {
  if (!correoConfigurado() || todos.length === 0) return 0;

  // Candado de pruebas: solo direcciones de CORREO_PERMITIDOS
  const permitidos = correosPermitidos();
  const destinos = permitidos ? todos.filter((d) => permitidos.has(d.para.trim().toLowerCase())) : todos;
  if (destinos.length < todos.length) {
    console.info(`[correo] Candado CORREO_PERMITIDOS: se omitieron ${todos.length - destinos.length} destinatario(s)`);
  }
  if (destinos.length === 0) return 0;

  const remitente = process.env.CORREO_REMITENTE ?? process.env.SMTP_USER;
  const resultados = await Promise.allSettled(
    destinos.map(({ para, correo }) =>
      obtenerTransporte().sendMail({
        from: remitente,
        to: para,
        subject: correo.asunto,
        text: correo.texto,
        html: correo.html,
      }),
    ),
  );

  resultados.forEach((r, i) => {
    // Solo se registra el dominio del destinatario: no se guardan correos personales en los logs
    if (r.status === 'rejected') {
      console.error(`[correo] No se pudo enviar a *@${destinos[i].para.split('@')[1] ?? '?'}:`, r.reason);
    }
  });
  return resultados.filter((r) => r.status === 'fulfilled').length;
}
