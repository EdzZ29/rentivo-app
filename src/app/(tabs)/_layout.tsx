import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, type ComponentProps } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressableScale from '@/components/motion/PressableScale';
import { SPRING_PRESS } from '@/lib/motion';

const ACTIVE = '#006e59';
const INACTIVE = '#94a3b8';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * A tab icon that lifts and grows when its tab becomes active.
 *
 * Spring-driven so switching tabs quickly doesn't queue up a backlog of
 * animations — each change retargets the one in flight.
 */
function TabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: IconName;
  color: string;
  size: number;
  focused: boolean;
}) {
  const active = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    active.value = withSpring(focused ? 1 : 0, SPRING_PRESS);
  }, [focused, active]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + active.value * 0.14 }, { translateY: -active.value * 2 }],
  }));

  return (
    <Animated.View style={style}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

// The raised "Find a rent" action sits in the middle of the bar. It isn't a tab
// — it opens the location picker as a modal — so it's rendered as a dummy tab
// whose button is replaced and whose press is intercepted.
function FindARentButton() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center">
      <PressableScale
        onPress={() => router.push('/find')}
        accessibilityRole="button"
        accessibilityLabel="Find a rent by location"
        // A little more travel than the default: it's the one raised control,
        // so it can afford a more physical press.
        scaleTo={0.9}
        dim={false}
        className="-mt-7 h-14 w-14 items-center justify-center rounded-full bg-accent"
        wrapperStyle={{
          shadowColor: '#006e59',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Ionicons name="location" size={26} color="#ffffff" />
      </PressableScale>
      <Text className="mt-1 text-[10px] font-medium text-ink">Find a rent</Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        // Cross-fade between tabs. 'shift' would slide the whole screen, which
        // fights the horizontal pager inside Rent.
        animation: 'fade',
        // Screens draw edge to edge, so the bar has to reserve the bottom inset
        // itself — a fixed height would sit under the gesture bar.
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: (p) => <TabIcon name="home-outline" {...p} />,
        }}
      />
      <Tabs.Screen
        name="rent"
        options={{
          title: 'Rent',
          tabBarIcon: (p) => <TabIcon name="pricetags-outline" {...p} />,
        }}
      />
      <Tabs.Screen
        name="find-action"
        options={{
          title: '',
          tabBarButton: () => <FindARentButton />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: (p) => <TabIcon name="settings-outline" {...p} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: (p) => <TabIcon name="person-outline" {...p} />,
        }}
      />
    </Tabs>
  );
}
