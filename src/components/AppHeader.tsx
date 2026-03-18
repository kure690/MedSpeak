import Image from 'next/image';

import type { AppHeaderProps } from '@/types';

export function AppHeader({
  note = 'Privacy-focused translation for healthcare conversations. Prototype only; audio and transcripts stay in this browser session.',
  slogan = 'Translating Care, Connecting Lives.',
  title = 'MedSpeak',
}: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <div className="mb-3 flex justify-center">
          <Image
            alt={`${title} logo. ${slogan}`}
            className="h-auto w-[280px] sm:w-[360px] md:w-[440px]"
            height={340}
            priority
            src="/medspeak-logo.svg"
            width={960}
          />
        </div>
        <p className="mx-auto max-w-2xl text-center text-sm text-slate-500">
          {note}
        </p>
      </div>
    </header>
  );
}
