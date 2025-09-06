'use client';
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Check, ChevronRight, ClipboardList, PlayCircle, Plus, Share2, Target, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/**
 * League Builder — Single-file clickable prototype
 * - Sport selection (Padel/Tennis)
 * - Create league (name, dates, locations)
 * - Invite players (mock)
 * - Auto-generate fixtures (round robin)
 * - Score entry (set-by-set)
 * - Live table & schedule
 *
 * Notes
 * - No backend: all state is local to the component.
 * - Styling assumes Tailwind + shadcn/ui available.
 */

// Types
 type Sport = "Padel" | "Tennis";
 type Team = { id: string; name: string };
 type Fixture = {
  id: string;
  round: number;
  teamA: string; // team id
  teamB: string; // team id
  date?: string; // ISO
  location?: string;
  result?: {
    sets: Array<{ a: number; b: number }>; // e.g., [{a:6,b:4},{a:3,b:6},{a:10,b:8}] when MTB
    winner?: "A" | "B";
    status?: "Confirmed" | "Pending";
  };
 };

 type StandingsRow = {
  teamId: string;
  played: number;
  won: number;
  lost: number;
  setsFor: number;
  setsAgainst: number;
  gamesFor: number;
  gamesAgainst: number;
  points: number;
 };

// Helpers
const uid = () => Math.random().toString(36).slice(2, 9);

function circleMethodPairings(teamIds: string[]) {
  // Single round-robin; if odd count, add bye
  const ids = [...teamIds];
  const hasBye = ids.length % 2 === 1;
  if (hasBye) ids.push("BYE");
  const n = ids.length;
  const rounds = n - 1;
  const pairings: Array<Array<[string, string]>> = [];
  for (let r = 0; r < rounds; r++) {
    const roundPairs: Array<[string, string]> = [];
    for (let i = 0; i < n / 2; i++) {
      const a = ids[i];
      const b = ids[n - 1 - i];
      if (a !== "BYE" && b !== "BYE") roundPairs.push([a, b]);
    }
    pairings.push(roundPairs);
    // rotate
    const fixed = ids[0];
    const rest = ids.slice(1);
    rest.unshift(rest.pop() as string);
    ids.splice(0, ids.length, fixed, ...rest);
  }
  return pairings;
}

function computeStandings(teams: Team[], fixtures: Fixture[]): StandingsRow[] {
  const base: Record<string, StandingsRow> = Object.fromEntries(
    teams.map((t) => [t.id, { teamId: t.id, played: 0, won: 0, lost: 0, setsFor: 0, setsAgainst: 0, gamesFor: 0, gamesAgainst: 0, points: 0 }])
  );
  for (const f of fixtures) {
    if (!f.result || f.result.status !== "Confirmed" || !f.result.winner) continue;
    const a = base[f.teamA];
    const b = base[f.teamB];
    a.played++; b.played++;
    let aSets = 0, bSets = 0, aGames = 0, bGames = 0;
    for (const s of f.result.sets) { aGames += s.a; bGames += s.b; if (s.a > s.b) aSets++; else bSets++; }
    a.setsFor += aSets; a.setsAgainst += bSets; b.setsFor += bSets; b.setsAgainst += aSets;
    a.gamesFor += aGames; a.gamesAgainst += bGames; b.gamesFor += bGames; b.gamesAgainst += aGames;
    if (f.result.winner === "A") { a.won++; b.lost++; a.points += 3; }
    else { b.won++; a.lost++; b.points += 3; }
    // Bonus: +1 per set won (config example)
    a.points += aSets; b.points += bSets;
  }
  return Object.values(base).sort((x, y) => y.points - x.points || (y.setsFor / Math.max(1, y.setsAgainst) - x.setsFor / Math.max(1, x.setsAgainst)));
}

