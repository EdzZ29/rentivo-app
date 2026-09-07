import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRentals } from '@/lib/rentals';

type Health = 'checking' | 'online' | 'offline';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { data, locations, refresh, refreshing } = useRentals();
  const [health, setHealth] = useState<Health>('checking');
  const insets = useSafeAreaInsets();

  // The API's own /health endpoint — the quickest way to tell a misconfigured
  // EXPO_PUBLIC_API_URL apart from an app bug.
  const check = useCallback(async () => {
    setHealth('checking');
    try {
      await api.health();
      setHealth('online');
    } catch {
      setHealth('offline');
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="pb-10">
        <View className="bg-white px-5 pb-4" style={{ paddingTop: insets.top + 10 }}>
          <Text className="text-2xl font-bold text-ink">Settings</Text>
          <Text className="mt-1 text-sm text-slate-500">Connection, data and account.</Text>
        </View>

        <Section title="Connection">
          <Row
            icon="pulse-outline"
            label="API status"
            value={
              health === 'checking' ? 'Checking…' : health === 'online' ? 'Online' : 'Offline'
            }
            tone={health === 'online' ? 'good' : health === 'offline' ? 'bad' : 'muted'}
          />
          <Row icon="link-outline" label="API URL" value={API_URL} small />
          <Row
            icon="phone-portrait-outline"
            label="Platform"
            value={`${Platform.OS} ${Platform.Version}`}
            last
          />
        </Section>

        <View className="mt-3 px-5">
          <Pressable
            onPress={() => void check()}
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 active:bg-slate-50"
          >
            <Ionicons name="refresh" size={16} color="#47978b" />
            <Text className="text-sm font-semibold text-accent-dark">Test connection</Text>
          </Pressable>
        </View>

        <Section title="Data">
          <Row icon="pricetags-outline" label="Items loaded" value={`${data.products.length}`} />
          <Row icon="cube-outline" label="Packages loaded" value={`${data.packages.length}`} />
          <Row
            icon="business-outline"
            label="Businesses loaded"
            value={`${data.businesses.length}`}
          />
          <Row icon="location-outline" label="Locations" value={`${locations.length}`} last />
        </Section>

        <View className="mt-3 px-5">
          <Pressable
            onPress={refresh}
            disabled={refreshing}
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 active:bg-slate-50"
          >
            <Ionicons name="cloud-download-outline" size={16} color="#47978b" />
            <Text className="text-sm font-semibold text-accent-dark">
              {refreshing ? 'Reloading…' : 'Reload listings'}
            </Text>
          </Pressable>
        </View>

        <Section title="Account">
          {user ? (
            <>
              <Row icon="person-outline" label="Signed in as" value={user.fullName} />
              <Row icon="mail-outline" label="Email" value={user.email} small last />
            </>
          ) : (
            <Row
              icon="person-outline"
              label="Account"
              value="Not signed in"
              tone="muted"
              last
            />
          )}
        </Section>

        {user && (
          <View className="mt-3 px-5">
            <Pressable
              onPress={() => void signOut()}
              accessibilityRole="button"
              className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 active:bg-red-50"
            >
              <Ionicons name="log-out-outline" size={16} color="#dc2626" />
              <Text className="text-sm font-semibold text-red-600">Sign out</Text>
            </Pressable>
          </View>
        )}

        <Section title="About">
          <Row
            icon="information-circle-outline"
            label="Version"
            value={Constants.expoConfig?.version ?? '1.0.0'}
          />
          <Row
            icon="cube-outline"
            label="Expo SDK"
            value={Constants.expoConfig?.sdkVersion ?? '55'}
            last
          />
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-5 px-5">
      <Text className="mb-2 text-xs font-semibold uppercase text-slate-400">{title}</Text>
      <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  last,
  small,
  tone = 'default',
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  last?: boolean;
  small?: boolean;
  tone?: 'default' | 'good' | 'bad' | 'muted';
}) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-600'
      : tone === 'bad'
        ? 'text-red-600'
        : tone === 'muted'
          ? 'text-slate-400'
          : 'text-ink';

  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-3.5 ${
        last ? '' : 'border-b border-slate-100'
      }`}
    >
      <Ionicons name={icon} size={18} color="#94a3b8" />
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text
        className={`flex-1 text-right font-medium ${small ? 'text-xs' : 'text-sm'} ${toneClass}`}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
