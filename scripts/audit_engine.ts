import fs from 'fs';
import path from 'path';

const cardsPath = path.join(process.cwd(), 'src/data/cards.json');
const enginePath = path.join(process.cwd(), 'src/lib/matchEngine.ts');

const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
const engineCode = fs.readFileSync(enginePath, 'utf8');

const allCards = Object.values(cards).flat() as any[];

const usedPrimitives = new Set<string>();
const usedTriggers = new Set<string>();

allCards.forEach(card => {
    if (card.primitives) {
        card.primitives.forEach((p: any) => {
            usedPrimitives.add(p.type);
            if (p.params && p.params.triggerKind) usedTriggers.add(p.params.triggerKind);
            if (p.then) p.then.forEach((inner: any) => {
                usedPrimitives.add(inner.type);
                if (inner.params && inner.params.triggerKind) usedTriggers.add(inner.params.triggerKind);
            });
            if (p.else) p.else.forEach((inner: any) => {
                usedPrimitives.add(inner.type);
                if (inner.params && inner.params.triggerKind) usedTriggers.add(inner.params.triggerKind);
            });
        });
    }
});

console.log('--- AUDIT START ---');
console.log('Total Cards:', allCards.length);

const supportedPrimitives = [...engineCode.matchAll(/case '([^']+)'/g)].map(m => m[1]);
const supportedTriggers = [...engineCode.matchAll(/\| '([^']+)'/g)].map(m => m[1]);

console.log('\n--- Unsupported Primitives ---');
const unsupportedPrimsFound: string[] = [];
const cardsWithUnsupportedPrims: any[] = [];

Array.from(usedPrimitives).forEach(p => {
    if (!supportedPrimitives.includes(p) && !['IF_UNBLOCKED', 'IF_HEALTH', 'IF_HAND_SIZE', 'IF_FIRST_CARD', 'IF_CHAOS_PLAYED', 'IF_PREVIOUS_CARD_TYPE', 'IF_NO_OTHER_SURVIVAL', 'CHANCE'].includes(p)) {
        unsupportedPrimsFound.push(p);
        console.log(`[MISSING PRIMITIVE]: ${p}`);
    }
});

allCards.forEach(card => {
    if (card.primitives) {
        const carriesUnsupported = card.primitives.some((p: any) => unsupportedPrimsFound.includes(p.type));
        const carriesUnmapped = card.primitives.some((p: any) => p.type === 'UNMAPPED');
        if (carriesUnsupported || carriesUnmapped) {
            cardsWithUnsupportedPrims.push({ id: card.id, name: card.name, prims: card.primitives.map((p:any)=>p.type) });
        }
    }
});

console.log('\n--- Cards Needing Fixes ---');
cardsWithUnsupportedPrims.forEach(c => {
    console.log(`[FIX REQUIRED]: ${c.name} (${c.id}) - Prims: ${c.prims.join(', ')}`);
});

console.log('\n--- Unsupported Triggers ---');
Array.from(usedTriggers).forEach(t => {
    if (!supportedTriggers.includes(t)) {
        console.log(`[MISSING TRIGGER]: ${t}`);
    }
});

console.log('\n--- Card Type Distribution ---');
Object.entries(cards).forEach(([type, list]: [string, any]) => {
    console.log(`${type}: ${list.length}`);
});

console.log('\n--- Specific Card Check (Disasters) ---');
cards.DISASTER.forEach((d: any) => {
    if (!d.primitives || d.primitives.length === 0) {
        console.log(`[NO PRIMITIVES]: ${d.name} (${d.id})`);
    }
});
