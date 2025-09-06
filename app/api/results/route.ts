import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Winner } from '@prisma/client';

export async function POST(req: NextRequest) {
  const { fixtureId, sets, winner } = (await req.json()) as {
    fixtureId: string;
    sets: Array<{ a: number; b: number }>;
    winner: 'A' | 'B';
  };
  if (!fixtureId || !sets?.length || !winner) {
    return new Response('Bad request', { status: 400 });
  }

  const exists = await prisma.result.findUnique({ where: { fixtureId } });

  if (exists) {
    await prisma.result.update({
      where: { fixtureId },
      data: { sets, winner: winner as Winner },
    });
  } else {
    await prisma.result.create({
      data: { fixtureId, sets, winner: winner as Winner },
    });
  }

  return Response.json({ ok: true });
}
