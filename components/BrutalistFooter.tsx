"use client";

export default function BrutalistFooter() {
  return (
    <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md text-center border-t-4 border-l-4 border-r-4 border-black bg-zinc-900 p-3 shadow-[0_-4px_0px_#000] flex flex-col gap-1 z-40 text-white rounded-t-lg">
      <div className="flex justify-center gap-4 text-xs font-bold uppercase tracking-wider font-cinzel">
        <a href="/terms" className="text-zinc-300 hover:underline hover:text-sky-blue transition-colors">Terms of Service</a>
        <span className="text-zinc-600">•</span>
        <a href="/privacy" className="text-zinc-300 hover:underline hover:text-baby-pink transition-colors">Privacy Policy</a>
        <span className="text-zinc-600">•</span>
        <a href="/support" className="text-zinc-300 hover:underline hover:text-sky-blue transition-colors">Support</a>
      </div>
      <p className="font-sans text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
        © {new Date().getFullYear()} Poka Pocket. Developed by Timun Wahyu.
      </p>
    </footer>
  );
}
