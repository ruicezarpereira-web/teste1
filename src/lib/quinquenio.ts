import { differenceInDays, parseISO, isValid } from "date-fns";

export interface Periodo {
  inicio: string;
  fim: string | null;
}

export interface CalculoQuinquenio {
  dias_corridos: number;
  dias_acrescimo: number;
  dias_liquidos: number;
  status: "COMPLETO" | "INCOMPLETO";
  dias_restantes: number;
}

export interface ClassificacaoUrgencia {
  status: "VENCIDO" | "URGENTE" | "PRÓXIMO" | "EM BREVE" | "REGULAR";
  cor: string;
  bgColor: string;
}

export const DIAS_QUINQUENIO = 1825;
export const PENALIDADE_FALTA = 10;

export function calcularDiasCorridos(periodos: Periodo[]): number {
  let total = 0;
  
  for (const periodo of periodos) {
    const inicio = parseISO(periodo.inicio);
    const fim = periodo.fim ? parseISO(periodo.fim) : new Date();
    
    if (isValid(inicio) && isValid(fim)) {
      total += differenceInDays(fim, inicio) + 1;
    }
  }
  
  return total;
}

export function calcularQuinquenio(
  periodos: Periodo[],
  totalFaltas: number = 0,
  acrescimosExtras: number = 0
): CalculoQuinquenio {
  const dias_corridos = calcularDiasCorridos(periodos);
  const dias_acrescimo = (totalFaltas * PENALIDADE_FALTA) + acrescimosExtras;
  const dias_liquidos = dias_corridos - dias_acrescimo;
  const dias_restantes = DIAS_QUINQUENIO - dias_liquidos;
  const status = dias_liquidos >= DIAS_QUINQUENIO ? "COMPLETO" : "INCOMPLETO";
  
  return {
    dias_corridos,
    dias_acrescimo,
    dias_liquidos,
    status,
    dias_restantes,
  };
}

export function classificarUrgencia(dias_restantes: number): ClassificacaoUrgencia {
  if (dias_restantes <= 0) {
    return { status: "VENCIDO", cor: "text-red-700", bgColor: "bg-red-100" };
  }
  if (dias_restantes <= 30) {
    return { status: "URGENTE", cor: "text-orange-700", bgColor: "bg-orange-100" };
  }
  if (dias_restantes <= 90) {
    return { status: "PRÓXIMO", cor: "text-yellow-700", bgColor: "bg-yellow-100" };
  }
  if (dias_restantes <= 180) {
    return { status: "EM BREVE", cor: "text-blue-700", bgColor: "bg-blue-100" };
  }
  return { status: "REGULAR", cor: "text-green-700", bgColor: "bg-green-100" };
}

export function formatarData(data: string | null | undefined): string {
  if (!data) return "-";
  const parsed = parseISO(data);
  if (!isValid(parsed)) return "-";
  return parsed.toLocaleDateString("pt-BR");
}
