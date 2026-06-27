import { PrismaClient, TeamType } from "@prisma/client";
import { SUBJECT_MATCHERS, TEAM_LABELS } from "@flowpay/shared";

const prisma = new PrismaClient();

const attendantNames: Record<TeamType, string[]> = {
  CARDS: ["Ana Martins", "Bruno Rocha", "Clara Nunes", "Joao Pereira"],
  LOANS: ["Diego Alves", "Elisa Moraes", "Felipe Andrade", "Laura Campos"],
  OTHER: ["Gabriela Lima", "Henrique Duarte", "Iris Monteiro", "Marcelo Vieira"]
};

const legacySeedPrefixes = [
  "Cliente Docker",
  "Cliente Socket",
  "Cliente Test",
  "Cliente Demo",
  "Cliente "
];

const demoAttendances: Array<{
  customerName: string;
  subject: string;
  teamType: TeamType;
  attendantIndex?: number;
  status: "IN_PROGRESS" | "QUEUED" | "FINISHED" | "CANCELLED";
}> = [
  {
    customerName: "Marina Teixeira",
    subject: "Problemas com cartao",
    teamType: "CARDS",
    attendantIndex: 0,
    status: "IN_PROGRESS"
  },
  {
    customerName: "Aurora Agronegócios LTDA",
    subject: "Compra nao reconhecida",
    teamType: "CARDS",
    attendantIndex: 1,
    status: "IN_PROGRESS"
  },
  {
    customerName: "Camila Nogueira",
    subject: "Contestacao de compra",
    teamType: "CARDS",
    attendantIndex: 2,
    status: "IN_PROGRESS"
  },
  {
    customerName: "Atlas Transportes",
    subject: "Cartao bloqueado preventivamente",
    teamType: "CARDS",
    status: "QUEUED"
  },
  {
    customerName: "Patrícia Lima",
    subject: "Falha em pagamento por aproximacao",
    teamType: "CARDS",
    status: "QUEUED"
  },
  {
    customerName: "Prisma Alimentos",
    subject: "Limite emergencial",
    teamType: "CARDS",
    attendantIndex: 3,
    status: "FINISHED"
  },
  {
    customerName: "Rafael Almeida",
    subject: "Contratacao de emprestimo",
    teamType: "LOANS",
    attendantIndex: 0,
    status: "IN_PROGRESS"
  },
  {
    customerName: "Horizonte Capital ME",
    subject: "Analise de proposta PJ",
    teamType: "LOANS",
    attendantIndex: 1,
    status: "IN_PROGRESS"
  },
  {
    customerName: "Lucas Azevedo",
    subject: "Simulacao de credito pessoal",
    teamType: "LOANS",
    attendantIndex: 2,
    status: "IN_PROGRESS"
  },
  {
    customerName: "Nova Safra Comercial",
    subject: "Renegociacao de contrato",
    teamType: "LOANS",
    status: "QUEUED"
  },
  {
    customerName: "Eduardo Martins",
    subject: "Antecipacao de parcelas",
    teamType: "LOANS",
    attendantIndex: 3,
    status: "FINISHED"
  },
  {
    customerName: "Vértice Consultoria",
    subject: "Revisao de taxa aprovada",
    teamType: "LOANS",
    status: "CANCELLED"
  },
  {
    customerName: "Beatriz Carvalho",
    subject: "Atualizacao cadastral",
    teamType: "OTHER",
    attendantIndex: 0,
    status: "IN_PROGRESS"
  },
  {
    customerName: "Prime Soluções Financeiras",
    subject: "Alteracao de dados bancarios",
    teamType: "OTHER",
    attendantIndex: 1,
    status: "IN_PROGRESS"
  },
  {
    customerName: "Fernanda Ribeiro",
    subject: "Duvida sobre aplicativo",
    teamType: "OTHER",
    attendantIndex: 2,
    status: "IN_PROGRESS"
  },
  {
    customerName: "Lumina Tech Serviços",
    subject: "Suporte de acesso a conta",
    teamType: "OTHER",
    status: "QUEUED"
  },
  {
    customerName: "Gustavo Moreira",
    subject: "Solicitacao de comprovante",
    teamType: "OTHER",
    attendantIndex: 3,
    status: "FINISHED"
  },
  {
    customerName: "Terranova Máquinas",
    subject: "Atendimento prioritario",
    teamType: "OTHER",
    status: "CANCELLED"
  },
  {
    customerName: "Henrique Farias",
    subject: "Segunda via de cartao",
    teamType: "CARDS",
    attendantIndex: 0,
    status: "FINISHED"
  },
  {
    customerName: "Safra Norte Distribuidora",
    subject: "Analise de proposta PJ",
    teamType: "LOANS",
    attendantIndex: 1,
    status: "FINISHED"
  }
];

async function main() {
  const seededTeams = new Map<TeamType, { id: string }>();

  await prisma.attendant.deleteMany({
    where: {
      name: "João Pereira",
      attendances: { none: {} }
    }
  });

  for (const type of Object.values(TeamType)) {
    const team = await prisma.team.upsert({
      where: { type },
      update: {
        name: TEAM_LABELS[type],
        subjectMatcher: SUBJECT_MATCHERS[type]
      },
      create: {
        type,
        name: TEAM_LABELS[type],
        subjectMatcher: SUBJECT_MATCHERS[type]
      }
    });
    seededTeams.set(type, team);

    for (const name of attendantNames[type]) {
      await prisma.attendant.upsert({
        where: {
          teamId_name: {
            teamId: team.id,
            name
          }
        },
        update: {
          isOnline: true,
          maxConcurrentAttendances: 3
        },
        create: {
          name,
          teamId: team.id,
          isOnline: true,
          maxConcurrentAttendances: 3
        }
      });
    }
  }

  await prisma.attendance.deleteMany({
    where: {
      OR: legacySeedPrefixes.map((prefix) => ({
        customerName: { startsWith: prefix }
      }))
    }
  });

  const demoCustomerNames = demoAttendances.map(
    (attendance) => attendance.customerName
  );
  const demoAttendanceCount = await prisma.attendance.count({
    where: {
      customerName: { in: demoCustomerNames }
    }
  });

  if (demoAttendanceCount < demoAttendances.length) {
    await prisma.attendance.deleteMany({
      where: {
        customerName: { in: demoCustomerNames }
      }
    });

    const now = new Date();

    for (const [index, attendance] of demoAttendances.entries()) {
      const team = seededTeams.get(attendance.teamType);

      if (!team) {
        continue;
      }

      const attendants = await prisma.attendant.findMany({
        where: { teamId: team.id },
        orderBy: [{ name: "asc" }]
      });
      const attendant =
        attendance.attendantIndex !== undefined
          ? attendants[attendance.attendantIndex]
          : null;
      const queuedAt = new Date(
        now.getTime() - (demoAttendances.length - index) * 75_000
      );
      const startedAt =
        attendance.status === "IN_PROGRESS" || attendance.status === "FINISHED"
          ? new Date(queuedAt.getTime() + 45_000)
          : null;
      const finishedAt =
        attendance.status === "FINISHED" || attendance.status === "CANCELLED"
          ? new Date(queuedAt.getTime() + 180_000)
          : null;

      await prisma.attendance.create({
        data: {
          customerName: attendance.customerName,
          subject: attendance.subject,
          teamId: team.id,
          attendantId: attendant?.id ?? null,
          status: attendance.status,
          queuedAt,
          startedAt,
          finishedAt
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
