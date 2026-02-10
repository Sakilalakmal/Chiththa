import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PressableWrapper } from '@/components/animations';
import { AppText, Button, Divider, Input } from '@/components/ui';
import { useVoiceRecorder } from '@/src/hooks/useVoiceRecorder';
import { borders, colors, layout, motion, radius, spacing, typography } from '@/theme';

import { RecordingPulse } from './RecordingPulse';
import { SuccessToast } from './SuccessToast';
import { deriveTitleFromTranscript, formatDuration } from './utils';

export type CreateTypedInput = {
  title: string;
  content?: string | null;
};

export type CreateVoiceInput = {
  title?: string;
  content?: string | null;
  transcriptText?: string | null;
  audioPath?: string | null;
  durationMs?: number | null;
};

type AddTaskSheetProps = {
  visible: boolean;
  onRequestClose: () => void;
  onCreateTyped: (input: CreateTypedInput) => Promise<void>;
  onCreateVoice: (input: CreateVoiceInput) => Promise<void>;
};

type SheetMode = 'typed' | 'voice';

function normalizeOptionalText(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function AddTaskSheet({ visible, onRequestClose, onCreateTyped, onCreateVoice }: AddTaskSheetProps) {
  const [isMounted, setIsMounted] = useState(visible);
  const [mode, setMode] = useState<SheetMode>('typed');
  const [typedTitle, setTypedTitle] = useState('');
  const [typedContent, setTypedContent] = useState('');
  const [voiceTitle, setVoiceTitle] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useSharedValue(0);

  const voice = useVoiceRecorder();
  const { resetDraft: resetVoiceDraft } = voice;

  const resetFields = useCallback(() => {
    setMode('typed');
    setTypedTitle('');
    setTypedContent('');
    setVoiceTitle('');
    setVoiceTranscript('');
    setValidationError(null);
    setShowSuccess(false);
    setIsSubmitting(false);
    resetVoiceDraft();
  }, [resetVoiceDraft]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      progress.value = withTiming(1, {
        duration: motion.durationNormal + 120,
        easing: Easing.out(Easing.cubic),
      });
      resetFields();
      return;
    }

    progress.value = withTiming(
      0,
      {
        duration: motion.durationNormal + 70,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setIsMounted)(false);
        }
      },
    );
  }, [progress, resetFields, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (!voice.transcriptText) {
      return;
    }

    setVoiceTranscript((existing) => (existing.trim().length === 0 ? voice.transcriptText : existing));

    setVoiceTitle((existing) => {
      if (existing.trim().length > 0) {
        return existing;
      }

      return deriveTitleFromTranscript(voice.transcriptText);
    });
  }, [visible, voice.transcriptText]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.24,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 26 }],
  }));

  const canSubmit = useMemo(() => {
    if (isSubmitting || voice.isProcessing || voice.isRecording) {
      return false;
    }

    if (mode === 'typed') {
      return typedTitle.trim().length > 0;
    }

    return voiceTitle.trim().length > 0 || voiceTranscript.trim().length > 0;
  }, [isSubmitting, mode, typedTitle, voice.isProcessing, voice.isRecording, voiceTitle, voiceTranscript]);

  const promptCloseIfRecording = useCallback(() => {
    if (!voice.isRecording) {
      onRequestClose();
      return;
    }

    Alert.alert('Discard recording?', 'A recording is in progress. Stop and discard this draft?', [
      {
        text: 'Keep Recording',
        style: 'cancel',
      },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          voice.resetDraft();
          onRequestClose();
        },
      },
    ]);
  }, [onRequestClose, voice]);

  const handleToggleMode = useCallback((nextMode: SheetMode) => {
    if (nextMode === mode) {
      return;
    }

    void Haptics.selectionAsync();
    setValidationError(null);
    setMode(nextMode);
  }, [mode]);

  const handleVoiceRecordPress = useCallback(async () => {
    setValidationError(null);

    if (voice.isRecording) {
      await voice.stopRecording();
      return;
    }

    setMode('voice');
    await voice.startRecording();
    void Haptics.selectionAsync();
  }, [voice]);

  const handleCreate = useCallback(async () => {
    if (!canSubmit) {
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'typed') {
        await onCreateTyped({
          title: typedTitle.trim(),
          content: normalizeOptionalText(typedContent),
        });
      } else {
        const transcript = normalizeOptionalText(voiceTranscript);
        const resolvedTitle = normalizeOptionalText(voiceTitle) ?? deriveTitleFromTranscript(transcript ?? '');

        if (!resolvedTitle) {
          setValidationError('Add a title or transcript before creating.');
          return;
        }

        await onCreateVoice({
          title: resolvedTitle,
          content: transcript,
          transcriptText: transcript,
          audioPath: voice.audioUri,
          durationMs: voice.durationMs ?? voice.elapsedMs,
        });
      }

      setShowSuccess(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }

      successTimerRef.current = setTimeout(() => {
        setShowSuccess(false);
        onRequestClose();
      }, 760);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create Chiththa right now.';
      setValidationError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canSubmit,
    mode,
    onCreateTyped,
    onCreateVoice,
    onRequestClose,
    typedContent,
    typedTitle,
    voice.audioUri,
    voice.durationMs,
    voice.elapsedMs,
    voiceTranscript,
    voiceTitle,
  ]);

  if (!isMounted) {
    return null;
  }

  return (
    <Modal animationType="none" transparent visible={isMounted} onRequestClose={promptCloseIfRecording}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={promptCloseIfRecording} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 14 : 0}
          style={styles.keyboardAvoidingRoot}>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <SuccessToast visible={showSuccess} message="Chiththa created" />

            <View style={styles.headerRow}>
              <AppText style={styles.sheetTitle}>New Chiththa</AppText>
              <PressableWrapper
                onPress={promptCloseIfRecording}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close create sheet">
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </PressableWrapper>
            </View>

            <View style={styles.modeTabs}>
              <PressableWrapper
                onPress={() => handleToggleMode('typed')}
                style={[styles.modeTab, mode === 'typed' && styles.modeTabActive]}>
                <AppText style={[styles.modeLabel, mode === 'typed' && styles.modeLabelActive]}>Typed</AppText>
              </PressableWrapper>

              <PressableWrapper
                onPress={() => handleToggleMode('voice')}
                style={[styles.modeTab, mode === 'voice' && styles.modeTabActive]}>
                <AppText style={[styles.modeLabel, mode === 'voice' && styles.modeLabelActive]}>Voice</AppText>
              </PressableWrapper>
            </View>

            <Divider />

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {mode === 'typed' ? (
                <View style={styles.formGroup}>
                  <Input
                    placeholder="Title"
                    value={typedTitle}
                    onChangeText={setTypedTitle}
                    returnKeyType="next"
                  />

                  <Input
                    placeholder="Optional note"
                    value={typedContent}
                    onChangeText={setTypedContent}
                    multiline
                    textAlignVertical="top"
                    numberOfLines={5}
                    containerStyle={styles.multilineContainer}
                    inputStyle={styles.multilineInput}
                  />
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <View style={styles.voiceStatusCard}>
                    <RecordingPulse active={voice.isRecording} volumeLevel={voice.volumeLevel} />

                    <AppText style={styles.timerLabel}>{formatDuration(voice.elapsedMs)}</AppText>
                    <AppText variant="caption" style={styles.recordingLabel}>
                      {voice.isRecording
                        ? 'Recording...'
                        : voice.isProcessing
                          ? 'Finalizing transcript...'
                          : 'Tap to record your thought'}
                    </AppText>

                    <Button
                      label={voice.isRecording ? 'Stop Recording' : 'Start Recording'}
                      onPress={() => {
                        void handleVoiceRecordPress();
                      }}
                      variant={voice.isRecording ? 'primary' : 'secondary'}
                      haptic
                      style={[styles.recordButton, voice.isRecording && styles.recordButtonActive]}
                    />
                  </View>

                  <Input
                    placeholder="Title"
                    value={voiceTitle}
                    onChangeText={setVoiceTitle}
                    returnKeyType="next"
                  />

                  <Input
                    placeholder={
                      voice.supportsLiveTranscription
                        ? 'Transcript (editable)'
                        : 'Speech transcription unavailable. You can type manually.'
                    }
                    value={voiceTranscript}
                    onChangeText={setVoiceTranscript}
                    multiline
                    textAlignVertical="top"
                    numberOfLines={6}
                    containerStyle={styles.multilineContainer}
                    inputStyle={styles.multilineInput}
                  />

                  {voice.audioUri ? (
                    <View style={styles.audioSavedRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <AppText variant="caption">Audio saved locally</AppText>
                    </View>
                  ) : null}
                </View>
              )}

              {voice.errorMessage || validationError ? (
                <AppText variant="caption" style={styles.errorText}>
                  {validationError ?? voice.errorMessage}
                </AppText>
              ) : null}
            </ScrollView>

            <Button
              label={isSubmitting ? 'Creating...' : 'Create Chiththa'}
              onPress={() => {
                void handleCreate();
              }}
              disabled={!canSubmit}
              haptic
              style={styles.createButton}
            />
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black,
  },
  keyboardAvoidingRoot: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg + 6,
    borderTopRightRadius: radius.lg + 6,
    borderWidth: borders.thin,
    borderColor: colors.border,
    borderBottomWidth: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    maxHeight: '92%',
    minHeight: '56%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontFamily: typography.families.semibold,
    fontSize: 24,
    lineHeight: 32,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeTab: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: borders.thin,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  modeTabActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  modeLabel: {
    fontFamily: typography.families.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  modeLabelActive: {
    color: colors.accent,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  formGroup: {
    gap: spacing.md,
  },
  multilineContainer: {
    minHeight: 148,
  },
  multilineInput: {
    minHeight: 132,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  voiceStatusCard: {
    borderRadius: radius.lg,
    borderWidth: borders.thin,
    borderColor: colors.divider,
    backgroundColor: colors.neutral100,
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  timerLabel: {
    fontFamily: typography.families.semibold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: 0.2,
  },
  recordingLabel: {
    textAlign: 'center',
  },
  recordButton: {
    width: '100%',
    marginTop: spacing.xs,
  },
  recordButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  audioSavedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  errorText: {
    color: '#9F4A4A',
    lineHeight: 20,
  },
  createButton: {
    minHeight: layout.buttonMinHeight,
  },
});
