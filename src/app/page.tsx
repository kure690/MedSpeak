'use client';

import {
  ArrowLeftRight,
  Mic,
  RotateCcw,
  Square,
} from 'lucide-react';

import { ActionButton } from '@/components/ActionButton';
import { AppHeader } from '@/components/AppHeader';
import { LanguageSelector } from '@/components/LanguageSelector';
import { StatusIndicator } from '@/components/StatusIndicator';
import { TranscriptCard } from '@/components/TranscriptCard';
import { getLanguageLabel, LANGUAGES } from '@/lib/languages';
import { useMedSpeak } from '@/hooks/useMedSpeak';

export default function Home() {
  const {
    availableVoicesLoaded,
    handleClearSession,
    handleInputLanguageChange,
    handleOutputLanguageChange,
    handleSpeakTranslation,
    handleStartListening,
    handleStopListening,
    handleSwapLanguages,
    inputLanguage,
    isListening,
    isSupportedSpeechRecognition,
    isSupportedSpeechSynthesis,
    isSupportedTranslation,
    originalTranscript,
    outputLanguage,
    status,
    statusMessage,
    translatedTranscript,
  } = useMedSpeak();

  const originalLanguageLabel = getLanguageLabel(inputLanguage);
  const translatedLanguageLabel = getLanguageLabel(outputLanguage);
  const selectorLanguages = LANGUAGES.map((language) => ({
    code: language.value,
    name: language.label,
  }));
  const canSpeakTranslation =
    Boolean(translatedTranscript.trim()) &&
    isSupportedSpeechSynthesis &&
    !isListening;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <AppHeader />

      <StatusIndicator message={statusMessage} status={status} />

      <main className="mx-auto max-w-4xl px-4 pb-12">
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2
            className="mb-2 text-lg font-semibold text-slate-800"
            id="language-settings"
          >
            Language Selection
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Choose the spoken input language and the language patients or
            providers should receive back.
          </p>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <LanguageSelector
              disabled={isListening}
              id="input-language"
              label="Speaking (Input)"
              languages={selectorLanguages}
              onChange={handleInputLanguageChange}
              value={inputLanguage}
            />
            <LanguageSelector
              disabled={isListening}
              id="output-language"
              label="Translate To (Output)"
              languages={selectorLanguages}
              onChange={handleOutputLanguageChange}
              value={outputLanguage}
            />
          </div>
          <ActionButton
            aria-label="Swap input and output languages"
            disabled={isListening}
            fullWidth
            icon={ArrowLeftRight}
            onClick={handleSwapLanguages}
            variant="secondary"
          >
            Swap Languages
          </ActionButton>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <TranscriptCard
            content={originalTranscript}
            emptyStateCopy="Start listening to capture speech."
            language={originalLanguageLabel}
            title="Original Transcript"
            variant="original"
          />
          <TranscriptCard
            content={translatedTranscript}
            emptyStateCopy={
              inputLanguage === outputLanguage
                ? 'The translated panel will mirror the original transcript when both languages match.'
                : 'Translation will appear here when browser-native translation is available.'
            }
            language={translatedLanguageLabel}
            onSpeak={handleSpeakTranslation}
            speakDisabled={!canSpeakTranslation}
            title="Translated Transcript"
            variant="translated"
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2
            className="mb-2 text-lg font-semibold text-slate-800"
            id="session-controls"
          >
            Session Controls
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Start or stop microphone capture with one button, then clear the
            session when the exchange is finished.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ActionButton
              disabled={!isSupportedSpeechRecognition}
              fullWidth
              icon={isListening ? Square : Mic}
              onClick={isListening ? handleStopListening : handleStartListening}
              variant={isListening ? 'secondary' : 'primary'}
            >
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </ActionButton>
            <ActionButton
              disabled={
                !originalTranscript.trim() &&
                !translatedTranscript.trim() &&
                !isListening
              }
              fullWidth
              icon={RotateCcw}
              onClick={handleClearSession}
              variant="danger"
            >
              Clear Session
            </ActionButton>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {!isSupportedSpeechRecognition ? (
              <p>
                Speech recognition is unavailable here. Chrome or Edge over
                HTTPS is recommended.
              </p>
            ) : null}
            {!isSupportedTranslation && inputLanguage !== outputLanguage ? (
              <p>
                Native translation is unavailable for this browser or language
                pair, so only the original transcript will update live.
              </p>
            ) : null}
            {!availableVoicesLoaded && isSupportedSpeechSynthesis ? (
              <p>
                Browser voices are still loading. Playback will still try the
                default voice if an exact match is not ready yet.
              </p>
            ) : null}
            {!isSupportedSpeechSynthesis ? (
              <p>
                Browser speech playback is unavailable here, so translated audio
                will remain disabled.
              </p>
            ) : null}
            <p className="text-slate-500">
              Use the speaker icon on the translated transcript card to play the
              translated audio. Confirm important details directly with the
              patient or clinician.
            </p>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-4xl px-4 py-8 text-center">
        <div className="space-y-2 text-sm text-slate-600">
          <p className="font-medium">
            Prototype only. Do not rely on this app for emergencies or
            critical medical decisions.
          </p>
          <p className="text-slate-500">
            Best experienced on Chrome or Edge over HTTPS.
          </p>
        </div>
      </footer>
    </div>
  );
}
