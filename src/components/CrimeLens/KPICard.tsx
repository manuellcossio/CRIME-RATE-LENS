import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon?: React.ReactNode;
  variant?: "default" | "teal" | "amber" | "danger";
}

export function KPICard({ title, value, subtitle, change, icon, variant = "default" }: KPICardProps) {
  const glowClass = variant === "teal" ? "glow-teal" : variant === "amber" ? "glow-amber" : "";
  const accentBorder =
    variant === "teal"
      ? "border-l-primary"
      : variant === "amber"
      ? "border-l-accent"
      : variant === "danger"
      ? "border-l-destructive"
      : "border-l-border";

  return (
    <div className={`glass-card p-5 border-l-4 ${accentBorder} ${glowClass} animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      {change !== undefined && (
        <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${change > 0 ? "text-destructive" : change < 0 ? "text-primary" : "text-muted-foreground"}`}>
          {change > 0 ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          <span>{change > 0 ? "+" : ""}{change.toFixed(1)}% vs año anterior</span>
        </div>
      )}
    </div>
  );
}
