import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, textVariants, type TextVariant, typography } from '@/theme';

type AppTextProps = TextProps & {
  variant?: TextVariant;
};

export function AppText({
  variant = 'body',
  allowFontScaling = true,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      allowFontScaling={allowFontScaling}
      style={[styles.base, textVariants[variant], style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.textPrimary,
    fontFamily: typography.families.regular,
  },
});
