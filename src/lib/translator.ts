import type { TranslationSupportState } from '@/types';

const TRANSLATION_API_UNAVAILABLE_MESSAGE =
  'Native translation is unavailable in this browser. Chrome or Edge over HTTPS is recommended.';
const TRANSLATION_PAIR_UNAVAILABLE_MESSAGE =
  'Native translation is not available for the selected language pair in this browser.';
const TRANSLATION_SECURE_CONTEXT_MESSAGE =
  'Native translation requires HTTPS or localhost in a supported browser.';

const translatorCache = new Map<string, BrowserTranslator>();
const pendingTranslatorCache = new Map<string, Promise<BrowserTranslator>>();

function getTranslatorKey(sourceLanguage: string, targetLanguage: string) {
  return `${sourceLanguage}::${targetLanguage}`;
}

function getTranslatorApi() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!window.isSecureContext) {
    return null;
  }

  return window.Translator ?? null;
}

export function isNativeTranslationSupported() {
  return Boolean(getTranslatorApi());
}

function getInactiveTranslationMessage(sourceLanguage: string, targetLanguage: string) {
  if (sourceLanguage === targetLanguage) {
    return 'Source and target languages match. The translated panel mirrors the original transcript.';
  }

  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return TRANSLATION_SECURE_CONTEXT_MESSAGE;
  }

  if (!getTranslatorApi()) {
    return TRANSLATION_API_UNAVAILABLE_MESSAGE;
  }

  return TRANSLATION_PAIR_UNAVAILABLE_MESSAGE;
}

export async function getTranslationSupport(
  sourceLanguage: string,
  targetLanguage: string,
): Promise<TranslationSupportState> {
  if (sourceLanguage === targetLanguage) {
    return {
      message:
        'Source and target languages match. The translated panel mirrors the original transcript.',
      supported: true,
    };
  }

  if (typeof window === 'undefined') {
    return {
      message: TRANSLATION_API_UNAVAILABLE_MESSAGE,
      supported: false,
    };
  }

  if (!window.isSecureContext) {
    return {
      message: TRANSLATION_SECURE_CONTEXT_MESSAGE,
      supported: false,
    };
  }

  const translatorApi = getTranslatorApi();

  if (!translatorApi) {
    return {
      message: TRANSLATION_API_UNAVAILABLE_MESSAGE,
      supported: false,
    };
  }

  try {
    const availability = await translatorApi.availability({
      sourceLanguage,
      targetLanguage,
    });

    if (!availability || availability === 'unavailable') {
      return {
        message: TRANSLATION_PAIR_UNAVAILABLE_MESSAGE,
        supported: false,
      };
    }

    if (availability === 'downloadable' || availability === 'downloading') {
      return {
        message:
          'Native translation is available. The browser may prepare a local model the first time you use this language pair.',
        supported: true,
      };
    }

    return {
      message: 'Native translation is available for this language pair.',
      supported: true,
    };
  } catch {
    return {
      message: getInactiveTranslationMessage(sourceLanguage, targetLanguage),
      supported: false,
    };
  }
}

async function getOrCreateTranslator(
  sourceLanguage: string,
  targetLanguage: string,
) {
  const key = getTranslatorKey(sourceLanguage, targetLanguage);
  const cachedTranslator = translatorCache.get(key);

  if (cachedTranslator) {
    return cachedTranslator;
  }

  const pendingTranslator = pendingTranslatorCache.get(key);

  if (pendingTranslator) {
    return pendingTranslator;
  }

  const translatorApi = getTranslatorApi();

  if (!translatorApi) {
    throw new Error(getInactiveTranslationMessage(sourceLanguage, targetLanguage));
  }

  const translatorPromise = (async () => {
    const availability = await translatorApi.availability({
      sourceLanguage,
      targetLanguage,
    });

    if (!availability || availability === 'unavailable') {
      throw new Error(TRANSLATION_PAIR_UNAVAILABLE_MESSAGE);
    }

    const translator = await translatorApi.create({
      sourceLanguage,
      targetLanguage,
    });

    translatorCache.set(key, translator);
    return translator;
  })().finally(() => {
    pendingTranslatorCache.delete(key);
  });

  pendingTranslatorCache.set(key, translatorPromise);
  return translatorPromise;
}

export async function prepareTranslator(
  sourceLanguage: string,
  targetLanguage: string,
) {
  const support = await getTranslationSupport(sourceLanguage, targetLanguage);

  if (!support.supported || sourceLanguage === targetLanguage) {
    return support;
  }

  try {
    await getOrCreateTranslator(sourceLanguage, targetLanguage);
    return support;
  } catch (error) {
    return {
      message: getTranslationErrorMessage(error),
      supported: false,
    };
  }
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  signal?: AbortSignal,
) {
  if (!text.trim()) {
    return '';
  }

  if (sourceLanguage === targetLanguage) {
    return text;
  }

  const translator = await getOrCreateTranslator(sourceLanguage, targetLanguage);
  return translator.translate(text, signal ? { signal } : undefined);
}

export function getTranslationErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'AbortError') {
      return 'Translation was canceled before it finished.';
    }

    if (error.name === 'NotAllowedError') {
      return 'Native translation needs a recent user action in this browser. Try changing a language or start listening again.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Translation could not be completed in this browser session.';
}

export function clearTranslatorCache() {
  translatorCache.forEach((translator) => {
    translator.destroy?.();
  });

  translatorCache.clear();
  pendingTranslatorCache.clear();
}
