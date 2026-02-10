import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion } from '@/theme';

type PressableWrapperProps = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PressableWrapper({
  children,
  style,
  onPressIn,
  onPressOut,
  ...props
}: PressableWrapperProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      onPressIn={(event) => {
        scale.value = withTiming(motion.pressScale, { duration: motion.durationFast });
        opacity.value = withTiming(motion.pressOpacity, { duration: motion.durationFast });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, { duration: motion.durationFast });
        opacity.value = withTiming(1, { duration: motion.durationFast });
        onPressOut?.(event);
      }}
      {...props}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
