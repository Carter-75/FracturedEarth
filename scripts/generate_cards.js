const fs = require('fs');
const path = require('path');

const cardRawData = `### 🟢 SURVIVAL PROTOCOLS (70 Cards)
- Hydroponic Bay – Survival – +4 Points; maximizes yield when Health is 5.  
- Deep Core Drill – Survival – +3 Points; doubles output (6) if Health ≤3.  
- Bunker Shelter – Survival – +2 Health.  
- Bio-Dome – Survival – +2 Health if first card played this turn.  
- Energy Siphon – Survival – +5 Points; +1 Pt for each pinned Power card.  
- Scavenged Tech – Survival – Draw 2 cards.  
- Archive 01 – Survival – Draw 3 cards.  
- Nano-Forge – Survival – Upgrade one pinned Power card (temporarily doubles effect).  
- Solar Collector – Survival – +3 Points; if next card is Chaos, negate effect.  
- Medic Drone – Survival – Heal 1 Health and prevent next point loss.  
- Hydro Filter – Survival – Block first Disaster damage this turn.  
- Quantum Harvester – Survival – +4 Points; discard one card to double points.  
- Oasis Reservoir – Survival – +2 Health; draw 1 card.  
- Terraform Rig – Survival – +3 Points; if hand <3 cards, draw 1.  
- Bio-Reactor – Survival – +5 Points; reduce incoming Disaster effect by 1.  
- Nutrient Mixer – Survival – +2 Points; discard 1 to draw 2.  
- Automated Farm – Survival – +3 Health if no other Survival card played.  
- Energy Nexus – Survival – +3 Points; +1 if Chaos card played previously.  
- Lifesupport Array – Survival – +1 Health per pinned Adapt card.  
- Nano-Med Kit – Survival – Heal 2 Health; discard after use.  
- Neural Interface – Survival – Draw 1; gain 1 point.  
- Micro Reactor – Survival – +2 Points; prevent next negative card effect.  
- Data Uplink – Survival – Draw 2; opponent discards 1.  
- Pulse Generator – Survival – +3 Points; can redirect next Disaster.  
- Gravity Well – Survival – Prevent opponent from drawing next card.  
- Subsurface Driller – Survival – +3 Points; can steal 1 point from target.  
- Power Conduit – Survival – +2 Points; hand limit temporarily +1.  
- Shielded Habitat – Survival – +2 Health; protects next turn.  
- Rescue Beacon – Survival – Draw 1; revive 1 Health if needed.  
- Life Pod – Survival – +1 Health; next Disaster negated.  
- Hydroponic Lab – Survival – +3 Points; discard 1 to draw 2.  
- Thermal Plant – Survival – +2 Points; block Chaos effect once.  
- Solar Panel Array – Survival – +3 Points; draw 1 card if hand <5.  
- Wind Turbine – Survival – +2 Points; temporary hand +1.  
- Water Purifier – Survival – Heal 1 Health; prevent next Catac effect.  
- Emergency Shelter – Survival – +2 Health; can block next Disaster.  
- Micro Greenhouse – Survival – +3 Points; discard 1 to draw 1.  
- Energy Core – Survival – +5 Points; reset hand to 5 if lower.  
- Repair Drone – Survival – Heal 1 Health; discard after use.  
- Life Support Matrix – Survival – +2 Health; prevent first Disaster next turn.  
- Nano Farm – Survival – +3 Points; +1 if hand ≤3.  
- Resource Cache – Survival – Draw 1; +2 Points.  
- Hydro Plant – Survival – +2 Points; block next Disaster.  
- Oxygen Generator – Survival – +2 Health; discard 1 to draw 1.  
- Automated Medic – Survival – +1 Health; prevent next Catac effect.  
- Fusion Reactor – Survival – +4 Points; discard 1 card to gain +2 Points.  
- Subsurface Lab – Survival – Draw 2; +1 Health.  
- Energy Collector – Survival – +3 Points; can negate one Chaos card.  
- Water Reservoir – Survival – Heal 2 Health; discard after use.  
- Mineral Extractor – Survival – +2 Points; next Catac effect negated.  
- Bio-Recovery Pod – Survival – +1 Health; draw 1 card.  
- AI Med Bay – Survival – +2 Health; prevent one negative effect.  
- Resource Drone – Survival – Draw 2; discard 1 if hand >5.  
- Solar Array – Survival – +3 Points; block one disaster.  
- Energy Field – Survival – +2 Points; redirect next negative card.  
- Life Support Hub – Survival – +1 Health; +1 if Chaos played last turn.  
- Nano Repair Kit – Survival – Heal 1; discard 1.  
- Hydro Farm – Survival – +3 Points; draw 1 if hand ≤4.  
- Power Booster – Survival – +2 Points; block first Catac.  
- Emergency Reactor – Survival – +4 Points; discard 1 to draw 2.  
- Medic Pod – Survival – Heal 2 Health; prevent one negative effect.  
- Resource Array – Survival – +3 Points; discard 1 to draw 1.  
- Bio Lab – Survival – +2 Health; draw 1 if hand ≤3.  
- Solar Reactor – Survival – +4 Points; temporary hand +1.  
- Oxygen Pod – Survival – +1 Health; redirect next negative card.  
- Repair Hub – Survival – Heal 1 Health; discard 1 card.  
- Nano Shield – Survival – +2 Points; block first Catac.  
- Hydration Station – Survival – +2 Health; draw 1 card.  
- Energy Grid – Survival – +3 Points; discard 1 to draw 1.  
- Micro Medbay – Survival – Heal 1; prevent next Disaster.  
- Bio Reactor Core – Survival – +4 Points; discard 1 to gain +1 Health.  
- AI Field Med – Survival – +2 Health; block one Catac.  
- Hydro Nexus – Survival – +3 Points; discard 1 to draw 1.  
- Resource Depot – Survival – Draw 2; +1 Point.  
- Fusion Plant – Survival – +5 Points; hand temporary +1.  
- Life Hub – Survival – Heal 1 Health; prevent next Disaster.  

### 🔴 DISASTER PROTOCOLS (30 Cards)
- Mega-Quake – Disaster – All opponents lose 3 Health; can be blocked by Kinetic Dampener.  
- Solar Scorch – Disaster – Target loses 4 Points; blocked by Thermal Layer.  
- Viral Strain – Disaster – Target cannot regain Health next turn; blocked by Stasis Field.  
- Abyssal Surge – Disaster – All opponents lose 2 Health; blocked by Hydro-Gate.  
- Void Meteor – Disaster – All opponents lose 5 Points; cannot be blocked.  
- Shatter Vault – Disaster – Destroy one pinned Power card of target.  
- Acid Rain – Disaster – Target loses 1 Point per turn for 3 turns; blocked by Hydro-Gate.  
- Absolute Zero – Disaster – Target loses 5 Health; cannot be blocked.  
- Plasma Blast – Disaster – Target loses 3 Points; blocked by Thermal Layer.  
- Toxic Cloud – Disaster – Target discards 2 cards; blocked by Stasis Field.  
- Sandstorm – Disaster – Skip target’s next turn; blocked by Kinetic Dampener.  
- Electromagnetic Pulse – Disaster – All pinned Power cards disabled for 1 turn.  
- Gravity Collapse – Disaster – All opponents discard 1 card; cannot be blocked.  
- Radiation Leak – Disaster – Target loses 2 Health; next Catac effect negated.  
- Storm Surge – Disaster – All players lose 2 Points; blocked by Hydro-Gate.  
- Magnetic Rift – Disaster – Swap target’s hand with discard pile; blocked by Kinetic Dampener.  
- Firestorm – Disaster – Target loses 3 Health; blocked by Thermal Layer.  
- Contamination – Disaster – Target cannot play Survival cards next turn; blocked by Stasis Field.  
- Volcanic Eruption – Disaster – All opponents lose 3 Health; cannot be blocked.  
- Ice Barrage – Disaster – Target loses 2 Health; blocked by Stasis Field.  
- Quicksand – Disaster – Target skips next draw; blocked by Kinetic Dampener.  
- Lightning Strike – Disaster – Target loses 3 Points; blocked by Thermal Layer.  
- Biohazard – Disaster – Target discards 1 card; blocked by Stasis Field.  
- Tidal Wave – Disaster – All opponents discard 1 card; blocked by Hydro-Gate.  
- Sand Trap – Disaster – Target loses 2 Points; blocked by Kinetic Dampener.  
- Acid Fog – Disaster – Target loses 1 Health each turn for 2 turns; blocked by Stasis Field.  
- Corrosive Gas – Disaster – Target discards 2 cards; cannot be blocked.  
- Earth Collapse – Disaster – All opponents lose 2 Health; blocked by Kinetic Dampener.  
- Firestorm Flare – Disaster – Target loses 4 Points; blocked by Thermal Layer.  
- Plasma Surge – Disaster – Target discards 1 card; all Survival cards negated this turn.  

### 🔵 POWER PROTOCOLS (20 Cards)
- Kinetic Dampener – Power – Blocks first Earth Disaster; pinned until destroyed.  
- Thermal Layer – Power – Blocks first Fire Disaster; pinned until destroyed.  
- Stasis Field – Power – Blocks first Bio Disaster; pinned until destroyed.  
- Hydro-Gate – Power – Blocks first Hydro Disaster; pinned until destroyed.  
- Magnetic Shield – Power – Redirects first Chaos or Disaster card; pinned.  
- Energy Amplifier – Power – +1 Point each turn while pinned.  
- Structural Matrix – Power – Prevent 1 Health loss per turn.  
- Defense Node – Power – Blocks one Catac effect; discarded if used.  
- Gravity Stabilizer – Power – Prevent turn skip effects.  
- Fire Containment – Power – Blocks next Fire Disaster; pinned.  
- Bio-Containment – Power – Blocks next Bio Disaster; pinned.  
- Aqua Barrier – Power – Blocks next Hydro Disaster; pinned.  
- Energy Buffer – Power – +1 Point per Survival card played.  
- Shield Generator – Power – Prevents next Catac negative effect.  
- Nano Barrier – Power – Redirect one Disaster to another target.  
- Reflex Array – Power – Draw 1 card when pinned.  
- Resource Stabilizer – Power – Block next point loss.  
- Temporal Anchor – Power – Prevents next turn order change.  
- Power Grid – Power – +2 Points if hand ≤3.  
- Vital Core – Power – Heal 1 Health each turn.  

### 🟡 ADAPT PROTOCOLS (20 Cards)
- Reflex Coil – Adapt – Blocks Earthquake; draw 1 card.  
- Shadow Step – Adapt – Blocks Wildfire; draw 1 card.  
- Phase Shift – Adapt – Evade next high-tier disaster.  
- Emergency Override – Adapt – Cancel one Disaster card targeting you.  
- Nano Patch – Adapt – Heal 1 Health; discarded after use.  
- Temporal Shift – Adapt – Skip your turn to negate Catac effect.  
- Surge Capacitor – Adapt – +2 Points if used immediately after Survival card.  
- Shield Patch – Adapt – Blocks next negative card effect; discarded after use.  
- Repair Module – Adapt – Restore 1 Health; discard after use.  
- Energy Flux – Adapt – Convert Disaster loss into Points.  
- Quantum Dodge – Adapt – Evade next Chaos effect.  
- Bio Shield – Adapt – Block 1 Health loss from Disaster.  
- Chaos Repeater – Adapt – Redirect Chaos effect to another player.  
- Protective Field – Adapt – Block next negative effect; discarded.  
- Emergency Medkit – Adapt – Heal 2 Health; discard after use.  
- Resource Stabilizer – Adapt – +1 Point for each Survival card pinned.  
- Safety Override – Adapt – Cancel one Catac card.  
- Nano Barrier – Adapt – Redirect next negative card.  
- Temporal Shield – Adapt – Prevent turn skip or reverse.  
- Evacuation Protocol – Adapt – Avoid next Disaster effect.  

### 🟣 CHAOS PROTOCOLS (20 Cards)
- Orbital Strike – Chaos – +3 Points; all others lose 1 Health.  
- Scavenger Raid – Chaos – Take 1 card from discard pile.  
- Grand Theft – Chaos – Steal 5 Points from a target.  
- Health for Points – Chaos – Lose 1 Health for +10 Points.  
- Neural Spike – Chaos – Confuse opponent; skip their next turn.  
- Temporal Distortion – Chaos – Reverse turn order until end of round.  
- Point Flux – Chaos – Randomly add/remove 1–5 Points from each player.  
- Card Storm – Chaos – Shuffle all piles into deck.  
- Resource Surge – Chaos – Draw 3 cards; discard 1.  
- Energy Collapse – Chaos – Lose 2 Points; opponents gain 1 each.  
- Rule Break – Chaos – Ignore next rule of your choice.  
- Global Shakeup – Chaos – Redistribute all Points equally.  
- Health Gamble – Chaos – Roll dice; gain/lose 1–3 Health.  
- Instant Swap – Chaos – Swap hands with a target player.  
- Wild Mutation – Chaos – Randomly swap pinned Power or Adapt cards.  
- Cataclysm Redirect – Chaos – Redirect one Catac card.  
- Draw Flux – Chaos – Everyone draws 1 card.  
- Survival Override – Chaos – All Survival cards +1 Point this turn.  
- Catac Amplifier – Chaos – Next Catac card effect doubled.  
- Temporal Shuffle – Chaos – Reshuffle next turn order randomly.  

### ✨ ASCENDED PROTOCOLS (20 Cards)
- Phoenix Rebirth – Ascended Tier 1 – Revive to 2 Health when reaching 0.  
- Chrono Echo – Ascended Tier 1 – Repeat last Survival card effect.  
- Apex Predator – Ascended Tier 3 – Steal next draw phase from opponent.  
- Omega Protocol – Ascended Tier 5 – +15 Points in one turn.  
- Void Mastery – Ascended Tier 5 – Swap entire hand with opponent.  
- Singularity – Ascended Tier 5 – Reset all players to 0 Points.  
- Time Paradox – Ascended Tier 5 – Reverse turn order of match.  
- Quantum Shift – Ascended Tier 4 – Swap two opponents’ pinned Power cards.  
- Energy Convergence – Ascended Tier 4 – Draw 5 cards; discard 2.  
- Life Nexus – Ascended Tier 3 – Heal 3 Health instantly.  
- Chaos Engine – Ascended Tier 3 – Play two Chaos cards immediately.  
- Adaptive Ascension – Ascended Tier 2 – Upgrade one Adapt card for double effect.  
- Temporal Rewind – Ascended Tier 4 – Undo last turn of any player.  
- Bio Ascendancy – Ascended Tier 2 – Prevent all Health loss for one turn.  
- Power Overload – Ascended Tier 3 – All pinned Power cards gain +2 Points.  
- Survival Apex – Ascended Tier 2 – All Survival cards +1 Point this turn.  
- Cataclysm Override – Ascended Tier 5 – Cancel next Catac effect globally.  
- Event Manipulator – Ascended Tier 4 – Redirect any Twist or Catac card.  
- Strategic Reposition – Ascended Tier 2 – Swap two opponents’ hands.  
- Ultimate Nexus – Ascended Tier 5 – Draw 5, gain 5 Health, +10 Points.  

### 🌀 TWIST CARDS (20 Cards)
- Blessing of Unity – Twist – Everyone draws 3 cards.  
- Risk Factor – Twist – 50/50 chance gain/lose 3 Points.  
- Stasis Lock – Twist – Skip your next turn.  
- Luck Surge – Twist – Draw 2 cards; +2 Points.  
- Minor Luck – Twist – Gain 5 Points.  
- Reverse Trick – Twist – Reverse turn order for 1 round.  
- Extra Hand – Twist – Temporarily increase max hand to 6.  
- Self-Swap – Twist – Swap two of your own cards.  
- Quick Draw – Twist – Draw 1 card immediately.  
- Energy Boost – Twist – +3 Points; only affects drawer.  
- Health Spike – Twist – +1 Health; cannot exceed 5.  
- Card Exchange – Twist – Swap 1 card with discard.  
- Safety Net – Twist – Prevent next negative card effect.  
- Minor Shuffle – Twist – Shuffle your hand; draw 1.  
- Lucky Rebound – Twist – Return one discarded card to hand.  
- Bonus Action – Twist – Play an extra card this turn.  
- Turn Skip – Twist – Skip target player’s next turn.  
- Energy Draw – Twist – Draw 2 cards; discard 1.  
- Point Spike – Twist – +5 Points; only drawer affected.  
- Card Rebound – Twist – Return a played card from discard to hand.  

### 💀 CATACLYSM CARDS (20 Cards)
- The Apocalypse – Catac – +10 Points, strike all players; discard immediately.  
- Plague of Misfortune – Catac – Target loses 5 Health; discard immediately.  
- Black Hole – Catac – Swap hand with discard pile; discard.  
- Wild Fire – Catac – All opponents lose 3 Points; discard.  
- Curse of Delay – Catac – Skip next turn; discard.  
- Instant Trap – Catac – Any player draws extra card; discard.  
- Energy Drain – Catac – Lose 3 Points; discard.  
- Structural Collapse – Catac – Target loses pinned Power; discard.  
- Viral Outbreak – Catac – Target loses 2 Health; discard.  
- Gravity Rift – Catac – All hands shuffled; discard.  
- Acid Spill – Catac – Target loses 2 Points; discard.  
- Temporal Collapse – Catac – Skip next 2 draws; discard.  
- Resource Failure – Catac – Discard 2 Survival cards; discard.  
- Firebreak – Catac – Target cannot play Fire Survival card next turn; discard.  
- Flood Surge – Catac – Target loses 3 Points; discard.  
- Bio Contagion – Catac – All opponents lose 1 Health; discard.  
- Magnetic Storm – Catac – Swap pinned Power with opponent; discard.  
- Cataclysm Pulse – Catac – All discard piles shuffled; discard.  
- Sudden Quake – Catac – Target skips next action; discard.  
- Void Rift – Catac – Draw 1, lose 1 Health; discard.  
`;

