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

export const professionalSubjects = [
  "Problemas com cartao",
  "Contratacao de emprestimo",
  "Atualizacao cadastral",
  "Alteracao de dados bancarios",
  "Duvida sobre aplicativo",
  "Solicitacao de comprovante",
  "Atendimento prioritario",
  "Suporte de acesso a conta"
];
