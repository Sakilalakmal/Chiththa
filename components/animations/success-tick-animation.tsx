import React, { useEffect, useMemo } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, layout, motion, typography } from '@/theme';

const INITIAL_TICK_SCALE = 0.85;
const FULL_TICK_SCALE = 1;
const HIDDEN_TICK_OPACITY = 0;
const VISIBLE_TICK_OPACITY = 1;
const TICK_LINE_HEIGHT_MULTIPLIER = 1.15;

type SuccessTickAnimationProps = {
  visible: boolean;
  size?: number;
  style?: StyleProp<TextStyle>;
};

export function SuccessTickAnimation({
  visible,
  size = layout.successTickSize,
  style,
}: SuccessTickAnimationProps) {
  const opacity = useSharedValue(HIDDEN_TICK_OPACITY);
  const scale = useSharedValue(INITIAL_TICK_SCALE);

  useEffect(() => {
    if (visible) {
      scale.value = INITIAL_TICK_SCALE;
      opacity.value = HIDDEN_TICK_OPACITY;
      scale.value = withTiming(FULL_TICK_SCALE, { duration: motion.durationNormal });
      opacity.value = withTiming(VISIBLE_TICK_OPACITY, { duration: motion.durationNormal });
      return;
    }

    scale.value = withTiming(INITIAL_TICK_SCALE, { duration: motion.durationFast });
    opacity.value = withTiming(HIDDEN_TICK_OPACITY, { duration: motion.durationFast });
  }, [opacity, scale, visible]);

  const tickStyle = useMemo(
    () => ({
      fontSize: size,
      lineHeight: Math.round(size * TICK_LINE_HEIGHT_MULTIPLIER),
    }),
    [size],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.tick, tickStyle, animatedStyle, style]} accessibilityElementsHidden>
      ✓
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  tick: {
    color: colors.success,
    fontFamily: typography.families.semibold,
  },
});
