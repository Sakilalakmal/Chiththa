import { StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { spacing } from '@/theme';

export default function NotesScreen() {
  return (
    <Screen>
      <View style={styles.content}>
        <AppText variant="title">Notes</AppText>
        <AppText variant="caption">
          Minimal note capture surfaces will be introduced here in the next phase.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
});
