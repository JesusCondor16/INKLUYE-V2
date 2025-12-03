// app/(mvc)/controllers/docenteViewController.ts
// Controlador para uso en el cliente (view controller).
// Todas las funciones devuelven: { ok: boolean, data?: any, message?: string }

export type DocentePayload = {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
};

async function parseErrorResponse(res: Response) {
  // intenta parsear JSON con { error } o texto plano
  try {
    const json = await res.clone().json().catch(() => null);
    if (json && (json.error || json.message)) return String(json.error ?? json.message);
  } catch {
    /* ignore */
  }
  try {
    const text = await res.text().catch(() => null);
    if (text) return text;
  } catch {
    /* ignore */
  }
  return `HTTP ${res.status}`;
}

/**
 * GET /api/docentes
 */
export async function getAllDocentesView() {
  try {
    const res = await fetch(`/api/docentes`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin',
    });

    if (!res.ok) {
      const message = await parseErrorResponse(res);
      return { ok: false, message };
    }

    const data = await res.json().catch(() => null);
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error de red' };
  }
}

/**
 * GET /api/docentes/:id
 */
export async function getDocenteByIdView(id: number) {
  if (!id) return { ok: false, message: 'ID no proporcionado' };

  try {
    const res = await fetch(`/api/docentes/${id}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin',
    });

    if (!res.ok) {
      const message = await parseErrorResponse(res);
      return { ok: false, message };
    }

    const data = await res.json().catch(() => null);
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error de red' };
  }
}

/**
 * POST /api/docentes
 * payload: { name, email, password, role? }
 */
export async function createDocenteView(payload: DocentePayload) {
  try {
    const res = await fetch(`/api/docentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const message = await parseErrorResponse(res);
      return { ok: false, message };
    }

    const data = await res.json().catch(() => null);
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error de red' };
  }
}

/**
 * PUT /api/docentes/:id
 * Uso principal del modal: actualizar docente
 * payload: { name?, email?, role? }
 */
export async function updateDocenteView(id: number, payload: DocentePayload) {
  if (!id) return { ok: false, message: 'ID no proporcionado' };

  try {
    const res = await fetch(`/api/docentes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const message = await parseErrorResponse(res);
      return { ok: false, message };
    }

    const data = await res.json().catch(() => null);
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error de red' };
  }
}

/**
 * DELETE /api/docentes/:id
 */
export async function removeDocenteView(id: number) {
  if (!id) return { ok: false, message: 'ID no proporcionado' };

  try {
    const res = await fetch(`/api/docentes/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin',
    });

    if (!res.ok) {
      const message = await parseErrorResponse(res);
      return { ok: false, message };
    }

    const data = await res.json().catch(() => null);
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error de red' };
  }
}
