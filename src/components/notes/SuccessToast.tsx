import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { SuccessTickAnimation } from '@/components/animations';
import { AppText } from '@/components/ui';
import { borders, colors, radius, spacing, typography } from '@/theme';

type SuccessToastProps = {
  visible: boolean;
  message?: string;
};

export function SuccessToast({ visible, message = 'Chiththa created' }: SuccessToastProps) {
  const progress = useSharedValue(0);
  const ripple = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });

      ripple.value = 0;
      ripple.value = withSequence(
        withTiming(1, {
          duration: 420,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(0, {
          duration: 200,
          easing: Easing.in(Easing.cubic),
        }),
      );
      return;
    }

    progress.value = withTiming(0, {
      duration: 180,
      easing: Easing.in(Easing.cubic),
    });
  }, [progress, ripple, visible]);

  const toastStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -12 }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: ripple.value * 0.22,
    transform: [{ scale: 0.5 + ripple.value * 1.25 }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.container, toastStyle]}>
      <Animated.View style={[styles.ripple, rippleStyle]} />
      <View style={styles.toast}>
        <SuccessTickAnimation visible={visible} size={24} />
        <AppText style={styles.message}>{message}</AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: 50,
  },
  ripple: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  toast: {
    minHeight: 52,
    borderWidth: borders.thin,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  message: {
    fontFamily: typography.families.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
});
