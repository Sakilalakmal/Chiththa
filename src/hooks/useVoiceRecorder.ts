import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { EventSubscription } from 'expo-modules-core';
import type { ExpoSpeechRecognitionErrorEvent, ExpoSpeechRecognitionResultEvent } from 'expo-speech-recognition';

import {
  addSpeechCaptureListener,
  abortSpeechCapture,
  getSpeechCaptureAvailability,
  requestSpeechCapturePermissions,
  startFallbackAudioCapture,
  startSpeechCapture,
  stopFallbackAudioCapture,
  stopSpeechCapture,
  type VoiceCaptureMode,
} from '@/src/services/voice/voice-recorder.service';

const DEFAULT_STOP_TIMEOUT_MS = 5000;
const TIMER_TICK_MS = 150;

export type VoiceCaptureResult = {
  audioUri: string | null;
  transcriptText: string | null;
  durationMs: number | null;
  mode: VoiceCaptureMode;
};

type StopWaitContext = {
  resolver: (() => void) | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
};

function cleanTranscript(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function appendSegment(base: string, nextSegment: string): string {
  const normalizedBase = cleanTranscript(base);
  const normalizedNext = cleanTranscript(nextSegment);

  if (!normalizedNext) {
    return normalizedBase;
  }

  if (!normalizedBase) {
    return normalizedNext;
  }

  return `${normalizedBase} ${normalizedNext}`;
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [transcriptText, setTranscriptText] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [supportsLiveTranscription, setSupportsLiveTranscription] = useState(true);

  const modeRef = useRef<VoiceCaptureMode | null>(null);
  const fallbackRecordingRef = useRef<Awaited<ReturnType<typeof startFallbackAudioCapture>> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const transcriptFinalRef = useRef('');
  const transcriptInterimRef = useRef('');
  const audioUriRef = useRef<string | null>(null);
  const durationRef = useRef<number | null>(null);
  const subscriptionsRef = useRef<EventSubscription[]>([]);
  const stopWaitRef = useRef<StopWaitContext>({ resolver: null, timeoutId: null });

  const clearStopWait = useCallback(() => {
    const { timeoutId } = stopWaitRef.current;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    stopWaitRef.current.timeoutId = null;
    stopWaitRef.current.resolver = null;
  }, []);

  const resolveStopWait = useCallback(() => {
    const resolver = stopWaitRef.current.resolver;
    clearStopWait();
    resolver?.();
  }, [clearStopWait]);

  const startTimer = useCallback(() => {
    startedAtRef.current = Date.now();
    setElapsedMs(0);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      if (!startedAtRef.current) {
        return;
      }

      setElapsedMs(Date.now() - startedAtRef.current);
    }, TIMER_TICK_MS);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (startedAtRef.current) {
      setElapsedMs(Date.now() - startedAtRef.current);
    }

    startedAtRef.current = null;
  }, []);

  const removeSpeechListeners = useCallback(() => {
    subscriptionsRef.current.forEach((subscription) => {
      subscription.remove();
    });
    subscriptionsRef.current = [];
  }, []);

  const syncTranscript = useCallback(() => {
    const composed = appendSegment(transcriptFinalRef.current, transcriptInterimRef.current);
    setTranscriptText(composed);
  }, []);

  const onSpeechResult = useCallback(
    (event: ExpoSpeechRecognitionResultEvent) => {
      const nextText = cleanTranscript(event.results[0]?.transcript ?? '');
      if (!nextText) {
        return;
      }

      if (event.isFinal) {
        transcriptFinalRef.current = appendSegment(transcriptFinalRef.current, nextText);
        transcriptInterimRef.current = '';
      } else {
        transcriptInterimRef.current = nextText;
      }

      syncTranscript();
    },
    [syncTranscript],
  );

  const onSpeechError = useCallback((event: ExpoSpeechRecognitionErrorEvent) => {
    if (event.error === 'no-speech') {
      return;
    }

    setErrorMessage(event.message || 'Speech recognition failed. You can still edit text manually.');
  }, []);

  const onSpeechAudioEnd = useCallback((event: { uri: string | null }) => {
    audioUriRef.current = event.uri;
    setAudioUri(event.uri);
  }, []);

  const onSpeechEnd = useCallback(() => {
    setIsRecording(false);
    setIsProcessing(false);
    stopTimer();
    resolveStopWait();
  }, [resolveStopWait, stopTimer]);

  const registerSpeechListeners = useCallback(() => {
    removeSpeechListeners();

    const listeners = [
      addSpeechCaptureListener('result', onSpeechResult),
      addSpeechCaptureListener('error', onSpeechError),
      addSpeechCaptureListener('audioend', onSpeechAudioEnd),
      addSpeechCaptureListener('volumechange', (event) => {
        setVolumeLevel(event.value);
      }),
      addSpeechCaptureListener('end', onSpeechEnd),
    ].filter((subscription): subscription is EventSubscription => subscription != null);

    subscriptionsRef.current.push(...listeners);
  }, [onSpeechAudioEnd, onSpeechEnd, onSpeechError, onSpeechResult, removeSpeechListeners]);

  const resetDraft = useCallback(() => {
    if (modeRef.current === 'speech') {
      abortSpeechCapture();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    startedAtRef.current = null;
    modeRef.current = null;
    fallbackRecordingRef.current = null;
    transcriptFinalRef.current = '';
    transcriptInterimRef.current = '';
    audioUriRef.current = null;
    durationRef.current = null;

    clearStopWait();
    removeSpeechListeners();

    setIsRecording(false);
    setIsProcessing(false);
    setElapsedMs(0);
    setVolumeLevel(0);
    setTranscriptText('');
    setAudioUri(null);
    setDurationMs(null);
    setErrorMessage(null);
  }, [clearStopWait, removeSpeechListeners]);

  const startSpeechMode = useCallback(async () => {
    registerSpeechListeners();
    startSpeechCapture();
    modeRef.current = 'speech';
    setSupportsLiveTranscription(true);
    setIsRecording(true);
    startTimer();
  }, [registerSpeechListeners, startTimer]);

  const startFallbackMode = useCallback(async () => {
    removeSpeechListeners();
    const recording = await startFallbackAudioCapture();

    fallbackRecordingRef.current = recording;
    modeRef.current = 'audio-only';
    setSupportsLiveTranscription(false);
    setIsRecording(true);
    startTimer();
  }, [removeSpeechListeners, startTimer]);

  const startRecording = useCallback(async () => {
    if (isRecording || isProcessing) {
      return;
    }

    resetDraft();

    const availability = getSpeechCaptureAvailability();

    try {
      if (availability.recognitionAvailable && availability.recordingAvailable) {
        const permissionGranted = await requestSpeechCapturePermissions();
        if (permissionGranted) {
          await startSpeechMode();
          return;
        }
      }

      await startFallbackMode();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start recording.';
      resetDraft();
      setErrorMessage(message);
    }
  }, [isProcessing, isRecording, resetDraft, startFallbackMode, startSpeechMode]);

  const waitForSpeechStop = useCallback(() => {
    return new Promise<void>((resolve) => {
      clearStopWait();

      stopWaitRef.current.resolver = resolve;
      stopWaitRef.current.timeoutId = setTimeout(() => {
        resolveStopWait();
      }, DEFAULT_STOP_TIMEOUT_MS);
    });
  }, [clearStopWait, resolveStopWait]);

  const stopRecording = useCallback(async (): Promise<VoiceCaptureResult | null> => {
    if (!isRecording || !modeRef.current) {
      return null;
    }

    setErrorMessage(null);
    setVolumeLevel(0);
    setIsProcessing(true);

    if (modeRef.current === 'speech') {
      const stopWaitPromise = waitForSpeechStop();
      stopSpeechCapture();
      await stopWaitPromise;

      stopTimer();
      removeSpeechListeners();
      modeRef.current = null;
      setIsRecording(false);

      const finalTranscript = cleanTranscript(
        appendSegment(transcriptFinalRef.current, transcriptInterimRef.current),
      );

      if (!durationRef.current && elapsedMs > 0) {
        durationRef.current = elapsedMs;
      }

      setDurationMs(durationRef.current ?? elapsedMs);
      setTranscriptText(finalTranscript);

      setIsProcessing(false);

      return {
        audioUri: audioUriRef.current,
        transcriptText: finalTranscript.length > 0 ? finalTranscript : null,
        durationMs: durationRef.current ?? elapsedMs,
        mode: 'speech',
      };
    }

    const recording = fallbackRecordingRef.current;

    if (!recording) {
      setIsProcessing(false);
      setIsRecording(false);
      modeRef.current = null;
      return {
        audioUri: null,
        transcriptText: null,
        durationMs: elapsedMs,
        mode: 'audio-only',
      };
    }

    const fallbackResult = await stopFallbackAudioCapture(recording);
    fallbackRecordingRef.current = null;
    modeRef.current = null;

    stopTimer();

    audioUriRef.current = fallbackResult.audioUri;
    durationRef.current = fallbackResult.durationMs;

    setAudioUri(fallbackResult.audioUri);
    setDurationMs(fallbackResult.durationMs);
    setIsRecording(false);
    setIsProcessing(false);

    return {
      audioUri: fallbackResult.audioUri,
      transcriptText: null,
      durationMs: fallbackResult.durationMs,
      mode: 'audio-only',
    };
  }, [elapsedMs, isRecording, removeSpeechListeners, stopTimer, waitForSpeechStop]);

  useEffect(() => {
    return () => {
      if (modeRef.current === 'speech') {
        abortSpeechCapture();
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      clearStopWait();
      removeSpeechListeners();
    };
  }, [clearStopWait, removeSpeechListeners]);

  const hasDraft = useMemo(() => {
    return (
      isRecording ||
      isProcessing ||
      transcriptText.trim().length > 0 ||
      audioUri != null ||
      elapsedMs > 0
    );
  }, [audioUri, elapsedMs, isProcessing, isRecording, transcriptText]);

  return {
    isRecording,
    isProcessing,
    elapsedMs,
    volumeLevel,
    transcriptText,
    audioUri,
    durationMs,
    errorMessage,
    supportsLiveTranscription,
    hasDraft,
    startRecording,
    stopRecording,
    resetDraft,
    setTranscriptText,
  };
}
