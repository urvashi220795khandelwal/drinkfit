import { router } from 'expo-router';
import { Button, Card, H1, H2, Muted, Screen } from '../components/ui';

export default function Privacy() {
  return (
    <Screen>
      <H1>Privacy policy</H1>
      <Card>
        <H2>Where is my data stored?</H2>
        <Muted>
          By default, your profile and daily entries are saved only on your phone. Your data syncs to the cloud
          (Supabase) only if you create an account, so you can access it on other devices.
        </Muted>
        <H2>What we don't do</H2>
        <Muted>No ads, no payments, and your data is never sold or shared with anyone.</Muted>
        <H2>Login security</H2>
        <Muted>Your login session is stored in your phone's encrypted SecureStore.</Muted>
        <H2>Deleting your data</H2>
        <Muted>
          From the Profile screen, you can remove all data from your phone. You can also delete your account to
          permanently remove your cloud data.
        </Muted>
        <H2>Health disclaimer</H2>
        <Muted>
          All numbers in DrinkFit are estimates, not medical advice. Alcohol calorie equivalents are not safe drinking
          limits. Talk to a doctor about any health-related decisions.
        </Muted>
      </Card>
      <Button title="Go back" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
