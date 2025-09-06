'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generateRoundRobin } from '@/lib/scheduler';

type League = { id:string; sport:'Padel'|'Tennis'; name:string; location?:string; start:string; end:string; teams:string[] };

export default function LeaguePage() {
  const { id } = useParams<{id:string}>();
  const [league, setLeague] = useState<League | null>(null);
  const [fixtures, setFixtures] = useState<ReturnType<typeof generateRoundRobin>>([]);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(`league:${id}`) : null;
    if (raw) setLeague(JSON.parse(raw));
  }, [id]);

  useEffect(() => {
    if (league) {
      const fxs = generateRoundRobin(
        league.teams.map((_,i)=>`t${i}`),
        league.start,
        1,
        league.location
      ).map((f,i)=>({ ...f, teamA: league.teams[Number(f.teamA.slice(1))], teamB: league.teams[Number(f.teamB.slice(1))] }));
      setFixtures(fxs);
    }
  }, [league]);

  if (!league) return <main className="p-6">Loading…</main>;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{league.name}</h1>
        <Badge variant="secondary">{league.sport}</Badge>
      </header>

      <Card>
        <CardHeader><CardTitle>Fixtures</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {fixtures.map(f=>(
            <div key={f.id} className="flex items-center justify-between border rounded-xl p-3">
              <div>
                <div className="font-medium">{f.teamA} <span className="text-slate-400">vs</span> {f.teamB}</div>
                <div className="text-xs text-slate-500">{new Date(f.date!).toLocaleDateString()} • {f.location || 'TBC'}</div>
              </div>
              <Button variant="outline" size="sm">Enter score</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
