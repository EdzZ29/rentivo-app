import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

// Five stars, half-filled where the average lands mid-star, plus the review
// count — the same summary the web cards show.
export default function StarRating({
  value = 0,
  count = 0,
  size = 13,
}: {
  value?: number;
  count?: number;
  size?: number;
}) {
  if (!count) {
    return <Text className="text-xs text-slate-400">No reviews yet</Text>;
  }

  return (
    <View className="flex-row items-center gap-1">
      <View className="flex-row">
        {[0, 1, 2, 3, 4].map((i) => {
          const filled = value - i;
          const name =
            filled >= 0.75 ? 'star' : filled >= 0.25 ? 'star-half' : 'star-outline';
          return <Ionicons key={i} name={name} size={size} color="#f59e0b" />;
        })}
      </View>
      <Text className="text-xs text-slate-500">
        {value.toFixed(1)} ({count})
      </Text>
    </View>
  );
}
