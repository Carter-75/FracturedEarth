const fs = require('fs');
const path = require('path');

const cardsJsonPath = path.join(__dirname, '..', 'data', 'cards.json');
const catalogKtPath = path.join(__dirname, '..', 'game-core', 'src', 'main', 'kotlin', 'com', 'fracturedearth', 'core', 'model', 'CardCatalog.kt');

function escapeString(str) {
    if (!str) return 'null';
    return `"${str.replace(/"/g, '\\"')}"`;
}

function jsonToKt(obj) {
    if (obj === null) return 'null';
    if (typeof obj === 'string') return `JsonPrimitive(${escapeString(obj)})`;
    if (typeof obj === 'number') return `JsonPrimitive(${obj})`;
    if (typeof obj === 'boolean') return `JsonPrimitive(${obj})`;
    if (Array.isArray(obj)) {
        return `JsonArray(listOf(${obj.map(jsonToKt).join(', ')}))`;
    }
    if (typeof obj === 'object') {
        return `JsonObject(mapOf(${Object.entries(obj).map(([k, v]) => `"${k}" to ${jsonToKt(v)}`).join(', ')}))`;
    }
    return 'null';
}

function generateCatalog() {
    const raw = fs.readFileSync(cardsJsonPath, 'utf8');
    const cards = JSON.parse(raw);

    const allCards = [];
    Object.keys(cards).forEach(type => {
        cards[type].forEach(card => {
            allCards.push(card);
        });
    });

    let kt = `package com.fracturedearth.core.model

import kotlinx.serialization.json.*

object CardCatalog {
    fun starterDeck(): List<Card> = listOf(
`;

    allCards.forEach((card, index) => {
        kt += `        Card(
            id = "${card.id}",
            name = "${card.name}",
            type = CardType.${card.type},
            pointsDelta = ${card.pointsDelta || 0},
            drawCount = ${card.drawCount || 0},
            disasterKind = ${card.disasterKind ? `DisasterKind.${card.disasterKind}` : 'null'},
            blocksDisaster = ${card.blocksDisaster ? `DisasterKind.${card.blocksDisaster}` : 'null'},
            tier = ${card.tier || 'null'},
            description = ${escapeString(card.description)},
            discardCost = ${card.discardCost || 0},
            primitives = listOf(
${(card.primitives || []).map(p => `                ${jsonToKt(p)}`).join(',\n')}
            )
        )${index === allCards.length - 1 ? '' : ','}\n`;
    });

    kt += `    )
}
`;

    fs.writeFileSync(catalogKtPath, kt);
    console.log(`Generated ${allCards.length} cards in CardCatalog.kt`);
}

try {
    generateCatalog();
} catch (e) {
    console.error(e);
    process.exit(1);
}
