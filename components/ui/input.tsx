import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { borders, colors, layout, radius, spacing, typography } from '@/theme';

type InputProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function Input({
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  placeholderTextColor = colors.neutral500,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const focusStyle = useMemo(
    () => (isFocused ? styles.containerFocused : styles.containerBlurred),
    [isFocused],
  );

  return (
    <TextInput
      allowFontScaling
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      placeholderTextColor={placeholderTextColor}
      style={[styles.container, focusStyle, containerStyle, styles.input, inputStyle]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: layout.inputMinHeight,
    borderWidth: borders.thin,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  containerBlurred: {
    borderColor: colors.border,
  },
  containerFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  input: {
    fontFamily: typography.families.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
});
