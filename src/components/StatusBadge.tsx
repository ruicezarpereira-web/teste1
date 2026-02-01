import { cn } from "@/lib/utils";
import { ClassificacaoUrgencia } from "@/lib/quinquenio";

interface StatusBadgeProps {
  classificacao: ClassificacaoUrgencia;
  className?: string;
}

export function StatusBadge({ classificacao, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        classificacao.bgColor,
        classificacao.cor,
        className
      )}
    >
      {classificacao.status}
    </span>
  );
}
