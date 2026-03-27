import Link from 'next/link';
import { CARD_GROUPS } from '@/lib/cardCatalog';

export default function RulesPage() {
  const sections = [
    {
      key: 'SURVIVAL',
      title: 'Survival Cards',
      subtitle: 'Gain survival points; some also draw cards or restore health.',
      cards: CARD_GROUPS.SURVIVAL,
    },
    {
      key: 'DISASTER',
      title: 'Disaster Cards',
      subtitle: 'Damage health by disaster kind unless blocked.',
      cards: CARD_GROUPS.DISASTER,
    },
    {
      key: 'POWER',
      title: 'Power Cards',
      subtitle: 'Persistent blockers that stay active after blocking.',
      cards: CARD_GROUPS.POWER,
    },
    {
      key: 'ADAPT',
      title: 'Adapt Cards',
      subtitle: 'One-use blockers consumed when they block.',
      cards: CARD_GROUPS.ADAPT,
    },
    {
      key: 'CHAOS',
      title: 'Chaos Cards',
      subtitle: 'You gain points; all opponents lose 1 health.',
      cards: CARD_GROUPS.CHAOS,
    },
    {
      key: 'ASCENDED',
      title: 'Ascended Cards (Rare)',
      subtitle: 'Powerful tier-based cards (1–5). Some grant potent effects, others are deceptively weak.',
      cards: CARD_GROUPS.ASCENDED,
    },
    {
      key: 'TWIST',
      title: 'Twist Cards (Fate)',
      subtitle: 'One-time per-player blessings, curses, or neutrals that apply when played.',
      cards: CARD_GROUPS.TWIST,
    },
    {
      key: 'CATACLYSM',
      title: 'Cataclysm Cards (Global Catastrophe)',
      subtitle: 'Global disaster cards. Player gains points but takes triple damage; all others take 1 damage.',
      cards: CARD_GROUPS.CATACLYSM,
    },
  ] as const;

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto space-y-6">
      <div className="fe-panel rounded-3xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Rules Atlas</h1>
          <p className="fe-muted text-sm mt-1">Fast reference for turn order, card effects, and combat logic.</p>
        </div>
        <Link href="/settings" className="fe-panel-alt rounded-xl px-4 py-2 text-sm">Back to settings</Link>
      </div>

      <section className="fe-panel rounded-3xl p-6 space-y-3 text-sm text-gray-200 leading-relaxed">
        <h2 className="text-lg font-semibold text-white">Core Objective</h2>
        <p>Gain survival points and outlast opponents. You win by reaching 100 survival points or being the only player with health above 0.</p>

        <h2 className="text-lg font-semibold text-white">Game Setup</h2>
        <p>Each player starts with 5 health and 0 survival points. Draw 5 cards to your hand from safe card types (SURVIVAL, DISASTER, POWER, ADAPT, CHAOS, ASCENDED). Deck shuffles 150 unique cards (300 total with copies). TWIST and CATACLYSM cannot appear in starting hands.</p>

        <h2 className="text-lg font-semibold text-white">Turn Flow</h2>
        <p>On your turn: draw exactly 1 card first, play up to 3 cards, then end turn. Every full table cycle advances round count. Every 3rd round marks global disaster phase.</p>

        <h2 className="text-lg font-semibold text-white">Card Types (8 Total)</h2>
        <div className="space-y-1 ml-4">
          <p><strong>🌱 Survival</strong>: Grants survival points and sometimes card draw or health restoration.</p>
          <p><strong>🌋 Disaster</strong>: Damages one target or all opponents (GLOBAL) depending on disaster kind.</p>
          <p><strong>🛡️ Power</strong>: Persistent protection against specific disaster kinds (stays in play).</p>
          <p><strong>🧬 Adapt</strong>: Protection consumed after blocking one matching disaster.</p>
          <p><strong>⚡ Chaos</strong>: Active player gains points; all opponents lose 1 health.</p>
          <p><strong>✨ Ascended</strong>: Rare tier 1–5 cards with special properties. Powerful or mundane—never predictable!</p>
          <p><strong>🌀 Twist</strong>: Fate-based effects applied when drawn (blessings, curses, neutrals). Modify the match state instantly.</p>
          <p><strong>💀 Cataclysm</strong>: You gain survival points but take triple damage (−3 health). All other players take 1 damage. Risky power plays!</p>
        </div>

        <h2 className="text-lg font-semibold text-white">Health & Status</h2>
        <p>You start at 5 health. Disaster cards damage health (can go to 0). Survival cards may restore health (+gainHealth property). When health reaches 0, you&apos;re out of play.</p>

        <h2 className="text-lg font-semibold text-white">Twist And Cataclysm</h2>
        <p>TWIST and CATACLYSM do not go into starting hands. If you draw one during the game, it is forced down immediately. TWIST only hits the player who drew it. CATACLYSM hits the player who drew it the hardest, then damages everyone else around them.</p>

        <h2 className="text-lg font-semibold text-white">Color Blocking</h2>
        <p>Some Twist effects block card colors in your hand—those cards appear grayed out and cannot be played until the effect expires.</p>

        <h2 className="text-lg font-semibold text-white">Bots</h2>
        <p>Bots draw and then play up to 3 cards using this priority: Disaster → Chaos → Ascended → Survival → Adapt → Power. They target the leading opponent with Disaster cards.</p>
      </section>

      {sections.map((section) => (
        <section key={section.key} className="fe-panel rounded-3xl p-6 space-y-3 text-sm text-gray-200">
          <h2 className="text-lg font-semibold text-white">{section.title} ({section.cards.length})</h2>
          <p className="text-gray-300">{section.subtitle}</p>

          <div className="grid sm:grid-cols-2 gap-2">
            {section.cards.map((card) => (
              <div key={card.id} className="fe-panel-alt rounded-xl px-3 py-2">
                <p className="font-semibold text-white">
                  {card.name}
                  {card.tier && <span className="ml-1 text-xs text-amber-300">T{card.tier}</span>}
                </p>
                <p className="text-xs text-gray-400">ID: {card.id}</p>
                <p className="text-xs text-gray-300">
                  {card.pointsDelta !== 0 ? `Points/Health Delta: ${card.pointsDelta}` : 'No direct points delta'}
                  {card.gainHealth ? ` • Heal: +${card.gainHealth}` : ''}
                  {card.drawCount ? ` • Draw: ${card.drawCount}` : ''}
                  {card.disasterKind ? ` • Disaster: ${card.disasterKind}` : ''}
                  {card.blocksDisaster ? ` • Blocks: ${card.blocksDisaster}` : ''}
                </p>
                {card.effect && (
                  <p className="text-xs text-purple-300 font-semibold">Effect: {card.effect}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