function parseCards(data) {
  const sections = data.split('###').filter(s => s.trim() !== '');
  const result = {
    SURVIVAL: [],
    DISASTER: [],
    POWER: [],
    ADAPT: [],
    CHAOS: [],
    ASCENDED: [],
    TWIST: [],
    CATACLYSM: []
  };

  sections.forEach(section => {
    const lines = section.split('\n').filter(l => l.trim() !== '');
    const header = lines[0].toUpperCase();
    let type = '';
    if (header.includes('SURVIVAL')) type = 'SURVIVAL';
    else if (header.includes('DISASTER')) type = 'DISASTER';
    else if (header.includes('POWER')) type = 'POWER';
    else if (header.includes('ADAPT')) type = 'ADAPT';
    else if (header.includes('CHAOS')) type = 'CHAOS';
    else if (header.includes('ASCENDED')) type = 'ASCENDED';
    else if (header.includes('TWIST')) type = 'TWIST';
    else if (header.includes('CATACLYSM')) type = 'CATACLYSM';

    if (!type) {
        console.warn('Unknown type for section:', header);
        return;
    }

    lines.slice(1).forEach(line => {
      const match = line.match(/- (.*) – (.*) – (.*)/);
      if (match) {
        const name = match[1].trim();
        const rawType = match[2].trim();
        const description = match[3].trim();
        
        const card = {
          id: type.toLowerCase() + "_" + name.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, ''),
          name: name,
          type: type,
          pointsDelta: 0,
          drawCount: 0,
          description: description
        };

        const pointsMatch = description.match(/([-+]?\d+) Points?/);
        if (pointsMatch) card.pointsDelta = parseInt(pointsMatch[1]);

        const drawMatch = description.match(/Draw (\d+) cards?/);
        if (drawMatch) card.drawCount = parseInt(drawMatch[1]);

        const healthMatch = description.match(/([-+]?\d+) Health/);
        if (healthMatch) {
            if (description.match(/Heal|gain|revive/i)) {
                card.gainHealth = parseInt(healthMatch[1]);
            } else if (description.match(/lose/i)) {
                card.healthDelta = -Math.abs(parseInt(healthMatch[1]));
            }
        }

        if (type === 'ASCENDED') {
            const tierMatch = rawType.match(/Tier (\d+)/);
            if (tierMatch) card.tier = parseInt(tierMatch[1]);
        }

        if (type === 'DISASTER') {
            if (description.match(/Dampener|Earth/i)) card.disasterKind = 'EARTHQUAKE';
            else if (description.match(/Layer|Fire|Solar|Flare/i)) card.disasterKind = 'WILDFIRE';
            else if (description.match(/Gate|Hydro|Flood/i)) card.disasterKind = 'FLOOD';
            else if (description.match(/Field|Bio/i)) card.disasterKind = 'PLAGUE';
            else if (description.match(/cannot be blocked|Global/i)) card.disasterKind = 'GLOBAL';
        }

        card.effect = description.toLowerCase().replace(/[^a-z0-9_ ]/g, '').replace(/ /g, '_');

        result[type].push(card);
      }
    });
  });

  return result;
}

try {
    const finalCards = parseCards(cardRawData);
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'cards.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalCards, null, 2));
    console.log('Successfully generated 220 cards in src/data/cards.json');
} catch (err) {
    console.error('Error generating cards:', err);
    process.exit(1);
}
