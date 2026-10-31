import React from 'react';
import {
  Refrigerator,
  CookingPot,
  Utensils,
  Wine,
  BedDouble,
  Shirt,
  Sparkles,
  Lamp,
  Heart,
  ShoppingBag,
  Gem,
  Home,
  Gift,
  Star,
  Package
} from 'lucide-react';

export const CATEGORY_ICON_MAP = {
  Refrigerator,
  CookingPot,
  Utensils,
  Wine,
  BedDouble,
  Shirt,
  Sparkles,
  Lamp,
  Heart,
  ShoppingBag,
  Gem,
  Home,
  Gift,
  Star,
  Package
};

export const AVAILABLE_CATEGORY_ICONS = [
  { name: 'Refrigerator', label: 'أجهزة', labelEn: 'Appliances' },
  { name: 'CookingPot', label: 'حلل وطهي', labelEn: 'Cookware' },
  { name: 'Utensils', label: 'مطبخ', labelEn: 'Kitchen' },
  { name: 'Wine', label: 'مائدة ونيش', labelEn: 'Tableware' },
  { name: 'BedDouble', label: 'مفروشات', labelEn: 'Bedding' },
  { name: 'Shirt', label: 'ملابس', labelEn: 'Apparel' },
  { name: 'Sparkles', label: 'عناية وتجميل', labelEn: 'Beauty' },
  { name: 'Lamp', label: 'ديكور وإضاءة', labelEn: 'Decor' },
  { name: 'Gem', label: 'مجوهرات وشبكة', labelEn: 'Jewelry' },
  { name: 'Gift', label: 'تجهيزات الفرح', labelEn: 'Wedding' },
  { name: 'Home', label: 'أثاث ومنزل', labelEn: 'Furniture' },
  { name: 'ShoppingBag', label: 'مشتريات', labelEn: 'Shopping' },
  { name: 'Heart', label: 'مفضلة', labelEn: 'Favorites' }
];

export const AVAILABLE_CATEGORY_COLORS = [
  '#D88C9A',
  '#E5989B',
  '#B56576',
  '#D4AF37',
  '#84A98C',
  '#E07A5F',
  '#C98CA7',
  '#9A8C98'
];

export function CategoryIcon({ iconName, className = 'w-6 h-6', style }) {
  const IconComponent = CATEGORY_ICON_MAP[iconName] || Sparkles;
  return <IconComponent className={className} style={style} />;
}