export default function LeagueBuilderPrototype() {
  const [sport, setSport] = useState<Sport>("Padel");
  const [leagueName, setLeagueName] = useState("Autumn Box League");
  const [location, setLocation] = useState("Riverside Padel & Tennis");
  const [seasonStart, setSeasonStart] = useState<string>(new Date().toISOString().slice(0, 10));
  const [seasonEnd, setSeasonEnd] = useState<string>(new Date(Date.now() + 1000*60*60*24*35).toISOString().slice(0, 10));
  const [teams, setTeams] = useState<Team[]>([
    { id: uid(), name: "Team A" },
    { id: uid(), name: "Team B" },
    { id: uid(), name: "Team C" },
    { id: uid(), name: "Team D" },
  ]);
  const [newTeamName, setNewTeamName] = useState("");
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [publicLeague, setPublicLeague] = useState(true);
  const [notes, setNotes] = useState("");

  const standings = useMemo(() => computeStandings(teams, fixtures), [teams, fixtures]);

  const generateFixtures = () => {
    const pairings = circleMethodPairings(teams.map((t) => t.id));
    const start = new Date(seasonStart);
    const weeks = pairings.length;
    const out: Fixture[] = [];
    pairings.forEach((roundPairs, r) => {
      const roundDate = new Date(start.getTime() + r * 7 * 24 * 3600 * 1000);
      const iso = roundDate.toISOString();
      roundPairs.forEach(([a, b]) => out.push({ id: uid(), round: r + 1, teamA: a, teamB: b, date: iso, location }));
    });
    setFixtures(out);
  };

  const addTeam = () => {
    if (!newTeamName.trim()) return;
    setTeams((t) => [...t, { id: uid(), name: newTeamName.trim() }]);
    setNewTeamName("");
  };

  const recordResult = (fixtureId: string, sets: Array<{a:number;b:number}>, winner: "A"|"B") => {
    setFixtures((fs) => fs.map((f) => f.id === fixtureId ? { ...f, result: { sets, winner, status: "Confirmed" } } : f));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            <span className="text-lg font-semibold">League Builder</span>
            <Badge variant="secondary" className="ml-2">MVP</Badge>
          </div>
          <div className="text-sm text-slate-500">Brand: clean • modern • minimal</div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:p-8">
        <Card className="mb-6">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-2xl">Create a League</CardTitle>
            <div className="flex items-center gap-3">
              <Switch checked={publicLeague} onCheckedChange={setPublicLeague} />
              <span className="text-sm text-slate-600">{publicLeague ? "Public league" : "Invite only"}</span>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Sport</Label>
              <div className="mt-2 inline-flex rounded-2xl border p-1">
                {(["Padel","Tennis"] as Sport[]).map((s) => (
                  <Button key={s} variant={sport===s?"default":"ghost"} className="rounded-xl" onClick={() => setSport(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>League name</Label>
              <Input className="mt-2" value={leagueName} onChange={(e)=>setLeagueName(e.target.value)} />
            </div>
            <div>
              <Label>Home location</Label>
              <Input className="mt-2" value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="Club / venue" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Season start</Label>
                <Input className="mt-2" type="date" value={seasonStart} onChange={(e)=>setSeasonStart(e.target.value)} />
              </div>
              <div>
                <Label>Season end</Label>
                <Input className="mt-2" type="date" value={seasonEnd} onChange={(e)=>setSeasonEnd(e.target.value)} />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Notes (rules, scoring)</Label>
              <Textarea className="mt-2" rows={2} value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder={`${sport} • Best of 3 sets • 3 pts win • +1 pt per set`} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teams.map((t, i) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border p-2">
                    <div className="flex items-center gap-2"><Badge variant="outline">{i+1}</Badge><span>{t.name}</span></div>
                    <Badge>{sport === "Padel" ? "Doubles" : "Singles/Doubles"}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input placeholder="Add team (or player)" value={newTeamName} onChange={(e)=>setNewTeamName(e.target.value)} />
                <Button onClick={addTeam}><Plus className="mr-1 h-4 w-4"/>Add</Button>
              </div>
              <p className="mt-3 text-xs text-slate-500">Share invite link to let captains rename their teams after joining.</p>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5"/> Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={generateFixtures}><ClipboardList className="mr-2 h-4 w-4"/>Auto-generate fixtures</Button>
                <Button variant="secondary"><Share2 className="mr-2 h-4 w-4"/>Invite via link</Button>
              </div>

              <div className="mt-4 space-y-3">
                {fixtures.length === 0 && (
                  <div className="rounded-xl border p-4 text-slate-500">No fixtures yet. Click <em>Auto-generate fixtures</em> to create a round-robin.</div>
                )}
                {fixtures.map((f) => (
                  <FixtureRow key={f.id} fixture={f} teams={teams} onResult={recordResult} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table & Insights */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5"/> Standings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left text-slate-500">
                      <th className="py-2 pr-4">Team</th>
                      <th className="py-2">P</th>
                      <th className="py-2">W</th>
                      <th className="py-2">L</th>
                      <th className="py-2">Sets</th>
                      <th className="py-2">Games</th>
                      <th className="py-2 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row) => {
                      const team = teams.find((t) => t.id === row.teamId)!;
                      return (
                        <tr key={row.teamId} className="border-t">
                          <td className="py-2 pr-4 font-medium">{team.name}</td>
                          <td className="py-2">{row.played}</td>
                          <td className="py-2">{row.won}</td>
                          <td className="py-2">{row.lost}</td>
                          <td className="py-2">{row.setsFor}:{row.setsAgainst}</td>
                          <td className="py-2">{row.gamesFor}:{row.gamesAgainst}</td>
                          <td className="py-2 text-right font-semibold">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5"/> What’s next</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4"/> Add availability capture & iCal export</li>
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4"/> Dual confirmation + disputes flow</li>
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4"/> Public league page with shareable table</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function FixtureRow({ fixture, teams, onResult }: { fixture: Fixture; teams: Team[]; onResult: (id:string, sets:Array<{a:number;b:number}>, winner:"A"|"B")=>void }) {
  const a = teams.find((t) => t.id === fixture.teamA)!;
  const b = teams.find((t) => t.id === fixture.teamB)!;
  const date = fixture.date ? new Date(fixture.date) : null;
  const [s1a, setS1a] = useState<number | "">("");
  const [s1b, setS1b] = useState<number | "">("");
  const [s2a, setS2a] = useState<number | "">("");
  const [s2b, setS2b] = useState<number | "">("");
  const [s3a, setS3a] = useState<number | "">("");
  const [s3b, setS3b] = useState<number | "">("");

  const submit = () => {
    const sets = [
      typeof s1a === "number" && typeof s1b === "number" ? { a: s1a, b: s1b } : null,
      typeof s2a === "number" && typeof s2b === "number" ? { a: s2a, b: s2b } : null,
      typeof s3a === "number" && typeof s3b === "number" ? { a: s3a, b: s3b } : null,
    ].filter(Boolean) as Array<{a:number;b:number}>;
    if (sets.length === 0) return;
    const aSets = sets.filter((s) => s.a > s.b).length;
    const bSets = sets.filter((s) => s.b > s.a).length;
    const winner = aSets > bSets ? "A" : "B";
    onResult(fixture.id, sets, winner);
  };

  return (
    <div className="grid grid-cols-1 items-center gap-3 rounded-xl border p-3 md:grid-cols-12">
      <div className="md:col-span-4">
        <div className="font-medium">{a.name} <span className="text-slate-400">vs</span> {b.name}</div>
        <div className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3"/> {date?.toLocaleDateString()} • {fixture.location || "TBC"}</div>
      </div>

      <div className="md:col-span-5">
        {fixture.result ? (
          <Badge variant="success" className="rounded-xl">Result: {fixture.result.sets.map(s=>`${s.a}-${s.b}`).join(", ")} • {fixture.result.winner==="A"?"Winner: Home":"Winner: Away"}</Badge>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            {[ [s1a,setS1a,s1b,setS1b], [s2a,setS2a,s2b,setS2b], [s3a,setS3a,s3b,setS3b] ].map((row, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <Input className="w-12" inputMode="numeric" placeholder="6" value={row[0] as any} onChange={(e)=>row[1](e.target.value===""?"":Number(e.target.value))} />
                <span className="text-slate-400">-</span>
                <Input className="w-12" inputMode="numeric" placeholder="4" value={row[2] as any} onChange={(e)=>row[3](e.target.value===""?"":Number(e.target.value))} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:col-span-3 md:justify-end">
        {fixture.result ? (
          <Badge variant="outline" className="rounded-xl"><Check className="mr-1 h-3 w-3"/>Confirmed</Badge>
        ) : (
          <Button onClick={submit}><PlayCircle className="mr-2 h-4 w-4"/>Submit result</Button>
        )}
      </div>
    </div>
  );
}
