import { Audio } from 'expo-av';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { requireOptionalNativeModule, type EventSubscription } from 'expo-modules-core';
import type { ExpoSpeechRecognitionNativeEventMap } from 'expo-speech-recognition';

const VOICE_RECORDINGS_DIRECTORY = 'voice-recordings';
type SpeechRecognitionModuleType = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

let cachedSpeechModule: SpeechRecognitionModuleType | null | undefined;

export type VoiceCaptureMode = 'speech' | 'audio-only';

export type FallbackAudioCaptureResult = {
  audioUri: string;
  durationMs: number | null;
};

function getSpeechModule(): SpeechRecognitionModuleType | null {
  if (cachedSpeechModule !== undefined) {
    return cachedSpeechModule;
  }

  cachedSpeechModule = requireOptionalNativeModule<SpeechRecognitionModuleType>(
    'ExpoSpeechRecognition',
  );
  return cachedSpeechModule;
}

function getVoiceDirectory(): Directory {
  const directory = new Directory(Paths.document, VOICE_RECORDINGS_DIRECTORY);

  if (!directory.exists) {
    directory.create({ idempotent: true, intermediates: true });
  }

  return directory;
}

function getFileExtension(uri: string, fallback: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(uri);
  return match?.[1] ?? fallback;
}

export function buildVoiceFileName(extension: string): string {
  return `chiththa-${Date.now()}.${extension}`;
}

export function getSpeechCaptureAvailability(): {
  recognitionAvailable: boolean;
  recordingAvailable: boolean;
} {
  const speechModule = getSpeechModule();
  if (!speechModule) {
    return {
      recognitionAvailable: false,
      recordingAvailable: false,
    };
  }

  return {
    recognitionAvailable: speechModule.isRecognitionAvailable(),
    recordingAvailable: speechModule.supportsRecording(),
  };
}

export async function requestSpeechCapturePermissions(): Promise<boolean> {
  const speechModule = getSpeechModule();
  if (!speechModule) {
    return false;
  }

  const result = await speechModule.requestPermissionsAsync();
  return result.granted;
}

export function startSpeechCapture(): void {
  const speechModule = getSpeechModule();
  if (!speechModule) {
    return;
  }

  const outputDirectory = getVoiceDirectory().uri;

  speechModule.start({
    lang: 'en-US',
    interimResults: true,
    continuous: true,
    maxAlternatives: 1,
    addsPunctuation: true,
    requiresOnDeviceRecognition: Platform.OS === 'ios',
    volumeChangeEventOptions: {
      enabled: true,
      intervalMillis: 140,
    },
    recordingOptions: {
      persist: true,
      outputDirectory,
      outputFileName: buildVoiceFileName('wav'),
    },
  });
}

export function stopSpeechCapture(): void {
  const speechModule = getSpeechModule();
  speechModule?.stop();
}

export function abortSpeechCapture(): void {
  const speechModule = getSpeechModule();
  speechModule?.abort();
}

export function addSpeechCaptureListener<K extends keyof ExpoSpeechRecognitionNativeEventMap>(
  eventName: K,
  listener: (event: ExpoSpeechRecognitionNativeEventMap[K]) => void,
): EventSubscription | null {
  const speechModule = getSpeechModule();
  if (!speechModule) {
    return null;
  }

  return speechModule.addListener(eventName as never, listener as never);
}

export async function startFallbackAudioCapture(): Promise<Audio.Recording> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });

  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Microphone permission was not granted.');
  }

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();

  return recording;
}

function persistFallbackUri(uri: string): string {
  const extension = getFileExtension(uri, 'm4a');
  const source = new File(uri);
  const destination = new File(getVoiceDirectory(), buildVoiceFileName(extension));

  source.copy(destination);
  return destination.uri;
}

export async function stopFallbackAudioCapture(
  recording: Audio.Recording,
): Promise<FallbackAudioCaptureResult> {
  const status = await recording.stopAndUnloadAsync();
  const sourceUri = recording.getURI();

  if (!sourceUri) {
    throw new Error('Audio recording finished without a file URI.');
  }

  const audioUri = persistFallbackUri(sourceUri);

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });

  return {
    audioUri,
    durationMs: status.durationMillis ?? null,
  };
}
