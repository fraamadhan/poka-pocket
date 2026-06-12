import type { Metadata } from "next";
import BrutalistFooter from "@/components/BrutalistFooter";

export const metadata: Metadata = {
  title: "Privacy Policy | Poka Pocket",
  description: "Privacy policy detailing how Poka Pocket secures and handles user data.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent font-sans p-6 justify-center items-center gap-6">
      
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-6 grid-rows-6 opacity-[0.03] border border-black" />

      {/* Header */}
      <div className="w-full max-w-md text-center z-10">
        <div className="inline-block px-3 py-1.5 bg-sky-blue border-2 border-black font-vt323 text-base tracking-wide mb-3 shadow-[2px_2px_0px_#000] text-dungeon">
          🛡️ privacy policy
        </div>
        <h1 className="font-cinzel text-5xl font-extrabold tracking-tighter text-white drop-shadow-sm select-none">
          PRIVACY POLICY
        </h1>
        <p className="text-base font-sans text-zinc-400 uppercase tracking-widest mt-2">
          How We Safeguard Your Data
        </p>
      </div>

      {/* Privacy Card */}
      <main className="w-full max-w-md bg-zinc-900 border-4 border-black shadow-[8px_8px_0px_#000] p-6 flex flex-col gap-6 z-10 relative text-white">
        
        <div className="text-center border-b-4 border-black pb-4">
          <div className="w-16 h-16 mx-auto bg-baby-pink border-4 border-black text-dungeon rounded-xl flex items-center justify-center text-3xl shadow-[3px_3px_0px_#000] select-none mb-3">
            🛡️
          </div>
          <h2 className="font-cinzel text-2xl font-bold">Privacy Policy</h2>
          <p className="text-sm text-zinc-400 mt-1">We respect your privacy and protect your data with secure measures.</p>
        </div>

        {/* Content Details */}
        <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 border-2 border-black border-dashed p-4 bg-sky-blue/5 text-sm leading-relaxed text-zinc-300">
          <section>
            <h3 className="font-cinzel font-bold text-white mb-1">1. Information We Collect</h3>
            <p>We only save details provided by Google Auth (name, email, profile image) and the allowances, budgets, and transactions you log yourself.</p>
          </section>
          <section>
            <h3 className="font-cinzel font-bold text-white mb-1">2. How We Use Data</h3>
            <p>Your details are used purely to authenticate you and sync your account data. We do not sell or trade your data to merchants or third parties.</p>
          </section>
          <section>
            <h3 className="font-cinzel font-bold text-white mb-1">3. Data Security</h3>
            <p>We use encrypted secure databases and standard NextAuth handlers to guard your data from unauthorized access and leaks.</p>
          </section>
          <section>
            <h3 className="font-cinzel font-bold text-white mb-1">4. Your Rights</h3>
            <p>You can request to delete your transactions and logs from our records at any time by contacting support.</p>
          </section>
        </div>

        {/* Back Navigation */}
        <div>
          <a 
            href="/" 
            className="block text-center w-full py-3.5 bg-zinc-950 hover:bg-neutral-800 text-white font-cinzel text-sm font-bold border-4 border-black shadow-[4px_4px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            RETURN TO HOME
          </a>
        </div>

      </main>

      <BrutalistFooter />
    </div>
  );
}
