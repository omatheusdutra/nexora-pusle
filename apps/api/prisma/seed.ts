import { PrismaClient, TeamType } from "@prisma/client";
import { SUBJECT_MATCHERS, TEAM_LABELS } from "@flowpay/shared";

const prisma = new PrismaClient();

const attendantNames: Record<TeamType, string[]> = {
  CARDS: ["Ana Martins", "Bruno Rocha", "Clara Nunes", "Joao Pereira"],
  LOANS: ["Diego Alves", "Elisa Moraes", "Felipe Andrade", "Laura Campos"],
  OTHER: ["Gabriela Lima", "Henrique Duarte", "Iris Monteiro", "Marcelo Vieira"]
};

const demoAttendances: Array<{
  customerName: string;
  subject: string;
  teamType: TeamType;
  attendantIndex?: number;
  status: "IN_PROGRESS" | "QUEUED" | "FINISHED";
}> = [
  {
    customerName: "Marina Teixeira",
    subject: "Problemas com cartao",
    teamType: "CARDS",
    attendantIndex: 0,
    status: "IN_PROGRESS"
  },
  {
    customerName: "Aurora Agronegocios LTDA",
    subject: "Compra nao reconhecida",
    teamType: "CARDS",
    attendantIndex: 1,
    status: "IN_PROGRESS"
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
    customerName: "Camila Nogueira",
    subject: "Atualizacao cadastral",
    teamType: "OTHER",
    attendantIndex: 0,
    status: "IN_PROGRESS"
  },
  {
    customerName: "Atlas Transportes",
    subject: "Solicitacao de comprovante",
    teamType: "OTHER",
    status: "QUEUED"
  },
  {
    customerName: "Beatriz Carvalho",
    subject: "Suporte de acesso a conta",
    teamType: "OTHER",
    attendantIndex: 1,
    status: "FINISHED"
  }
];

async function main() {
  const seededTeams = new Map<TeamType, { id: string }>();

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

  const attendanceCount = await prisma.attendance.count();

  if (attendanceCount === 0) {
    const now = new Date();

    for (const attendance of demoAttendances) {
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
      const startedAt =
        attendance.status === "IN_PROGRESS" || attendance.status === "FINISHED"
          ? now
          : null;

      await prisma.attendance.create({
        data: {
          customerName: attendance.customerName,
          subject: attendance.subject,
          teamId: team.id,
          attendantId: attendant?.id ?? null,
          status: attendance.status,
          queuedAt: now,
          startedAt,
          finishedAt: attendance.status === "FINISHED" ? now : null
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
