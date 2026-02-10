import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { spacing } from '@/theme';

export default function ModalScreen() {
  return (
    <Screen style={styles.container}>
      <AppText variant="title">Modal</AppText>
      <Link href="/" dismissTo style={styles.link}>
        <AppText variant="caption">Back to the main tabs</AppText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  link: {
    paddingVertical: spacing.xs,
  },
});
