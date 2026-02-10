import { StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { spacing } from '@/theme';

export default function ReadScreen() {
  return (
    <Screen>
      <View style={styles.content}>
        <AppText variant="title">Read</AppText>
        <AppText variant="caption">
          Reading and reflection spaces are reserved here for the next implementation stage.
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
