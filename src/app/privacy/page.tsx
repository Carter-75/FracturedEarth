import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <Link href="/" className="text-sm text-gray-400 hover:text-white">Home</Link>
      </div>

      <section className="bg-gray-800 rounded-xl p-6 space-y-3 text-sm text-gray-200 leading-relaxed">
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
