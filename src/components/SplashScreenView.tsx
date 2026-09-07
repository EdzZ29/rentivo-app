import { Image } from 'expo-image';
import { View } from 'react-native';

// The in-app splash: the white Rentivo lockup centred on the brand green.
// Matches the native splash (same colour, same asset) so the handover from the
// native screen to this one is invisible.
export default function SplashScreenView() {
  return (
    <View className="flex-1 items-center justify-center bg-brand">
      <Image
        source={require('@/assets/images/logo-name.png')}
        style={{ width: 220, height: 50 }}
        contentFit="contain"
        // No fade — it should already be on screen as the native splash hides.
        transition={0}
      />
    </View>
  );
}
