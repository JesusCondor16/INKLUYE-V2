'use server';

import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarioDesdeTokenServer } from '@/lib/authServer';
import { translateTexts, TranslateNotConfiguredError } from '@/lib/translate';

export async function POST(req: NextRequest) {
  try {
    const usuario = obtenerUsuarioDesdeTokenServer(req);
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { texts, targetLang } = body;

    if (!Array.isArray(texts) || (targetLang !== 'en' && targetLang !== 'zh')) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const translated = await translateTexts(texts, targetLang);
    return NextResponse.json({ translated }, { status: 200 });

  } catch (error: unknown) {
    if (error instanceof TranslateNotConfiguredError) {
      return NextResponse.json(
        { error: 'Traducción no configurada todavía', code: 'NOT_CONFIGURED' },
        { status: 503 }
      );
    }
    console.error('❌ POST /api/translate error:', error);
    return NextResponse.json({ error: 'Error al traducir' }, { status: 500 });
  }
}