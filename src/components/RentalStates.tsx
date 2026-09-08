import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import PressableScale from '@/components/motion/PressableScale';

// Placeholder cards shown while the listings load, so the list doesn't jump
// from blank to full.
export function CardSkeletons({ count = 4 }: { count?: number }) {
  // Mirrors the real card: a rounded photo with no chrome, then three text
  // lines, so the list doesn't jump when the data lands.
  return (
    <View className="gap-6" pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        <View key={i}>
          <View style={{ aspectRatio: 1.15 }} className="rounded-2xl bg-slate-100" />
          <View className="mt-2.5 h-4 w-3/4 rounded bg-slate-100" />
          <View className="mt-1.5 h-3 w-1/2 rounded bg-slate-100" />
          <View className="mt-1.5 h-3 w-2/5 rounded bg-slate-100" />
        </View>
      ))}
    </View>
  );
}

// Neutral "nothing here" state — used both for filters that match nothing and
// for a listing that came back empty.
export function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center justify-center py-20">
      <Ionicons name="cube-outline" size={44} color="#cbd5e1" />
      <Text className="mt-4 px-8 text-center text-sm text-slate-500">{message}</Text>
    </View>
  );
}

// Shown only when nothing at all could be fetched — the one case where the
// screen has nothing better to offer than the reason and a retry.
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <Ionicons name="cloud-offline-outline" size={48} color="#cbd5e1" />
      <Text className="mt-4 text-base font-semibold text-ink">
        Couldn&apos;t load rentals
      </Text>
      <Text className="mt-2 text-center text-sm text-slate-500">{message}</Text>
      <PressableScale
        onPress={onRetry}
        accessibilityRole="button"
        className="mt-6 flex-row items-center gap-2 rounded-xl bg-brand px-5 py-3 active:bg-brand-dark"
      >
        <Ionicons name="refresh" size={16} color="#ffffff" />
        <Text className="text-sm font-semibold text-white">Try again</Text>
      </PressableScale>
    </View>
  );
}
