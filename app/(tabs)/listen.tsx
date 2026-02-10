import { StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { spacing } from '@/theme';

export default function ListenScreen() {
  return (
    <Screen>
      <View style={styles.content}>
        <AppText variant="title">Listen</AppText>
        <AppText variant="caption">
          Quiet voice-focused workflows will appear here once feature development begins.
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
