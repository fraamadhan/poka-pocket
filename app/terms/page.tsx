import type { Metadata } from "next";
import BrutalistFooter from "@/components/BrutalistFooter";

export const metadata: Metadata = {
  title: "Terms of Service | Poka Pocket",
  description: "Terms and conditions of using Poka Pocket allowance tracker.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent font-sans p-6 justify-center items-center gap-6">
      
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-6 grid-rows-6 opacity-[0.03] border border-black" />

      {/* Header */}
      <div className="w-full max-w-md text-center z-10">
        <div className="inline-block px-3 py-1.5 bg-sky-blue border-2 border-black font-vt323 text-base tracking-wide mb-3 shadow-[2px_2px_0px_#000] text-dungeon">
          📜 terms of service
        </div>
        <h1 className="font-cinzel text-5xl font-extrabold tracking-tighter text-white drop-shadow-sm select-none">
          TERMS OF SERVICE
        </h1>
        <p className="text-base font-sans text-zinc-400 uppercase tracking-widest mt-2">
          Terms of Use & Guidelines
        </p>
      </div>

      {/* Terms Card */}
      <main className="w-full max-w-md bg-zinc-900 border-4 border-black shadow-[8px_8px_0px_#000] p-6 flex flex-col gap-6 z-10 relative text-white">
        
        <div className="text-center border-b-4 border-black pb-4">
          <div className="w-16 h-16 mx-auto bg-baby-pink border-4 border-black text-dungeon rounded-xl flex items-center justify-center text-3xl shadow-[3px_3px_0px_#000] select-none mb-3">
            📜
          </div>
          <h2 className="font-cinzel text-2xl font-bold">Terms of Use</h2>
          <p className="text-sm text-zinc-400 mt-1">Please read these rules before using the application.</p>
        </div>

        {/* Content Details */}
        <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 border-2 border-black border-dashed p-4 bg-sky-blue/5 text-sm leading-relaxed text-zinc-300">
          <section>
            <h3 className="font-cinzel font-bold text-white mb-1">1. Acceptance of Terms</h3>
            <p>By registering for Poka Pocket, you agree to abide by these terms. If you do not agree to these rules, you may not use Poka Pocket.</p>
          </section>
          <section>
            <h3 className="font-cinzel font-bold text-white mb-1">2. Account Registration</h3>
            <p>You must authenticate using Google OAuth. You are responsible for keeping your credentials secure. We do not store your passwords.</p>
          </section>
          <section>
            <h3 className="font-cinzel font-bold text-white mb-1">3. Usage & Conduct</h3>
            <p>Poka Pocket is built for tracking allowances and budgets. Do not exploit bugs, use bots, or attempt to hack our servers. Keep your usage clean!</p>
          </section>
          <section>
            <h3 className="font-cinzel font-bold text-white mb-1">4. Modifications to Service</h3>
            <p>We reserve the right to modify or discontinue features at any time without notice. All logged items are for tracking purposes and have no real-world cash value.</p>
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
