import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-8">
        <div>
           <div className="fe-hologram text-sky-400 mb-2">Legal Compliance</div>
           <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">Privacy<span className="text-amber-500 block sm:inline">Policy</span></h1>
        </div>
        <Link href="/" className="fe-holo-btn !py-2 !px-4 text-xs shrink-0 text-center">Return Home</Link>
      </div>

      {/* AI prompt: secure archive vault with sealed data capsules, parchment records, lock iconography, warm moody lighting, detailed concept art */}
      
      <div className="grid sm:grid-cols-2 gap-3">
        {/* AI prompt: privacy notice card pinned to cork board with security badge icon, analog office scene, cinematic realism */}
        
        {/* AI prompt: data stream represented as sealed glass vials on shelf, no personal identifiers, atmospheric concept art */}
        
      </div>

      <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-4 text-sm text-white/70 leading-relaxed font-light">
        <p>Effective date: March 26, 2026</p>
        <p>
          Fractured Earth collects account identifiers, gameplay stats, room membership, and match state required to
          provide cross-platform play between web and Android clients.
        </p>
        <p>
          We store profile and multiplayer room data in managed cloud key-value storage. Local device preferences,
          recent match outcomes, and selected settings are stored in your browser local storage on this device.
        </p>
        <p>
          You can clear local browser data at any time from your browser settings. Authenticated account data can be
          requested for deletion through support.
        </p>
        <p>
          We do not sell personal data. Access is limited to required game operations, fraud prevention,
          diagnostics, and support.
        </p>
      </section>
    </main>
  );
}
