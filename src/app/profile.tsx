import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ComponentProps } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { assetUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';

/**
 * The full account record behind "View profile" on the Account tab — the exact
 * fields GET /auth/me returns, nothing invented.
 */
export default function Profile() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch {
      /* keep showing the profile we already have */
    } finally {
      setRefreshing(false);
    }
  };

  // Signing out from elsewhere while this is open leaves nothing to show.
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-sm text-slate-500">You&apos;re not signed in.</Text>
      </View>
    );
  }

  const avatar = assetUrl(user.avatarUrl);

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <View
        style={{ paddingTop: insets.top + 10 }}
        className="flex-row items-center gap-3 border-b border-slate-200 bg-white px-4 pb-3"
      >
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color="#135776" />
        </Pressable>
        <Text className="text-lg font-bold text-ink">Profile</Text>
      </View>

      <ScrollView
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#56aea1" />
        }
      >
        <View className="items-center bg-ink px-5 pb-8 pt-6">
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={{ width: 88, height: 88, borderRadius: 44 }}
              contentFit="cover"
              transition={180}
            />
          ) : (
            <View
              style={{ width: 88, height: 88 }}
              className="items-center justify-center rounded-full bg-white/15"
            >
              <Text className="text-3xl font-bold text-white">
                {user.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text className="mt-3 text-xl font-bold text-white">{user.fullName}</Text>
          <Text className="text-sm text-white/70">{user.email}</Text>
        </View>

        <View className="mt-5 px-5">
          <Text className="mb-2 text-xs font-semibold uppercase text-slate-400">Account</Text>
          <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <InfoRow icon="person-outline" label="Full name" value={user.fullName} />
            <InfoRow icon="mail-outline" label="Email" value={user.email} />
            <InfoRow icon="shield-checkmark-outline" label="Role" value={user.role} />
            <InfoRow icon="card-outline" label="Plan" value={user.plan ?? 'None'} last />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-3.5 ${
        last ? '' : 'border-b border-slate-100'
      }`}
    >
      <Ionicons name={icon} size={18} color="#94a3b8" />
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text
        className="flex-1 text-right text-sm font-medium capitalize text-ink"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
