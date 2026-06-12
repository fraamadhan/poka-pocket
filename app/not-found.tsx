import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-parchment text-dungeon p-6">
      <main className="w-full max-w-md bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000] text-center flex flex-col items-center gap-6">
        <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-red-600 border-b-4 border-black pb-2 w-full">
          QUEST FAILED
        </h1>

        <div className="relative w-48 h-48 border-4 border-black shadow-[4px_4px_0px_#000] overflow-hidden bg-parchment">
          <Image
            src="/shinoa hiragi.webp"
            alt="404 Not Found Character"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-vt323 text-4xl text-dungeon">ERROR 404</h2>
          <p className="font-outfit text-sm font-semibold text-zinc-700 leading-relaxed">
            You wandered into an uncharted chamber of the dungeon! This page does not exist or has been lost to time.
          </p>
        </div>

        <Link
          href="/"
          className="w-full py-3 bg-sky-blue hover:bg-sky-400 text-dungeon font-cinzel font-bold text-sm border-4 border-black shadow-[4px_4px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
        >
          RETURN TO SAFETY
        </Link>
      </main>
    </div>
  );
}
