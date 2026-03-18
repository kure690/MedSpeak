import {
  startTransition,
  useDeferredValue,
  useEffect,
  useCallback,
  useRef,
  useState,
} from 'react';

import {
  getLanguageLabel,
  LANGUAGES,
  DEFAULT_INPUT_LANGUAGE,
  DEFAULT_OUTPUT_LANGUAGE,
} from '@/lib/languages';
import {
  createSpeechRecognition,
  getSpeechRecognitionErrorMessage,
  getSpeechRecognitionNoTranscriptMessage,
  getTranscriptFromRecognitionEvent,
  isSpeechRecognitionSupported,
  SPEECH_RECOGNITION_UNSUPPORTED_MESSAGE,
} from '@/lib/speechRecognition';
import {
  cancelSpeech,
  createSpeechUtterance,
  getMinimumExpectedSpeechDuration,
  getSpeechSynthesisLanguageErrorMessage,
  isSpeechSynthesisSupported,
  SPEECH_MIN_CONFIRMATION_MS,
  SPEECH_START_TIMEOUT_MS,
  subscribeToVoiceChanges,
  SYNTHESIS_UNSUPPORTED_MESSAGE,
  startSpeech,
} from '@/lib/speechSynthesis';
import {
  clearTranslatorCache,
  getTranslationErrorMessage,
  getTranslationSupport,
  isNativeTranslationSupported,
  prepareTranslator,
  translateText,
} from '@/lib/translator';
import type { AppStatus, TranslationSupportState } from '@/types';

const READY_MESSAGE =
  'Ready for a short translation session. Keep the exchange brief and confirm important details directly.';
const CLEARED_MESSAGE =
  'Session cleared. Nothing from this prototype is stored after you leave the page.';

type LanguageValue = (typeof LANGUAGES)[number]['value'];

