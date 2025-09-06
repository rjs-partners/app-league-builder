'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  PlayCircle,
  Plus,
  Share2,
  Target,
  Trophy,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function LeagueBuilderPrototype() {
  const [sport, setSport] = useState<'Padel' | 'Tennis'>('Padel');
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([
    { id: 't1', name: 'Team Alpha' },
    { id: 't2', name: 'Team Beta' },
  ]);

  // Score state
  const [s1a, setS1a] = useState<number | ''>('');
  const [s1b, setS1b] = useState<number | ''>('');
  const [s2a, setS2a] = useState<number | ''>('');
  const [s2b, setS2b] = useState<number | ''>('');
  const [s3a, setS3a] = useState<number | ''>('');
  const [s3b, setS3b] = useState<number | ''>('');

  const fixtures = [
    {
      id: 'f1',
      home: 'Team Alpha',
      away: 'Team Beta',
      date: '2025-09-10',
      location: 'London Padel Club',
      result: null as
        | null
        | { sets: { a: number; b: number }[]; winner: 'A' | 'B' },
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <header className="flex items-center gap-2">
        <Trophy className="h-6 w-6" />
        <span className="text-lg font-semibold">League Builder</span>
        <Badge variant="secondary" className="ml-2">
          MVP
        </Badge>
      </header>

      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Teams */}
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
            </CardHeader>
            <CardContent>
              {teams.map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border p-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{i + 1}</Badge>
                    <span>{t.name}</span>
                  </div>
                  <Badge>
                    {sport === 'Padel' ? 'Doubles' : 'Singles/Doubles'}
                  </Badge>
                </div>
              ))}
              <Button variant="ghost" className="mt-4">
                <Plus className="h-4 w-4 mr-1" /> Add Team
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fixtures */}
        <TabsContent value="fixtures">
          <Card>
            <CardHeader>
              <CardTitle>Fixtures</CardTitle>
            </CardHeader>
            <CardContent>
              {fixtures.map((fx) => (
                <div
                  key={fx.id}
                  className="p-3 border rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">
                      {fx.home} vs {fx.away}
                    </div>
                    <div className="text-sm text-slate-500">
                      {fx.date} • {fx.location}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enter Score
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Match Result</CardTitle>
            </CardHeader>
            <CardContent>
              {fixtures[0].result ? (
                <Badge variant="success" className="rounded-xl">
                  Result:{' '}
                  {fixtures[0].result.sets
                    .map((s) => `${s.a}-${s.b}`)
                    .join(', ')}{' '}
                  •{' '}
                  {fixtures[0].result.winner === 'A'
                    ? 'Winner: Home'
                    : 'Winner: Away'}
                </Badge>
              ) : (
                <div className="flex flex-col gap-2">
                  {([
                    [s1a, setS1a, s1b, setS1b],
                    [s2a, setS2a, s2b, setS2b],
                    [s3a, setS3a, s3b, setS3b],
                  ] as [
                    number | '',
                    React.Dispatch<React.SetStateAction<number | ''>>,
                    number | '',
                    React.Dispatch<React.SetStateAction<number | ''>>
                  ][]).map((row, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <Input
                        className="w-12"
                        inputMode="numeric"
                        placeholder="6"
                        value={row[0]}
                        onChange={(e) =>
                          row[1](
                            e.target.value === ''
                              ? ''
                              : Number(e.target.value)
                          )
                        }
                      />
                      <span className="text-slate-400">-</span>
                      <Input
                        className="w-12"
                        inputMode="numeric"
                        placeholder="4"
                        value={row[2]}
                        onChange={(e) =>
                          row[3](
                            e.target.value === ''
                              ? ''
                              : Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  ))}
                  <Button variant="success" className="mt-2">
                    Submit Result
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
