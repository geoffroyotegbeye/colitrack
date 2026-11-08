import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "accent" | "success" | "warning";
}

const variantStyles = {
  default: "bg-card border border-border",
  accent: "gradient-accent text-accent-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
};

const iconVariantStyles = {
  default: "bg-secondary text-foreground",
  accent: "bg-accent-foreground/20 text-accent-foreground",
  success: "bg-success-foreground/20 text-success-foreground",
  warning: "bg-warning-foreground/20 text-warning-foreground",
};

export function StatsCard({ title, value, icon: Icon, trend, variant = "default" }: StatsCardProps) {
  return (
    <div className={cn("rounded-xl p-5 shadow-card transition-all hover:shadow-elevated", variantStyles[variant])}>
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-sm font-medium", variant === "default" ? "text-muted-foreground" : "opacity-90")}>
            {title}
          </p>
          <p className="mt-1 text-3xl font-bold font-heading">{value}</p>
          {trend && (
            <p className={cn("mt-1 text-xs", variant === "default" ? "text-muted-foreground" : "opacity-75")}>
              {trend}
            </p>
          )}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconVariantStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
