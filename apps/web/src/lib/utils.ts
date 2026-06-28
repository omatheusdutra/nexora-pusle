import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TeamType } from "@flowpay/shared";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatSeconds(value: number) {
  if (value < 60) {
    return `${Math.round(value)}s`;
  }

  return `${Math.round(value / 60)}min`;
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    QUEUED: "Na fila",
    IN_PROGRESS: "Em atendimento",
    FINISHED: "Finalizado",
    CANCELLED: "Cancelado"
  };

  return labels[status] ?? status;
}

export function initialsFor(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "";

  return `${first}${second}`.toUpperCase();
}

export function displayTeamName(teamName: string, teamType?: TeamType) {
  if (teamType === "CARDS" || teamName.toLowerCase().includes("cart")) {
    return "Cartões & Disputas";
  }

  if (teamType === "LOANS" || teamName.toLowerCase().includes("emprest")) {
    return "Crédito & Empréstimos";
  }

  return "Relacionamento Geral";
}

export function teamTone(teamName: string, teamType?: TeamType) {
  if (teamType === "CARDS" || teamName.toLowerCase().includes("cart")) {
    return {
      dot: "bg-primary",
      text: "text-primary",
      border: "border-primary/25",
      background: "bg-primary/10",
      chart: "hsl(var(--primary))"
    };
  }

  if (teamType === "LOANS" || teamName.toLowerCase().includes("emprest")) {
    return {
      dot: "bg-violet",
      text: "text-violet",
      border: "border-violet/25",
      background: "bg-violet/10",
      chart: "hsl(var(--violet))"
    };
  }

  return {
    dot: "bg-accent",
    text: "text-accent",
    border: "border-accent/25",
    background: "bg-accent/10",
    chart: "hsl(var(--accent))"
  };
}

export const professionalSubjects = [
  "Problemas com cartão",
  "Contestação de compra",
  "Cartão bloqueado preventivamente",
  "Segunda via de cartão",
  "Compra não reconhecida",
  "Limite emergencial",
  "Falha em pagamento por aproximação",
  "Contratação de empréstimo",
  "Simulação de crédito pessoal",
  "Análise de proposta PJ",
  "Renegociação de contrato",
  "Antecipação de parcelas",
  "Revisão de taxa aprovada",
  "Atualização cadastral",
  "Alteração de dados bancários",
  "Dúvida sobre aplicativo",
  "Solicitação de comprovante",
  "Atendimento prioritário",
  "Suporte de acesso à conta"
];
