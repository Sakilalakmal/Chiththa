import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { colors, motion, radius, spacing } from '@/theme';

type RecordingPulseProps = {
  active: boolean;
  volumeLevel: number;
};

const MIN_VOLUME = -2;
const MAX_VOLUME = 10;

function normalizeVolume(value: number): number {
  const clamped = Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, value));
  return (clamped - MIN_VOLUME) / (MAX_VOLUME - MIN_VOLUME);
}

function WaveBar({
  active,
  level,
  multiplier,
  delay,
}: {
  active: boolean;
  level: SharedValue<number>;
  multiplier: number;
  delay: number;
}) {
  const oscillation = useSharedValue(0.35);

  useEffect(() => {
    if (active) {
      oscillation.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 260 + delay,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.35, {
            duration: 260 + delay,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      );
      return;
    }

    oscillation.value = withTiming(0.2, { duration: motion.durationNormal });
  }, [active, delay, oscillation]);

  const barStyle = useAnimatedStyle(() => {
    const baseHeight = 5;
    const animatedHeight = baseHeight + (6 + level.value * 14 * multiplier) * oscillation.value;

    return {
      height: animatedHeight,
      opacity: active ? 1 : 0.6,
    };
  });

  return <Animated.View style={[styles.waveBar, barStyle]} />;
}

export function RecordingPulse({ active, volumeLevel }: RecordingPulseProps) {
  const pulseProgress = useSharedValue(0);
  const level = useSharedValue(0);

  useEffect(() => {
    if (active) {
      pulseProgress.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 900,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(0, {
            duration: 900,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        -1,
        true,
      );
      return;
    }

    pulseProgress.value = withTiming(0, { duration: motion.durationNormal });
  }, [active, pulseProgress]);

  useEffect(() => {
    level.value = withTiming(normalizeVolume(volumeLevel), {
      duration: 120,
      easing: Easing.out(Easing.cubic),
    });
  }, [level, volumeLevel]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: active ? 0.16 + (1 - pulseProgress.value) * 0.28 : 0,
    transform: [{ scale: 1 + pulseProgress.value * 0.38 }],
  }));

  const micStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulseProgress.value * 0.06 }],
  }));

  return (
    <View style={styles.root}>
      <View style={styles.micContainer}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.micCore, active && styles.micCoreActive, micStyle]}>
          <Ionicons
            name={active ? 'mic' : 'mic-outline'}
            size={20}
            color={active ? colors.accent : colors.textSecondary}
          />
        </Animated.View>
      </View>

      <View style={styles.waveRow}>
        <WaveBar active={active} level={level} multiplier={0.7} delay={0} />
        <WaveBar active={active} level={level} multiplier={1} delay={40} />
        <WaveBar active={active} level={level} multiplier={1.2} delay={80} />
        <WaveBar active={active} level={level} multiplier={1} delay={120} />
        <WaveBar active={active} level={level} multiplier={0.7} delay={160} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  micContainer: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  micCore: {
    width: 62,
    height: 62,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micCoreActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  waveRow: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  waveBar: {
    width: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
});
