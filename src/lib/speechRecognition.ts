export const SPEECH_RECOGNITION_UNSUPPORTED_MESSAGE =
  'Speech recognition is unavailable in this browser. Chrome or Edge over HTTPS is recommended.';

const recognitionErrorMessages: Record<string, string> = {
  aborted: 'Listening stopped before a transcript was captured.',
  'audio-capture':
    'No microphone was detected. Check your microphone connection and browser permissions.',
  'language-not-supported':
    'The selected input language is not available for speech recognition in this browser.',
  network:
    'Speech recognition requires network access in this browser. Check the connection and try again.',
  'no-speech':
    'No speech was detected. Try speaking closer to the microphone.',
  'not-allowed':
    'Microphone access was denied. Allow microphone permissions and try again.',
  'service-not-allowed':
    'Speech recognition is blocked in this browser or browsing context.',
  unknown: 'Speech recognition ran into an unexpected problem.',
};

export function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported() {
  return Boolean(getSpeechRecognitionConstructor());
}

export function createSpeechRecognition(language: string) {
  const SpeechRecognitionConstructor = getSpeechRecognitionConstructor();

  if (!SpeechRecognitionConstructor) {
    return null;
  }

  const recognition = new SpeechRecognitionConstructor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = language;
  recognition.maxAlternatives = 1;

  return recognition;
}

export function getTranscriptFromRecognitionEvent(
  event: BrowserSpeechRecognitionEvent,
) {
  const transcriptSegments: string[] = [];

  for (let index = 0; index < event.results.length; index += 1) {
    const result = event.results[index];
    const transcript = result?.[0]?.transcript?.trim();

    if (transcript) {
      transcriptSegments.push(transcript);
    }
  }

  return transcriptSegments.join(' ').replace(/\s+/g, ' ').trim();
}

export function getSpeechRecognitionErrorMessage(
  errorCode: string,
  languageLabel?: string,
) {
  if (errorCode === 'language-not-supported' && languageLabel) {
    return `${languageLabel} is not currently available for speech recognition in this browser. Try another input language or use Chrome or Edge over HTTPS.`;
  }

  return recognitionErrorMessages[errorCode] ?? recognitionErrorMessages.unknown;
}

export function getSpeechRecognitionNoTranscriptMessage(languageLabel: string) {
  return `No transcript was captured for ${languageLabel}. This language may not be working in this browser yet, or the microphone did not detect speech clearly. Try another input language or use Chrome or Edge over HTTPS.`;
}
