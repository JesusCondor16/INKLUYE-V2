export class TranslateNotConfiguredError extends Error {
  constructor() {
    super('GOOGLE_TRANSLATE_API_KEY no está configurada');
    this.name = 'TranslateNotConfiguredError';
  }
}

const GOOGLE_LANG_CODE: Record<'en' | 'zh', string> = {
  en: 'en',
  zh: 'zh-CN',
};

export async function translateTexts(texts: string[], targetLang: 'en' | 'zh'): Promise<string[]> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    throw new TranslateNotConfiguredError();
  }

  const nonEmpty = texts.map(t => (t && t.trim().length ? t : null));
  const toTranslate = nonEmpty.filter((t): t is string => t !== null);

  if (!toTranslate.length) {
    return texts.map(() => '');
  }

  const res = await fetch(
    `https://translation.googleapis.com/language/translate2?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: toTranslate,
        source: 'es',
        target: GOOGLE_LANG_CODE[targetLang],
        format: 'text',
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Google Translate API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const translations: string[] = json?.data?.translations?.map((tr: any) => tr.translatedText) ?? [];

  let cursor = 0;
  return nonEmpty.map(t => (t === null ? '' : translations[cursor++] ?? t));
}