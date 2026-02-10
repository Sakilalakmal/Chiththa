import { StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui';
import { borders, colors, radius, spacing, typography } from '@/theme';

type NotesEmptyStateProps = {
  title: string;
  message: string;
};

export function NotesEmptyState({ title, message }: NotesEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles-outline" size={20} color={colors.textSecondary} />
      </View>
      <AppText style={styles.title}>{title}</AppText>
      <AppText variant="caption" style={styles.message}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: borders.thin,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral100,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: borders.thin,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  title: {
    fontFamily: typography.families.medium,
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 320,
  },
});
