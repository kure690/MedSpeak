import type { LanguageOption } from '@/types';

export const LANGUAGES = [
  { label: 'English', value: 'en-US' },
  { label: 'Filipino / Tagalog', value: 'fil-PH' },
  { label: 'Spanish', value: 'es-ES' },
  { label: 'French', value: 'fr-FR' },
  { label: 'Mandarin Chinese', value: 'zh-CN' },
  { label: 'Japanese', value: 'ja-JP' },
  { label: 'Arabic', value: 'ar-SA' },
] as const satisfies readonly LanguageOption[];

export const DEFAULT_INPUT_LANGUAGE = 'en-US';
export const DEFAULT_OUTPUT_LANGUAGE = 'fil-PH';

export function getLanguageLabel(languageValue: string) {
  return (
    LANGUAGES.find((language) => language.value === languageValue)?.label ??
    languageValue
  );
}
