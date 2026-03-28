const fs = require('fs');
let content = fs.readFileSync('app/tabletop/[code]/page.tsx', 'utf8');

// Deck Back
content = content.replace(
  /<img\s+src="\/cards\/deck_back\.jpg"[\s\S]*?\/>/, 
  `<div className="absolute inset-0 w-full h-full bg-gradient-to-br from-teal-900 to-teal-950 border border-white/10 p-2 flex flex-col items-center justify-between opacity-95">
      <div className="text-[10px] tracking-[0.3em] font-bold text-teal-400/50 mt-4">FRACTURED</div>
      <div className="w-12 h-12 rounded-full border border-teal-500/30 flex items-center justify-center">
        <div className="w-4 h-4 bg-teal-500/50 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.8)]"></div>
      </div>
      <div className="text-[10px] tracking-[0.3em] font-bold text-teal-400/50 mb-4">EARTH</div>
    </div>`
);

// Card Art (Fallback to Emojis)
content = content.replace(
  /<img\s+src=\{\`\/cards\/\$\{card\.id\}\.jpg\`\}[\s\S]*?onError=\{\(e\)\s*=>[\s\S]*?e\.currentTarget\.style\.display\s*=\s*'none'\s*\}[\s\S]*?\/>/,
  `<div className="absolute inset-0 w-full h-full">
      <div className="w-full h-full bg-[rgba(10,12,16,0.8)] flex flex-col justify-center items-center text-center p-3">
        <div className="text-[40px] drop-shadow-2xl opacity-80 group-hover:scale-110 transition-transform">
          {card.type === "disaster" ? "🌋" : card.type === "ascended" ? "✨" : "🧬"}
        </div>
      </div>
    </div>`
);

// Player/Bot Avatars
content = content.replace(
  /<img\s+src=\{player\.isBot\s*\?\s*'\/cards\/avatar_bot\.jpg'\s*:\s*'\/cards\/avatar_default\.jpg'\}[\s\S]*?\/>/,
  `<div className="absolute inset-0 w-full h-full bg-[rgba(15,18,25,0.9)] border border-white/5 flex items-center justify-center shadow-inner">
      <div className="text-3xl opacity-80 drop-shadow-md">
        {player.isBot ? "🤖" : "👤"}
      </div>
    </div>`
);

fs.writeFileSync('app/tabletop/[code]/page.tsx', content);
