'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NewLeaguePage() {
  const [sport, setSport] = useState<'Padel'|'Tennis'>('Padel');
  const [name, setName] = useState('Autumn Box League');
  const [location, setLocation] = useState('Riverside Padel & Tennis');
  const [start, setStart] = useState<string>(new Date().toISOString().slice(0,10));
  const [end, setEnd] = useState<string>(new Date(Date.now()+28*864e5).toISOString().slice(0,10));
  const [players, setPlayers] = useState<string>('Team A\nTeam B\nTeam C\nTeam D');

  const create = () => {
    const id = Math.random().toString(36).slice(2,9);
    const teams = players.split('\n').map(s=>s.trim()).filter(Boolean);
    const payload = { id, sport, name, location, start, end, teams };
    // temp persistence so refresh keeps it
    localStorage.setItem(`league:${id}`, JSON.stringify(payload));
    window.location.href = `/leagues/${id}`;
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader><CardTitle>Create a League</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Sport</Label>
            <div className="mt-2 inline-flex rounded-xl border p-1">
              {(['Padel','Tennis'] as const).map(s=>(
                <Button key={s} variant={sport===s?'default':'ghost'} onClick={()=>setSport(s)} className="rounded-xl">{s}</Button>
              ))}
            </div>
          </div>
          <div><Label>Name</Label><Input className="mt-2" value={name} onChange={e=>setName(e.target.value)} /></div>
          <div><Label>Location</Label><Input className="mt-2" value={location} onChange={e=>setLocation(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Start</Label><Input className="mt-2" type="date" value={start} onChange={e=>setStart(e.target.value)} /></div>
            <div><Label>End</Label><Input className="mt-2" type="date" value={end} onChange={e=>setEnd(e.target.value)} /></div>
          </div>
          <div>
            <Label>Teams / Players (one per line)</Label>
            <textarea className="mt-2 w-full rounded-xl border border-slate-200 p-2 text-sm" rows={6} value={players} onChange={e=>setPlayers(e.target.value)} />
          </div>
          <Button onClick={create}>Create League</Button>
        </CardContent>
      </Card>
    </main>
  );
}
