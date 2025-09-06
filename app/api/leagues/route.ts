import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRoundRobin } from '@/lib/scheduler';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export async function GET() {
  const leagues = await prisma.league.findMany({
    select: { id: true, name: true, sport: true, public: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return Response.json(leagues);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, sport, location, start, end, teams } = body as {
    name: string;
    sport: 'Padel' | 'Tennis';
    location?: string;
    start?: string;
    end?: string;
    teams: string[];
  };

  if (!name || !sport || !teams?.length) {
    return new Response('Missing fields', { status: 400 });
  }

  const league = await prisma.league.create({
    data: {
      name,
      sport,
      location,
      startDate: start ? new Date(start) : null,
      endDate: end ? new Date(end) : null,
      joinToken: uid(),
    },
  });

  const teamRows = await prisma.$transaction(
    teams.map((t) => prisma.team.create({ data: { name: t, leagueId: league.id } }))
  );

  const pairIds = teamRows.map((t) => t.id);
  const fixturesRR = generateRoundRobin(
    pairIds,
    start || new Date().toISOString(),
    1,
    location
  );

  await prisma.$transaction(
    fixturesRR.map((f) =>
      prisma.fixture.create({
        data: {
          leagueId: league.id,
          round: f.round,
          teamAId: f.teamA,
          teamBId: f.teamB,
          date: f.date ? new Date(f.date) : undefined,
          location: f.location,
        },
      })
    )
  );

  return Response.json({ id: league.id }, { status: 201 });
}
