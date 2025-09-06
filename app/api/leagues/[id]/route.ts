import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const league = await prisma.league.findUnique({
    where: { id: params.id },
    include: {
      teams: { orderBy: { name: 'asc' } },
      fixtures: {
        orderBy: [{ round: 'asc' }, { date: 'asc' }],
        include: { teamA: true, teamB: true, result: true },
      },
    },
  });

  if (!league) return new Response('Not found', { status: 404 });

  return Response.json(league);
}
