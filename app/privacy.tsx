import { router } from 'expo-router';
import { Button, Card, H1, H2, Muted, Screen } from '../components/ui';

export default function Privacy() {
  return (
    <Screen>
      <H1>Privacy policy</H1>
      <Card>
        <H2>Data kahan rehta hai?</H2>
        <Muted>
          Tumhari profile aur daily entries by default sirf tumhare phone par save hoti hain. Account banane par hi data
          cloud (Supabase) par sync hota hai, taaki dusre device par bhi mil sake.
        </Muted>
        <H2>Hum kya nahi karte</H2>
        <Muted>Koi ads nahi, koi payment nahi, aur tumhara data kisi ko becha ya share nahi kiya jata.</Muted>
        <H2>Login security</H2>
        <Muted>Login session phone ke encrypted SecureStore mein rehta hai.</Muted>
        <H2>Data delete karna</H2>
        <Muted>
          Profile screen se tum phone ka saara data hata sakte ho, aur account delete karke cloud ka data bhi
          permanently hata sakte ho.
        </Muted>
        <H2>Health disclaimer</H2>
        <Muted>
          DrinkFit ke saare numbers estimate hain, medical advice nahi. Alcohol calorie equivalents safe drinking limit
          nahi hain. Health se jude decisions ke liye doctor se baat karo.
        </Muted>
      </Card>
      <Button title="Wapas jao" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
