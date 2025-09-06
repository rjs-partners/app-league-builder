'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateRoundRobin } from '@/lib/scheduler';
import { computeStandings, type Fixture } from '@/lib/standings';

type League = { id:string; sport:'Padel'|'Tennis'; name:string; location?:string; start:string; end:string; teams:string[] };

export default function LeaguePage() {
  const { id } = useParams<{id: string}>();
  const [league, setLeague] = useState<League | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);

  // load league + fixtures from localStorage (created on /leagues/new)
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(`league:${id}`) : null;
    if (!raw) return;
    const lg: League = JSON.parse(raw);
    setLeague(lg);

    const stored = localStorage.getItem(`league:${id}:fixtures`);
    if (stored) {
      setFixtures(JSON.parse(stored));
    } else {
      const rr = generateRoundRobin(
        lg.teams.map((_, i) => `t${i}`),
        lg.start,
        1,
        lg.location
      ).map((f) => ({
        ...f,
        teamA: lg.teams[Number(f.teamA.slice(1))],
        teamB: lg.teams[Number(f.teamB.slice(1))],
      })) as Fixture[];
      setFixtures(rr);
      localStorage.setItem(`league:${id}:fixtures`, JSON.stringify(rr));
    }
  }, [id]);

  // persist fixtures on change
  useEffect(() => {
    if (!league || fixtures.length === 0) return;
    localStorage.setItem(`league:${id}:fixtures`, JSON.stringify(fixtures));
  }, [fixtures, id, league]);

  const table = useMemo(() => {
    if (!league) return [];
    return computeStandings(league.teams, fixtures);
  }, [league, fixtures]);

  const updateResult = (fixtureId: string, sets: Array<{ a:number; b:number }>) => {
    setFixtures((prev) =>
      prev.map((f) =>
        f.id === fixtureId
          ? {
              ...f,
              result: {
                sets,
                winner:
                  sets.filter((s) => s.a > s.b).length >
                  sets.filter((s) => s.b > s.a).length
                    ? 'A'
                    : 'B',
              },
            }
          : f
      )
    );
  };

  if (!league) return <main className="p-6">Loading…</main>;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{league.name}</h1>
        <Badge variant="secondary">{league.sport}</Badge>
        {league.location && <Badge variant="outline">{league.location}</Badge>}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Fixtures + results entry */}
        <Card>
          <CardHeader><CardTitle>Fixtures</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {fixtures.map((f) => (
              <FixtureRow
                key={f.id}
                fixture={f}
                sport={league.sport}
                onSubmit={(sets) => updateResult(f.id, sets)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Standings */}
        <Card>
          <CardHeader><CardTitle>Standings</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 pr-2">Team</th>
                  <th className="py-2">P</th>
                  <th className="py-2">W</th>
                  <th className="py-2">L</th>
                  <th className="py-2">Sets</th>
                  <th className="py-2">Games</th>
                  <th className="py-2 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {table.map((r) => (
                  <tr key={r.team} className="border-t">
                    <td className="py-2 pr-2 font-medium">{r.team}</td>
                    <td className="py-2">{r.played}</td>
                    <td className="py-2">{r.won}</td>
                    <td className="py-2">{r.lost}</td>
                    <td className="py-2">{r.setsFor}:{r.setsAgainst}</td>
                    <td className="py-2">{r.gamesFor}:{r.gamesAgainst}</td>
                    <td className="py-2 text-right font-semibold">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function FixtureRow({
  fixture,
  sport,
  onSubmit,
}: {
  fixture: Fixture;
  sport: 'Padel' | 'Tennis';
  onSubmit: (sets: Array<{ a: number; b: number }>) => void;
}) {
  const [setCount, setSetCount] = useState<number>(sport === 'Tennis' ? 3 : 3);
  const [scores, setScores] = useState<Array<{ a: number | ''; b: number | '' }>>(
    Array.from({ length: 5 }, () => ({ a: '', b: '' }))
  );

  const updateScore = (idx: number, side: 'a' | 'b', val: string) => {
    setScores((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        [side]: val === '' ? '' : Number(val),
      } as { a: number | ''; b: number | '' };
      return next;
    });
  };

  const submit = () => {
    const sets = scores
      .slice(0, setCount)
      .filter((s) => typeof s.a === 'number' && typeof s.b === 'number') as Array<{
      a: number;
      b: number;
    }>;
    if (sets.length === 0) return;
    onSubmit(sets);
    setScores(Array.from({ length: 5 }, () => ({ a: '', b: '' })));
  };

  return (
    <div className="grid items-center gap-2 rounded-xl border p-3 md:grid-cols-12">
      <div className="md:col-span-5">
      
        <div className="font-medium">
          {fixture.teamA} <span className="text-slate-400">vs</span> {fixture.teamB}
        </div>
        <div className="text-xs text-slate-500">
          {fixture.date ? new Date(fixture.date).toLocaleDateString() : 'TBC'} •{' '}
          {fixture.location || 'TBC'}
        </div>
      </div>
      <div className="md:col-span-4">
        {fixture.result ? (
          <Badge variant="success" className="rounded-xl">
            Result: {fixture.result.sets.map((s) => `${s.a}-${s.b}`).join(', ')} •{' '}
            {fixture.result.winner === 'A' ? 'Winner: Home' : 'Winner: Away'}
          </Badge>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            {sport === 'Tennis' && (
              <select
                className="rounded-xl border p-1 text-xs"
                value={setCount}
                onChange={(e) => setSetCount(Number(e.target.value))}
              >
                <option value={1}>1 set</option>
                <option value={3}>3 sets</option>
                <option value={5}>5 sets</option>
              </select>
            )}
            {Array.from({ length: setCount }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <Input
                  className="w-12"
                  inputMode="numeric"
                  placeholder="6"
                  value={scores[idx].a}
                  onChange={(e) => updateScore(idx, 'a', e.target.value)}
                />
                <span className="text-slate-400">-</span>
                <Input
                  className="w-12"
                  inputMode="numeric"
                  placeholder="4"
                  value={scores[idx].b}
                  onChange={(e) => updateScore(idx, 'b', e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="md:col-span-3 md:flex md:justify-end">
        {fixture.result ? (
          <Badge variant="outline" className="rounded-xl">
            Confirmed
          </Badge>
        ) : (
          <Button onClick={submit}>Submit result</Button>
        )}
      </div>
    </div>
  );
}
