export const SYNTHESIS_UNSUPPORTED_MESSAGE =
  'Speech playback is unavailable in this browser.';

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