export function useMedSpeak() {
  const [inputLanguage, setInputLanguage] =
    useState<LanguageValue>(DEFAULT_INPUT_LANGUAGE);
  const [outputLanguage, setOutputLanguage] =
    useState<LanguageValue>(DEFAULT_OUTPUT_LANGUAGE);
  const [originalTranscript, setOriginalTranscript] = useState('');
  const [translatedTranscript, setTranslatedTranscript] = useState('');
  const [status, setStatus] = useState<AppStatus>('idle');
  const [statusMessage, setStatusMessage] = useState(READY_MESSAGE);
  const [isSupportedSpeechRecognition, setIsSupportedSpeechRecognition] =
    useState(false);
  const [isSupportedSpeechSynthesis, setIsSupportedSpeechSynthesis] =
    useState(false);
  const [isSupportedTranslation, setIsSupportedTranslation] = useState(true);
  const [availableVoicesLoaded, setAvailableVoicesLoaded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const deferredOriginalTranscript = useDeferredValue(originalTranscript);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechConfirmedTimeoutRef = useRef<number | null>(null);
  const speechPlaybackStartedAtRef = useRef<number | null>(null);
  const speechStartTimeoutRef = useRef<number | null>(null);
  const translationRequestIdRef = useRef(0);
  const listeningStartedAtRef = useRef<number | null>(null);
  const receivedRecognitionResultRef = useRef(false);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const originalTranscriptRef = useRef('');
  const inputLanguageRef = useRef(inputLanguage);
  const outputLanguageRef = useRef(outputLanguage);
  const stopRequestedRef = useRef(false);
  const speechSupportRef = useRef(false);
  const translationSupportRef = useRef<TranslationSupportState>({
    message: READY_MESSAGE,
    supported: true,
  });

  const setListeningState = useCallback((value: boolean) => {
    isListeningRef.current = value;
    setIsListening(value);
  }, []);

  const setSpeakingState = useCallback((value: boolean) => {
    isSpeakingRef.current = value;
    setIsSpeaking(value);
  }, []);

  const getRestingMessage = useCallback(
    ({
      speechSupported,
      translationSupport,
      sourceLanguage,
      targetLanguage,
    }: {
      sourceLanguage: string;
      speechSupported: boolean;
      targetLanguage: string;
      translationSupport: TranslationSupportState;
    }) => {
      if (!speechSupported) {
        return SPEECH_RECOGNITION_UNSUPPORTED_MESSAGE;
      }

      if (sourceLanguage === targetLanguage) {
        return 'Source and target languages match. The translated panel mirrors the original transcript.';
      }

      if (!translationSupport.supported) {
        return translationSupport.message;
      }

      return READY_MESSAGE;
    },
    [],
  );

  const restoreRestingStatus = useCallback(
    (message?: string) => {
      if (isListeningRef.current || isSpeakingRef.current) {
        return;
      }

      const hasLanguageSupportIssue =
        !speechSupportRef.current ||
        (inputLanguageRef.current !== outputLanguageRef.current &&
          !translationSupportRef.current.supported);

      setStatus(hasLanguageSupportIssue ? 'error' : 'idle');
      setStatusMessage(
        message ??
          getRestingMessage({
            sourceLanguage: inputLanguageRef.current,
            speechSupported: speechSupportRef.current,
            targetLanguage: outputLanguageRef.current,
            translationSupport: translationSupportRef.current,
          }),
      );
    },
    [getRestingMessage],
  );

  const teardownRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;
    recognition.onstart = null;
    recognitionRef.current = null;
    recognition.abort();
  }, []);

  const teardownSpeech = useCallback(() => {
    if (speechConfirmedTimeoutRef.current !== null) {
      window.clearTimeout(speechConfirmedTimeoutRef.current);
      speechConfirmedTimeoutRef.current = null;
    }

    if (speechStartTimeoutRef.current !== null) {
      window.clearTimeout(speechStartTimeoutRef.current);
      speechStartTimeoutRef.current = null;
    }

    speechPlaybackStartedAtRef.current = null;

    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current.onstart = null;
      utteranceRef.current = null;
    }

    cancelSpeech();
    setSpeakingState(false);
  }, [setSpeakingState]);

  const primeTranslationPair = (sourceLanguage: string, targetLanguage: string) => {
    if (
      sourceLanguage === targetLanguage ||
      !isNativeTranslationSupported()
    ) {
      return;
    }

    void prepareTranslator(sourceLanguage, targetLanguage).catch(() => undefined);
  };

  useEffect(() => {
    const supportTimer = window.setTimeout(() => {
      const speechRecognitionSupported = isSpeechRecognitionSupported();
      const speechSynthesisSupported = isSpeechSynthesisSupported();

      speechSupportRef.current = speechRecognitionSupported;
      setIsSupportedSpeechRecognition(speechRecognitionSupported);
      setIsSupportedSpeechSynthesis(speechSynthesisSupported);

      if (!speechRecognitionSupported) {
        setStatus('error');
        setStatusMessage(SPEECH_RECOGNITION_UNSUPPORTED_MESSAGE);
      }
    }, 0);

    const unsubscribeVoices = subscribeToVoiceChanges((voices) => {
      setAvailableVoicesLoaded(voices.length > 0);
    });

    return () => {
      window.clearTimeout(supportTimer);
      teardownRecognition();
      teardownSpeech();
      clearTranslatorCache();
      unsubscribeVoices();
    };
  }, [teardownRecognition, teardownSpeech]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    originalTranscriptRef.current = originalTranscript;
  }, [originalTranscript]);

  useEffect(() => {
    inputLanguageRef.current = inputLanguage;
  }, [inputLanguage]);

  useEffect(() => {
    outputLanguageRef.current = outputLanguage;
  }, [outputLanguage]);

  useEffect(() => {
    let isCurrent = true;

    const syncTranslationSupport = async () => {
      const support = await getTranslationSupport(inputLanguage, outputLanguage);

      if (!isCurrent) {
        return;
      }

      translationSupportRef.current = support;
      setIsSupportedTranslation(support.supported);

      if (!originalTranscriptRef.current.trim()) {
        restoreRestingStatus();
      }
    };

    void syncTranslationSupport();

    return () => {
      isCurrent = false;
    };
  }, [inputLanguage, outputLanguage, restoreRestingStatus]);

  useEffect(() => {
    const currentTranscript = deferredOriginalTranscript.trim();
    const requestId = translationRequestIdRef.current + 1;
    translationRequestIdRef.current = requestId;

    if (!currentTranscript) {
      startTransition(() => {
        setTranslatedTranscript('');
      });
      return;
    }

    if (inputLanguage === outputLanguage) {
      startTransition(() => {
        setTranslatedTranscript(deferredOriginalTranscript);
      });

      queueMicrotask(() => {
        restoreRestingStatus(
          'Source and target languages match. The translated transcript mirrors the original.',
        );
      });

      return;
    }

    if (!translationSupportRef.current.supported) {
      startTransition(() => {
        setTranslatedTranscript('');
      });
      queueMicrotask(() => {
        restoreRestingStatus(translationSupportRef.current.message);
      });
      return;
    }

    const abortController = new AbortController();

    if (!isListeningRef.current && !isSpeakingRef.current) {
      queueMicrotask(() => {
        setStatus('translating');
        setStatusMessage(
          `Translating into ${getLanguageLabel(outputLanguage)}...`,
        );
      });
    }

    void (async () => {
      try {
        const nextTranslation = await translateText(
          deferredOriginalTranscript,
          inputLanguage,
          outputLanguage,
          abortController.signal,
        );

        if (abortController.signal.aborted) {
          return;
        }

        if (translationRequestIdRef.current !== requestId) {
          return;
        }

        startTransition(() => {
          setTranslatedTranscript(nextTranslation);
        });

        if (!isListeningRef.current && !isSpeakingRef.current) {
          setStatus('idle');
          setStatusMessage(
            `Translation ready in ${getLanguageLabel(outputLanguage)}.`,
          );
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        startTransition(() => {
          setTranslatedTranscript('');
        });

        if (!isListeningRef.current) {
          setStatus('idle');
          setStatusMessage(getTranslationErrorMessage(error));
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [
    deferredOriginalTranscript,
    inputLanguage,
    outputLanguage,
    restoreRestingStatus,
  ]);

  const handleInputLanguageChange = (nextLanguage: string) => {
    setInputLanguage(nextLanguage as LanguageValue);
    primeTranslationPair(nextLanguage, outputLanguage);
  };

  const handleOutputLanguageChange = (nextLanguage: string) => {
    setOutputLanguage(nextLanguage as LanguageValue);
    primeTranslationPair(inputLanguage, nextLanguage);
  };

  const handleSwapLanguages = () => {
    const nextInputLanguage = outputLanguage;
    const nextOutputLanguage = inputLanguage;

    setInputLanguage(nextInputLanguage);
    setOutputLanguage(nextOutputLanguage);
    primeTranslationPair(nextInputLanguage, nextOutputLanguage);
  };

  const handleStartListening = () => {
    if (!speechSupportRef.current) {
      setStatus('error');
      setStatusMessage(SPEECH_RECOGNITION_UNSUPPORTED_MESSAGE);
      return;
    }

    teardownSpeech();
    teardownRecognition();

    const recognition = createSpeechRecognition(inputLanguage);

    if (!recognition) {
      setStatus('error');
      setStatusMessage(SPEECH_RECOGNITION_UNSUPPORTED_MESSAGE);
      return;
    }

    recognitionRef.current = recognition;
    primeTranslationPair(inputLanguage, outputLanguage);

    recognition.onstart = () => {
      listeningStartedAtRef.current = Date.now();
      receivedRecognitionResultRef.current = false;
      stopRequestedRef.current = false;
      setListeningState(true);
      setStatus('listening');
      setStatusMessage(
        translationSupportRef.current.supported ||
          inputLanguage === outputLanguage
          ? `Listening in ${getLanguageLabel(inputLanguage)}. Transcript updates live.`
          : `Listening in ${getLanguageLabel(inputLanguage)}. Native translation is unavailable for ${getLanguageLabel(outputLanguage)}.`,
      );
    };

    recognition.onresult = (event) => {
      const nextTranscript = getTranscriptFromRecognitionEvent(event);

      if (nextTranscript) {
        receivedRecognitionResultRef.current = true;
      }

      startTransition(() => {
        setOriginalTranscript(nextTranscript);

        if (inputLanguage === outputLanguage) {
          setTranslatedTranscript(nextTranscript);
        }
      });

      setStatus('listening');
      setStatusMessage(
        translationSupportRef.current.supported ||
          inputLanguage === outputLanguage
          ? `Listening in ${getLanguageLabel(inputLanguage)}. Live transcript captured.`
          : `Listening in ${getLanguageLabel(inputLanguage)}. Translation is unavailable for this browser or language pair.`,
      );
    };

    recognition.onerror = (event) => {
      recognitionRef.current = null;
      listeningStartedAtRef.current = null;
      receivedRecognitionResultRef.current = false;
      stopRequestedRef.current = false;
      setListeningState(false);
      setStatus('error');
      setStatusMessage(
        getSpeechRecognitionErrorMessage(
          event.error,
          getLanguageLabel(inputLanguageRef.current),
        ),
      );
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      const listeningDuration = listeningStartedAtRef.current
        ? Date.now() - listeningStartedAtRef.current
        : 0;
      const shouldSurfaceLanguageError =
        !receivedRecognitionResultRef.current &&
        !originalTranscriptRef.current.trim() &&
        (!stopRequestedRef.current || listeningDuration >= 3000);

      listeningStartedAtRef.current = null;
      receivedRecognitionResultRef.current = false;
      stopRequestedRef.current = false;
      setListeningState(false);

      if (shouldSurfaceLanguageError) {
        setStatus('error');
        setStatusMessage(
          getSpeechRecognitionNoTranscriptMessage(
            getLanguageLabel(inputLanguageRef.current),
          ),
        );
        return;
      }

      if (!originalTranscriptRef.current.trim()) {
        restoreRestingStatus('Listening stopped. No transcript was captured.');
        return;
      }

      if (inputLanguage === outputLanguage) {
        restoreRestingStatus(
          'Listening stopped. The translated panel matches the original transcript.',
        );
        return;
      }

      if (translationSupportRef.current.supported) {
        setStatus('translating');
        setStatusMessage(
          `Finishing translation into ${getLanguageLabel(outputLanguage)}...`,
        );
        return;
      }

      restoreRestingStatus(translationSupportRef.current.message);
    };

    try {
      recognition.start();
    } catch (error) {
      recognitionRef.current = null;
      setStatus('error');
      setStatusMessage(
        getSpeechRecognitionErrorMessage(
          error instanceof Error ? error.name.toLowerCase() : 'unknown',
        ),
      );
    }
  };

  const handleStopListening = () => {
    stopRequestedRef.current = true;
    recognitionRef.current?.stop();
  };

  const handleSpeakTranslation = () => {
    const speechText = translatedTranscript.trim();

    if (!speechText) {
      return;
    }

    if (!isSupportedSpeechSynthesis) {
      setStatus('error');
      setStatusMessage(SYNTHESIS_UNSUPPORTED_MESSAGE);
      return;
    }

    teardownSpeech();

    const speechRequest = createSpeechUtterance(
      speechText,
      outputLanguage,
    );
    const outputLanguageLabel = getLanguageLabel(outputLanguage);

    if (!speechRequest) {
      setStatus('error');
      setStatusMessage(SYNTHESIS_UNSUPPORTED_MESSAGE);
      return;
    }

    utteranceRef.current = speechRequest.utterance;
    setStatus('speaking');
    setStatusMessage(
      speechRequest.matchedVoice
        ? `Starting ${outputLanguageLabel} playback...`
        : `Trying to start ${outputLanguageLabel} playback. No exact browser voice was found for this language.`,
    );

    speechRequest.utterance.onstart = () => {
      if (speechStartTimeoutRef.current !== null) {
        window.clearTimeout(speechStartTimeoutRef.current);
        speechStartTimeoutRef.current = null;
      }

      speechPlaybackStartedAtRef.current = Date.now();
      setSpeakingState(true);
      setStatus('speaking');
      setStatusMessage(
        speechRequest.matchedVoice
          ? `Starting ${outputLanguageLabel} audio...`
          : `Trying ${outputLanguageLabel} audio with the browser default voice.`,
      );

      speechConfirmedTimeoutRef.current = window.setTimeout(() => {
        if (utteranceRef.current !== speechRequest.utterance || !isSpeakingRef.current) {
          return;
        }

        setStatus('speaking');
        setStatusMessage(
          speechRequest.matchedVoice
            ? `Speaking ${outputLanguageLabel} translation.`
            : `Speaking ${outputLanguageLabel} translation with the browser default voice.`,
        );
        speechConfirmedTimeoutRef.current = null;
      }, SPEECH_MIN_CONFIRMATION_MS);
    };

    speechRequest.utterance.onend = () => {
      if (speechConfirmedTimeoutRef.current !== null) {
        window.clearTimeout(speechConfirmedTimeoutRef.current);
        speechConfirmedTimeoutRef.current = null;
      }

      if (speechStartTimeoutRef.current !== null) {
        window.clearTimeout(speechStartTimeoutRef.current);
        speechStartTimeoutRef.current = null;
      }

      const playbackStartedAt = speechPlaybackStartedAtRef.current;
      const playbackDuration = playbackStartedAt
        ? Date.now() - playbackStartedAt
        : 0;
      const minimumDuration = getMinimumExpectedSpeechDuration(speechText);
      const likelySilentPlayback =
        playbackStartedAt !== null && playbackDuration < minimumDuration;

      speechPlaybackStartedAtRef.current = null;
      utteranceRef.current = null;
      setSpeakingState(false);

      if (likelySilentPlayback) {
        setStatus('error');
        setStatusMessage(
          getSpeechSynthesisLanguageErrorMessage(
            getLanguageLabel(outputLanguageRef.current),
            speechRequest.matchedVoice,
            'ended-early',
          ),
        );
        return;
      }

      restoreRestingStatus('Playback finished.');
    };

    speechRequest.utterance.onerror = () => {
      if (speechConfirmedTimeoutRef.current !== null) {
        window.clearTimeout(speechConfirmedTimeoutRef.current);
        speechConfirmedTimeoutRef.current = null;
      }

      if (speechStartTimeoutRef.current !== null) {
        window.clearTimeout(speechStartTimeoutRef.current);
        speechStartTimeoutRef.current = null;
      }

      speechPlaybackStartedAtRef.current = null;
      utteranceRef.current = null;
      setSpeakingState(false);
      setStatus('error');
      setStatusMessage(
        getSpeechSynthesisLanguageErrorMessage(
          getLanguageLabel(outputLanguageRef.current),
          speechRequest.matchedVoice,
          'start',
        ),
      );
    };

    startSpeech(speechRequest.utterance);

    speechStartTimeoutRef.current = window.setTimeout(() => {
      if (utteranceRef.current !== speechRequest.utterance || isSpeakingRef.current) {
        return;
      }

      utteranceRef.current = null;
      setSpeakingState(false);
      cancelSpeech();
      setStatus('error');
      setStatusMessage(
        getSpeechSynthesisLanguageErrorMessage(
          getLanguageLabel(outputLanguageRef.current),
          speechRequest.matchedVoice,
          'start',
        ),
      );
      speechStartTimeoutRef.current = null;
    }, SPEECH_START_TIMEOUT_MS);
  };

  const handleClearSession = () => {
    teardownRecognition();
    teardownSpeech();
    listeningStartedAtRef.current = null;
    receivedRecognitionResultRef.current = false;
    stopRequestedRef.current = false;
    setListeningState(false);
    translationRequestIdRef.current += 1;

    startTransition(() => {
      setOriginalTranscript('');
      setTranslatedTranscript('');
    });

    setStatus(speechSupportRef.current ? 'idle' : 'error');
    setStatusMessage(
      speechSupportRef.current ? CLEARED_MESSAGE : SPEECH_RECOGNITION_UNSUPPORTED_MESSAGE,
    );
  };

  return {
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
  };
}
