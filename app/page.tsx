import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold mb-4">League Builder</h1>
      <Link className="underline" href="/leagues/new">Create a league →</Link>
    </main>
  );
}
