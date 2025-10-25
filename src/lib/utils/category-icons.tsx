import {
  Car,
  Coffee,
  Gift,
  Heart,
  Home,
  ShoppingBag,
  Utensils,
  Wallet,
} from "lucide-react";

// 카테고리 아이콘 매핑
const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  shopping: ShoppingBag,
  food: Utensils,
  coffee: Coffee,
  home: Home,
  transport: Car,
  health: Heart,
  gift: Gift,
  default: Wallet,
};

/**
 * 카테고리 아이콘 이름으로 아이콘 컴포넌트를 가져옵니다
 */
export function getCategoryIcon(iconName: string) {
  const IconComponent =
    categoryIcons[iconName.toLowerCase()] || categoryIcons.default;
  return IconComponent;
}
