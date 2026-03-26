import Link from 'next/link';

export default function RulesPage() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Rules</h1>
        <Link href="/settings" className="text-sm text-gray-400 hover:text-white">Back to settings</Link>
      </div>

      <section className="bg-gray-800 rounded-xl p-6 space-y-3 text-sm text-gray-200 leading-relaxed">
        <h2 className="text-lg font-semibold text-white">Core Objective</h2>
        <p>Gain survival points and outlast opponents. A player can win by reaching high survival points or by being the only player left with health above zero.</p>

        <h2 className="text-lg font-semibold text-white">Turn Flow</h2>
        <p>On your turn, you can draw, play up to three cards, then end turn. Ending turn rotates to the next player and can advance round effects.</p>

        <h2 className="text-lg font-semibold text-white">Card Types</h2>
        <p>Survival: grants survival points and sometimes card draw.</p>
        <p>Disaster: damages one target or all opponents depending on disaster kind.</p>
        <p>Trait: persistent protection against specific disaster types.</p>
        <p>Adapt: protection that is consumed after blocking one disaster.</p>
        <p>Chaos: powerful swings that boost you and pressure everyone else.</p>

        <h2 className="text-lg font-semibold text-white">Bots</h2>
        <p>Bots evaluate leading opponents and prefer disruption before fallback plays.</p>
      </section>
    </main>
  );
}
