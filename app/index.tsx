import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from '../hooks/useAppData';
import { colors } from '../constants/theme';

export default function Index() {
  const { ready, profile } = useApp();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.lime} size="large" />
      </View>
    );
  }
  return <Redirect href={profile ? '/(tabs)/dashboard' : '/onboarding'} />;
}
