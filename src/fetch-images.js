const fs = require('fs');
const path = require('path');
const https = require('https');

const dataRaw = fs.readFileSync('data/cards.json', 'utf-8');
const data = JSON.parse(dataRaw);
const cards = Array.isArray(data) ? data : (data.cards || Object.values(data).flat());

const publicDir = path.join(__dirname, 'public', 'cards');
fs.mkdirSync(publicDir, { recursive: true });

async function download(url, dest) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(buffer));
  } catch (err) {
    throw err;
  }
}

// Ensure unique cards only
const uniqueCards = [];
const seenIds = new Set();
for (const c of cards) {
  if (!seenIds.has(c.id)) {
    uniqueCards.push(c);
    seenIds.add(c.id);
  }
}

async function run() {
  console.log('Downloading ' + uniqueCards.length + ' cards...');
  for (let i = 0; i < uniqueCards.length; i++) {
    const c = uniqueCards[i];
    const dest = path.join(publicDir, `${c.id}.jpg`);
    if (fs.existsSync(dest)) continue;
    try {
        console.log(`Downloading [${i+1}/${uniqueCards.length}] ${c.id}...`);
        await download(`https://picsum.photos/seed/${encodeURIComponent(c.id)}/300/200`, dest);
        await new Promise(r => setTimeout(r, 100)); // small delay
    } catch(err) {
        console.error('Error on ', c.id, err);
    }
  }

  // Also download the deck back
  console.log('Downloading deck back...');
  if (!fs.existsSync(path.join(publicDir, 'deck_back.jpg'))) {
    await download(`https://picsum.photos/seed/deckback/200/300?blur=5`, path.join(publicDir, 'deck_back.jpg'));
  }
  
  // Also download avatars
  console.log('Downloading avatars...');
  if (!fs.existsSync(path.join(publicDir, 'avatar_default.jpg'))) {
    await download(`https://picsum.photos/seed/avatardefault/150/150`, path.join(publicDir, 'avatar_default.jpg'));
  }
  if (!fs.existsSync(path.join(publicDir, 'avatar_bot.jpg'))) {
    await download(`https://picsum.photos/seed/avatarbot/150/150?grayscale`, path.join(publicDir, 'avatar_bot.jpg'));
  }

  console.log('Done!');
}
run();
