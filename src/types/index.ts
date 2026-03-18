import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

export type LanguageOption = {
  label: string;
  value: string;
};

export type AppStatus =
  | 'idle'
  | 'listening'
  | 'translating'
  | 'speaking'
  | 'error';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface TranscriptState {
  original: string;
  translated: string;
}

export interface TranslationSupportState {
  message: string;
  supported: boolean;
}

export interface MedSpeakState {
  availableVoicesLoaded: boolean;
  inputLanguage: string;
  isSupportedSpeechRecognition: boolean;
  isSupportedSpeechSynthesis: boolean;
  isSupportedTranslation: boolean;
  originalTranscript: string;
  outputLanguage: string;
  status: AppStatus;
  statusMessage: string;
  translatedTranscript: string;
}

export interface ActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  icon?: LucideIcon;
  loading?: boolean;
  variant?: ButtonVariant;
}

export interface AppHeaderProps {
  note?: string;
  slogan?: string;
  title?: string;
}

export interface LanguageSelectorProps {
  disabled?: boolean;
  id: string;
  languages: ReadonlyArray<{ code: string; name: string }>;
  label: string;
  onChange: (value: string) => void;
  value: string;
}

export interface StatusIndicatorProps {
  message?: string;
  status: AppStatus;
}

export interface TranscriptCardProps {
  content: string;
  emptyStateCopy?: string;
  language: string;
  onSpeak?: () => void;
  speakDisabled?: boolean;
  title: string;
  variant?: 'original' | 'translated';
}

declare global {
  interface BrowserSpeechRecognitionAlternative {
    confidence: number;
    transcript: string;
  }

  interface BrowserSpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    [index: number]: BrowserSpeechRecognitionAlternative;
  }

  interface BrowserSpeechRecognitionResultList {
    length: number;
    [index: number]: BrowserSpeechRecognitionResult;
  }

  interface BrowserSpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: BrowserSpeechRecognitionResultList;
  }

  interface BrowserSpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }

  interface BrowserSpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onend: ((event: Event) => void) | null;
    onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
    onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
    onstart: ((event: Event) => void) | null;
    abort(): void;
    start(): void;
    stop(): void;
  }

  interface BrowserSpeechRecognitionConstructor {
    new (): BrowserSpeechRecognition;
  }

  type BrowserTranslatorAvailability =
    | 'available'
    | 'downloadable'
    | 'downloading'
    | 'unavailable';

  interface BrowserTranslatorCreateOptions {
    sourceLanguage: string;
    targetLanguage: string;
  }

  interface BrowserTranslatorTranslateOptions {
    signal?: AbortSignal;
  }

  interface BrowserTranslator {
    destroy?(): void;
    translate(
      input: string,
      options?: BrowserTranslatorTranslateOptions,
    ): Promise<string>;
  }

  interface BrowserTranslatorStatic {
    availability(options: {
      sourceLanguage: string;
      targetLanguage: string;
    }): Promise<BrowserTranslatorAvailability | null>;
    create(options: BrowserTranslatorCreateOptions): Promise<BrowserTranslator>;
  }

  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    Translator?: BrowserTranslatorStatic;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

export {};
