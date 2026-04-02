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

      <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 text-sm text-white/70 leading-relaxed font-light">
        <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
          <p className="font-bold text-amber-500 uppercase tracking-widest text-[10px]">Registry Status: ACTIVE</p>
          <p>Effective date: March 31, 2026</p>
        </div>

        <div>
          <h3 className="text-white font-bold mb-2 uppercase tracking-tight">1. Data Collection & Synchronization</h3>
          <p>
            Fractured Earth collects account identifiers, gameplay stats, room membership, and match state required to
            provide cross-platform play between web and Android clients. We store profile and multiplayer room data in 
            managed cloud key-value storage (Vercel KV). Local device preferences and transient match states are stored 
            locally on your device.
          </p>
        </div>

        <div>
          <h3 className="text-white font-bold mb-2 uppercase tracking-tight">2. Third-Party Service Providers</h3>
          <p className="mb-3">We employ third-party services to facilitate game operations, advertising, and subscription management:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <span className="text-white font-medium">Google AdMob:</span> We use AdMob to serve advertisements. AdMob may collect 
              and use device identifiers, advertising IDs, crash logs, and diagnostics data to provide personalized ads and performance analytics.
            </li>
            <li>
              <span className="text-white font-medium">RevenueCat:</span> We use RevenueCat to manage in-app subscriptions and premium 
              access. This includes processing purchase history and entitlement status. Transactional data is processed securely; we do not directly store or handle your credit card information.
            </li>
            <li>
              <span className="text-white font-medium">Google Sign-In:</span> We use Google authentication to link your game profile 
              across devices. Your email and display name are used solely for identification and support.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold mb-2 uppercase tracking-tight">3. Data Control & Deletion</h3>
          <p className="mb-3">
            Fractured Earth provides an automated mechanism to request data deletion. You can initiate an immediate purge
            of your cloud-stored profile, stats, and leaderboard rankings via our 
            <Link href="/delete-account" className="text-amber-500 hover:underline mx-1">Account Deletion portal</Link>.
          </p>
          <p>
            You have full control over your NeuralAtlas data. We do not sell personal data to third parties.
          </p>
        </div>

        <div className="pt-4 border-t border-white/5">
          <p className="text-[10px] uppercase tracking-widest opacity-40">
            End of Document // NeuralAtlas Protocol Compliance
          </p>
        </div>
      </section>
    </main>
  );
}
