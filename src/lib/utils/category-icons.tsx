import {
  Book,
  BusFront,
  Cake,
  Camera,
  Car,
  Coffee,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  Plane,
  Pizza,
  ShoppingBag,
  Shirt,
  Smartphone,
  Music,
  Utensils,
  Wallet,
  Wrench,
  Palette,
  CreditCard,
  Sparkles,
  Hospital,
  Zap,
} from "lucide-react";

// 이모지를 Lucide 아이콘으로 매핑
const emojiToIconMap: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "🍚": Utensils,
  "☕": Coffee,
  "🍰": Cake,
  "🏠": Home,
  "🚗": Car,
  "🛍️": ShoppingBag,
  "💊": Heart,
  "🎬": Camera,
  "📚": Book,
  "📦": Wallet,
  "💰": Wallet,
  "🎮": Gamepad2,
  "🏃": Heart,
  "✈️": Plane,
  "📱": Smartphone,
  "💻": Laptop,
  "👕": Shirt,
  "🎵": Music,
  "🍕": Pizza,
  "🍜": Utensils,
  "🚌": BusFront,
  "⚡": Zap,
  "🔧": Wrench,
  "🎨": Palette,
  "📷": Camera,
  "🏥": Hospital,
  "🏫": GraduationCap,
  "💳": CreditCard,
  "🎁": Gift,
  "🌟": Sparkles,
  // 문자열 키도 지원
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
 * 카테고리 아이콘 이름(이모지 또는 문자열)으로 아이콘 컴포넌트를 가져옵니다
 * 매핑이 없으면 null을 반환하여 이모지를 그대로 표시하도록 합니다
 */
export function getCategoryIcon(
  iconName: string
): React.ComponentType<{ className?: string }> | null {
  return (
    emojiToIconMap[iconName] || emojiToIconMap[iconName.toLowerCase()] || null
  );
}
