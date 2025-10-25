import { Badge } from "@/components/ui/badge";
import { getCategoryIcon } from "@/lib/utils/category-icons";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface ExpenseItemProps {
  uuid: string;
  amount: string | number;
  description?: string | null;
  date: Date | string;
  category: {
    name: string;
    color: string;
    icon: string;
  };
}

export function ExpenseItem({
  uuid,
  amount,
  description,
  date,
  category,
}: ExpenseItemProps) {
  const IconComponent = getCategoryIcon(category.icon);
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Lucide 아이콘으로 매핑이 없으면 이모지를 그대로 사용
  const useEmoji = !IconComponent;

  return (
    <div
      key={uuid}
      className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center space-x-2.5 md:space-x-4 flex-1">
        <div
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm"
          style={{
            backgroundColor: `${category.color}20`,
          }}
        >
          {useEmoji ? (
            <span className="text-xl md:text-2xl">{category.icon}</span>
          ) : (
            <div style={{ color: category.color }}>
              {IconComponent && (
                <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5 md:space-x-2 mb-0.5 md:mb-1">
            <h4 className="font-semibold text-gray-900 text-sm md:text-base truncate">
              {description || category.name}
            </h4>
            <Badge
              variant="secondary"
              className="text-[10px] md:text-xs px-1.5 py-0 shrink-0"
              style={{
                backgroundColor: `${category.color}15`,
                color: category.color,
                border: "none",
              }}
            >
              {category.name}
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-gray-500">
            {format(dateObj, "M월 d일 (E) HH:mm", {
              locale: ko,
            })}
          </p>
        </div>
      </div>
      <div className="text-right ml-2">
        <p className="text-sm md:text-lg font-bold text-gray-900 whitespace-nowrap">
          -₩{Number(amount).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
