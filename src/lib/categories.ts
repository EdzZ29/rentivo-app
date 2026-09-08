import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Category = {
  name: string;
  /** Fallback glyph, and what a listing with no photograph falls back to. */
  icon: IoniconName;
  /**
   * Optional thumbnail for the Browse-by-category row. Statically required so
   * Metro bundles it; the tiles are square, and the files are cover-cropped to
   * 240×240 by `npm run optimize:images`.
   *
   * Not every category has one — "Other" is a catch-all with nothing to
   * photograph, so it keeps the glyph.
   */
  image?: ImageSourcePropType;
};

// Rental categories, mirroring the web app's list so both storefronts show the
// same filters. Icons are Ionicons rather than the web's raw SVG paths.
export const CATEGORIES: Category[] = [
  {
    name: 'Vehicles',
    icon: 'car-outline',
    image: require('@/assets/images/categories/Vehicles.jpg'),
  },
  {
    name: 'Events & Party',
    icon: 'sparkles-outline',
    image: require('@/assets/images/categories/Events.jpg'),
  },
  {
    name: 'Audio & Video',
    icon: 'musical-notes-outline',
    image: require('@/assets/images/categories/Audio.jpg'),
  },
  {
    name: 'Photography',
    icon: 'camera-outline',
    image: require('@/assets/images/categories/Photography.jpg'),
  },
  {
    name: 'Tools & Equipment',
    icon: 'construct-outline',
    image: require('@/assets/images/categories/Tools.jpg'),
  },
  {
    name: 'Sports & Outdoor',
    icon: 'bicycle-outline',
    image: require('@/assets/images/categories/Sports.jpg'),
  },
  {
    name: 'Property & Spaces',
    icon: 'home-outline',
    image: require('@/assets/images/categories/Properties.jpg'),
  },
  { name: 'Other', icon: 'cube-outline' },
];

const iconMap = Object.fromEntries(CATEGORIES.map((c) => [c.name, c.icon]));

export function categoryIcon(name?: string | null): IoniconName {
  return iconMap[name ?? ''] ?? 'cube-outline';
}
