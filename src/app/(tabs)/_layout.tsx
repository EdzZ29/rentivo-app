import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';

const ACTIVE = '#47978b';
const INACTIVE = '#94a3b8';

// The raised "Find a rent" action sits in the middle of the bar. It isn't a tab
// — it opens the location picker as a modal — so it's rendered as a dummy tab
// whose button is replaced and whose press is intercepted.
function FindARentButton() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center">
      <Pressable
        onPress={() => router.push('/find')}
        accessibilityRole="button"
        accessibilityLabel="Find a rent by location"
        className="-mt-7 h-14 w-14 items-center justify-center rounded-full bg-accent active:bg-accent-dark"
        style={{
          shadowColor: '#135776',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Ionicons name="location" size={26} color="#ffffff" />
      </Pressable>
      <Text className="mt-1 text-[10px] font-medium text-accent-dark">Find a rent</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rent"
        options={{
          title: 'Rent',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetags-outline" size={size} color={color} />
          ),
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
