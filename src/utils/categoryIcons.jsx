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
  Package,
  Wrench,
  Sofa,
  Watch,
  Car,
  Briefcase
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
  Package,
  Wrench,
  Sofa,
  Watch,
  Car,
  Briefcase
};

export const AVAILABLE_CATEGORY_ICONS = [
  { name: 'Refrigerator', label: 'أجهزة', labelEn: 'Appliances' },
  { name: 'CookingPot', label: 'حلل وطهي', labelEn: 'Cookware' },
  { name: 'Utensils', label: 'مطبخ', labelEn: 'Kitchen' },
  { name: 'Wine', label: 'مائدة ونيش', labelEn: 'Tableware' },
  { name: 'BedDouble', label: 'مفروشات', labelEn: 'Bedding' },
  { name: 'Shirt', label: 'ملابس وبدل', labelEn: 'Apparel' },
  { name: 'Sparkles', label: 'عناية وتجميل', labelEn: 'Grooming & Beauty' },
  { name: 'Lamp', label: 'ديكور وإضاءة', labelEn: 'Decor & Lighting' },
  { name: 'Sofa', label: 'موبيليا وأثاث', labelEn: 'Furniture' },
  { name: 'Wrench', label: 'تشطيبات الشقة', labelEn: 'Apartment Finishing' },
  { name: 'Gem', label: 'شبكة وذهب', labelEn: 'Gold & Jewelry' },
  { name: 'Gift', label: 'القاعة والفرح', labelEn: 'Wedding & Venue' },
  { name: 'Home', label: 'تجهيزات منزل', labelEn: 'Home Setup' },
  { name: 'Watch', label: 'إكسسوارات وساعات', labelEn: 'Accessories' },
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
  '#9A8C98',
  '#1E40AF',
  '#2563EB',
  '#0F766E',
  '#334155'
];

export function CategoryIcon({ iconName, className = 'w-6 h-6', style }) {
  const IconComponent = CATEGORY_ICON_MAP[iconName] || Sparkles;
  return <IconComponent className={className} style={style} />;
}
