import { FileText, Volume2 } from 'lucide-react';

import type { TranscriptCardProps } from '@/types';

export function TranscriptCard({
  content,
  emptyStateCopy,
  language,
  onSpeak,
  speakDisabled = false,
  title,
  variant = 'original',
}: TranscriptCardProps) {
  const isTranslated = variant === 'translated';
  const hasContent = content.trim().length > 0;
  const fallbackCopy =
    emptyStateCopy ??
    (isTranslated
      ? 'Translation will appear here'
      : 'Start listening to capture speech');

  return (
    <article
      className={`rounded-xl border p-6 transition-all ${
        isTranslated
          ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-teal-50 shadow-sm'
          : 'border-slate-200 bg-white shadow-sm'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            {language}
          </span>
        </div>
        {hasContent && onSpeak ? (
          <button
            aria-label={`Speak ${title.toLowerCase()}`}
            className="ml-4 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={speakDisabled}
            onClick={onSpeak}
            title="Speak this text"
            type="button"
          >
            <Volume2 className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {hasContent ? (
        <div aria-live="polite">
          <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
            {content}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 rounded-full bg-slate-100 p-3">
            <FileText className="h-6 w-6 text-slate-400" aria-hidden="true" />
          </div>
          <p className="text-sm text-slate-500">{fallbackCopy}</p>
        </div>
      )}
    </article>
  );
}
