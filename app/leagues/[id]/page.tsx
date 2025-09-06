'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { computeStandings, type Fixture } from '@/lib/standings';

export default function LeaguePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/leagues/${id}`, { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    })();
  }, [id]);

  const fixtures: Fixture[] = useMemo(() => {
    if (!data) return [];
    return data.fixtures.map((f: any) => ({
      id: f.id,
      round: f.round,
      teamA: f.teamA.name,
      teamB: f.teamB.name,
      date: f.date || undefined,
      location: f.location || undefined,
      result: f.result ? { sets: f.result.sets, winner: f.result.winner } : null,
    }));
  }, [data]);

  const table = useMemo(() => {
    if (!data) return [];
    return computeStandings(data.teams.map((t: any) => t.name), fixtures);
  }, [data, fixtures]);

  const submitResult = async (fixtureId: string, sets: Array<{ a: number; b: number }>) => {
    const winner =
      sets.filter((s) => s.a > s.b).length >
      sets.filter((s) => s.b > s.a).length
        ? 'A'
        : 'B';
    await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixtureId, sets, winner }),
    });
    const res = await fetch(`/api/leagues/${id}`, { cache: 'no-store' });
    if (res.ok) setData(await res.json());
  };

  if (!data) return <main className="p-6">Loading…</main>;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{data.name}</h1>
        <Badge variant="secondary">{data.sport}</Badge>
        {data.location && <Badge variant="outline">{data.location}</Badge>}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Fixtures + results entry */}
        <Card>
          <CardHeader><CardTitle>Fixtures</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {fixtures.map((f) => (
              <FixtureRow key={f.id} fixture={f} onSubmit={(sets)=>submitResult(f.id, sets)} />
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

function FixtureRow({ fixture, onSubmit }: {
  fixture: Fixture;
  onSubmit: (sets: Array<{a:number; b:number}>) => void;
}) {
  const [s1a, setS1a] = useState<number | ''>(''); const [s1b, setS1b] = useState<number | ''>('');
  const [s2a, setS2a] = useState<number | ''>(''); const [s2b, setS2b] = useState<number | ''>('');
  const [s3a, setS3a] = useState<number | ''>(''); const [s3b, setS3b] = useState<number | ''>('');

  const submit = () => {
    const sets = [
      typeof s1a === 'number' && typeof s1b === 'number' ? { a: s1a, b: s1b } : null,
      typeof s2a === 'number' && typeof s2b === 'number' ? { a: s2a, b: s2b } : null,
      typeof s3a === 'number' && typeof s3b === 'number' ? { a: s3a, b: s3b } : null,
    ].filter(Boolean) as Array<{a:number; b:number}>;
    if (sets.length === 0) return;
    onSubmit(sets);
    setS1a(''); setS1b(''); setS2a(''); setS2b(''); setS3a(''); setS3b('');
  };

  return (
    <div className="grid gap-2 rounded-xl border p-3 md:grid-cols-12 items-center">
      <div className="md:col-span-5">
        <div className="font-medium">{fixture.teamA} <span className="text-slate-400">vs</span> {fixture.teamB}</div>
        <div className="text-xs text-slate-500">{fixture.date ? new Date(fixture.date).toLocaleDateString() : 'TBC'} • {fixture.location || 'TBC'}</div>
      </div>
      <div className="md:col-span-4">
        {fixture.result ? (
          <Badge variant="success" className="rounded-xl">
            Result: {fixture.result.sets.map(s => `${s.a}-${s.b}`).join(', ')} • {fixture.result.winner === 'A' ? 'Winner: Home' : 'Winner: Away'}
          </Badge>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            {([
              [s1a, setS1a, s1b, setS1b],
              [s2a, setS2a, s2b, setS2b],
              [s3a, setS3a, s3b, setS3b],
            ] as [
              number | '', React.Dispatch<React.SetStateAction<number | ''>>,
              number | '', React.Dispatch<React.SetStateAction<number | ''>>
            ][]).map((row, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <Input className="w-12" inputMode="numeric" placeholder="6"
                  value={row[0]} onChange={(e)=>row[1](e.target.value==='' ? '' : Number(e.target.value))} />
                <span className="text-slate-400">-</span>
                <Input className="w-12" inputMode="numeric" placeholder="4"
                  value={row[2]} onChange={(e)=>row[3](e.target.value==='' ? '' : Number(e.target.value))} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="md:col-span-3 md:flex md:justify-end">
        {fixture.result ? (
          <Badge variant="outline" className="rounded-xl">Confirmed</Badge>
        ) : (
          <Button onClick={submit}>Submit result</Button>
        )}
      </div>
    </div>
  );
}
