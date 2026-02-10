import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { PressableWrapper } from '@/components/animations';
import { borders, colors, layout, radius, spacing, typography } from '@/theme';

import { AppText } from './app-text';

type ButtonVariant = 'primary' | 'secondary';

const DISABLED_OPACITY = 0.6;

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  haptic?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  haptic = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const handlePress = useCallback(() => {
    if (disabled) {
      return;
    }

    if (haptic) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress?.();
  }, [disabled, haptic, onPress]);

  return (
    <PressableWrapper
      accessibilityRole="button"
      disabled={disabled}
      onPress={handlePress}
      style={[styles.base, variantStyles[variant], disabled && styles.disabled, style]}>
      <AppText variant="body" style={[styles.label, labelVariantStyles[variant], textStyle]}>
        {label}
      </AppText>
    </PressableWrapper>
  );
}

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  secondary: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
});

const labelVariantStyles = StyleSheet.create({
  primary: {
    color: colors.white,
  },
  secondary: {
    color: colors.textPrimary,
  },
});

const styles = StyleSheet.create({
  base: {
    minHeight: layout.buttonMinHeight,
    borderWidth: borders.thin,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  label: {
    fontFamily: typography.families.medium,
    fontSize: typography.sizes.button,
    lineHeight: typography.lineHeights.button,
  },
  disabled: {
    opacity: DISABLED_OPACITY,
  },
});
