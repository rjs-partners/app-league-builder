export type Fixture = {
  id: string; round: number; teamA: string; teamB: string; date?: string; location?: string;
};
const uid = () => Math.random().toString(36).slice(2,9);

export function generateRoundRobin(teamIds: string[], startISO: string, weeksGap = 1, location?: string): Fixture[] {
  const ids = [...teamIds];
  if (ids.length % 2 === 1) ids.push('BYE');
  const n = ids.length, rounds = n - 1, out: Fixture[] = [];
  for (let r=0; r<rounds; r++) {
    const date = new Date(new Date(startISO).getTime() + r*weeksGap*7*864e5).toISOString();
    for (let i=0; i<n/2; i++) {
      const a = ids[i], b = ids[n-1-i];
      if (a !== 'BYE' && b !== 'BYE') out.push({ id: uid(), round: r+1, teamA: a, teamB: b, date, location });
    }
    const fixed = ids[0], rest = ids.slice(1);
    rest.unshift(rest.pop() as string);
    ids.splice(0, ids.length, fixed, ...rest);
  }
  return out;
}
