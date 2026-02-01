import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export function KPICard({ title, value, icon: Icon, color, bgColor }: KPICardProps) {
  return (
    <Card className={cn("border-l-4", color.replace("text-", "border-"))}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-full", bgColor)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold", color)}>{value}</div>
      </CardContent>
    </Card>
  );
}
