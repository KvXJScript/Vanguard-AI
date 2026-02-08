import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number | undefined;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  color?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  color = "default",
  className 
}: MetricCardProps) {
  const colorStyles = {
    default: "text-primary bg-primary/10",
    success: "text-green-500 bg-green-500/10",
    warning: "text-yellow-500 bg-yellow-500/10",
    destructive: "text-red-500 bg-red-500/10",
  };

  return (
    <Card className={cn("p-6 flex items-start space-x-4 hover:shadow-lg transition-all duration-300 border-white/5 bg-card/50", className)}>
      <div className={cn("p-3 rounded-xl", colorStyles[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-1 tracking-tight">{value ?? "--"}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </Card>
  );
}
