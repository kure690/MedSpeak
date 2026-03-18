import { Languages } from 'lucide-react';

import type { LanguageSelectorProps } from '@/types';

export function LanguageSelector({
  disabled = false,
  id,
  languages,
  label,
  onChange,
  value,
}: LanguageSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="flex items-center gap-2 text-sm font-medium text-slate-700"
        htmlFor={id}
      >
        <Languages className="h-4 w-4 text-slate-500" aria-hidden="true" />
        {label}
      </label>
      <select
        className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-800 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:hover:border-slate-300"
        disabled={disabled}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </div>
  );
}
