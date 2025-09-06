export type Standing = {
  team: string;
  played: number;
  won: number;
  lost: number;
  setsFor: number;
  setsAgainst: number;
  gamesFor: number;
  gamesAgainst: number;
  points: number; // 3 for win (+ optional per-set points if you want later)
};

export type Result = { sets: { a: number; b: number }[]; winner: 'A' | 'B' };
export type Fixture = {
  id: string;
  round: number;
  teamA: string; // team name
  teamB: string; // team name
  date?: string;
  location?: string;
  result?: Result | null;
};

export function computeStandings(teams: string[], fixtures: Fixture[]): Standing[] {
  const table: Record<string, Standing> = Object.fromEntries(
    teams.map((t) => [
      t,
      {
        team: t,
        played: 0,
        won: 0,
        lost: 0,
        setsFor: 0,
        setsAgainst: 0,
        gamesFor: 0,
        gamesAgainst: 0,
        points: 0,
      },
    ])
  );

  for (const f of fixtures) {
    if (!f.result) continue;
    const A = table[f.teamA],
      B = table[f.teamB];
    A.played++;
    B.played++;

    let aSets = 0,
      bSets = 0,
      aGames = 0,
      bGames = 0;
    for (const s of f.result.sets) {
      aGames += s.a;
      bGames += s.b;
      if (s.a > s.b) aSets++;
      else if (s.b > s.a) bSets++;
    }
    A.setsFor += aSets;
    A.setsAgainst += bSets;
    A.gamesFor += aGames;
    A.gamesAgainst += bGames;
    B.setsFor += bSets;
    B.setsAgainst += aSets;
    B.gamesFor += bGames;
    B.gamesAgainst += aGames;

    if (f.result.winner === 'A') {
      A.won++;
      B.lost++;
      A.points += 3;
    } else {
      B.won++;
      A.lost++;
      B.points += 3;
    }
    // If you want per-set points too, add: A.points += aSets; B.points += bSets;
  }

  return Object.values(table).sort(
    (x, y) =>
      y.points - x.points ||
      y.setsFor - y.setsAgainst - (x.setsFor - x.setsAgainst)
  );
}
