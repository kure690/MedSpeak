export const SYNTHESIS_UNSUPPORTED_MESSAGE =
  'Speech playback is unavailable in this browser.';
export const SPEECH_START_TIMEOUT_MS = 1800;
export const SPEECH_MIN_CONFIRMATION_MS = 450;

export function isSpeechSynthesisSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  );
}

export function getSpeechSynthesisVoices() {
  if (!isSpeechSynthesisSupported()) {
    return [];
  }

  return window.speechSynthesis.getVoices();
}

export function getBestVoiceForLanguage(
  voices: SpeechSynthesisVoice[],
  language: string,
) {
  const exactLanguage = language.toLowerCase();
  const baseLanguage = exactLanguage.split('-')[0];

  return (
    voices.find((voice) => voice.lang.toLowerCase() === exactLanguage) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(`${baseLanguage}-`)) ??
    voices.find((voice) => voice.lang.toLowerCase() === baseLanguage) ??
    null
  );
}

export function createSpeechUtterance(text: string, language: string) {
  if (!isSpeechSynthesisSupported()) {
    return null;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = getSpeechSynthesisVoices();
  const voice = getBestVoiceForLanguage(voices, language);

  utterance.lang = language;

  if (voice) {
    utterance.voice = voice;
  }

  return {
    matchedVoice: Boolean(voice),
    utterance,
  };
}

export function getSpeechSynthesisLanguageErrorMessage(
  languageLabel: string,
  matchedVoice: boolean,
  reason: 'start' | 'ended-early' = 'start',
) {
  if (reason === 'ended-early') {
    if (!matchedVoice) {
      return `${languageLabel} audio ended immediately and did not appear to play. This browser likely does not have a compatible voice ready for that language. Try another output language or install a ${languageLabel} voice.`;
    }

    return `${languageLabel} audio ended immediately and may not have played in this browser. Try another output language or browser voice.`;
  }

  if (!matchedVoice) {
    return `${languageLabel} audio playback could not be started because this browser does not appear to have a compatible voice ready for that language. Try another output language or install a ${languageLabel} voice.`;
  }

  return `${languageLabel} audio playback could not be started in this browser. Try again or choose a different output language.`;
}

export function getMinimumExpectedSpeechDuration(text: string) {
  const normalizedLength = text.trim().length;

  if (normalizedLength <= 12) {
    return 180;
  }

  if (normalizedLength <= 40) {
    return 380;
  }

  if (normalizedLength <= 90) {
    return 700;
  }

  return 1100;
}

export function startSpeech(utterance: SpeechSynthesisUtterance) {
  if (!isSpeechSynthesisSupported()) {
    return;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech() {
  if (!isSpeechSynthesisSupported()) {
    return;
  }

  window.speechSynthesis.cancel();
}

export function subscribeToVoiceChanges(
  callback: (voices: SpeechSynthesisVoice[]) => void,
) {
  if (!isSpeechSynthesisSupported()) {
    callback([]);
    return () => undefined;
  }

  const synth = window.speechSynthesis;
  const notify = () => {
    callback(synth.getVoices());
  };

  notify();
  synth.addEventListener('voiceschanged', notify);

  return () => {
    synth.removeEventListener('voiceschanged', notify);
  };
}
