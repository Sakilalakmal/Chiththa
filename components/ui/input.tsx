import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
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
    <View style={[styles.container, focusStyle, containerStyle]}>
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
        style={[styles.input, inputStyle]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: layout.inputMinHeight,
    borderWidth: borders.thin,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  containerBlurred: {
    borderColor: colors.border,
  },
  containerFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontFamily: typography.families.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
});
