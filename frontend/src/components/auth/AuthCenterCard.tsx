import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/client/utils";

interface AuthCenterCardProps {
  iconBg: string;
  iconColor?: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthCenterCard({
  iconBg,
  iconColor = "text-brand-fg",
  icon: Icon,
  title,
  subtitle,
  children,
}: AuthCenterCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <Card className="w-full max-w-md bg-bg-elev border-border shadow-default">
        <CardHeader className="text-center pt-8 pb-4">
          <div
            className={cn(
              "mx-auto mb-3 w-16 h-16 rounded-2xl flex items-center justify-center",
              iconBg
            )}
          >
            <Icon className={cn("w-8 h-8", iconColor)} strokeWidth={1.7} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-fg">
            {title}
          </CardTitle>
          {subtitle && (
            <CardDescription className="text-fg-muted">
              {subtitle}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </div>
  );
}
