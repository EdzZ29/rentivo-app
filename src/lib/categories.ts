import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// Rental categories, mirroring the web app's list so both storefronts show the
// same filters. Icons are Ionicons rather than the web's raw SVG paths.
export const CATEGORIES: { name: string; icon: IoniconName }[] = [
  { name: 'Vehicles', icon: 'car-outline' },
  { name: 'Events & Party', icon: 'sparkles-outline' },
  { name: 'Audio & Video', icon: 'musical-notes-outline' },
  { name: 'Photography', icon: 'camera-outline' },
  { name: 'Tools & Equipment', icon: 'construct-outline' },
  { name: 'Sports & Outdoor', icon: 'bicycle-outline' },
  { name: 'Property & Spaces', icon: 'home-outline' },
  { name: 'Other', icon: 'cube-outline' },
];

const iconMap = Object.fromEntries(CATEGORIES.map((c) => [c.name, c.icon]));

export function categoryIcon(name?: string | null): IoniconName {
  return iconMap[name ?? ''] ?? 'cube-outline';
}
