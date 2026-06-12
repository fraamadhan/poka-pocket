"use client";

import { useState } from "react";
import BrutalistFooter from "@/components/BrutalistFooter";
import { submitFeedback } from "@/app/actions/feedback";

interface SupportClientProps {
  isLoggedIn: boolean;
}

export default function SupportClient({ isLoggedIn }: SupportClientProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ success?: boolean; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setStatus({ error: "Please write a message before submitting." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const res = await submitFeedback(rating, message);
      if (res.success) {
        setStatus({ success: true });
        setMessage("");
        setRating(null);
      } else {
        setStatus({ error: res.error || "Something went wrong." });
      }
    } catch (err) {
      setStatus({ error: "Failed to connect to the server." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent font-sans p-6 justify-center items-center gap-8">
      
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-6 grid-rows-6 opacity-[0.03] border border-black" />

      {/* Header */}
      <div className="w-full max-w-xl text-center z-10">
        <div className="inline-block px-4 py-2 bg-sky-blue border-2 border-black font-vt323 text-lg tracking-wide mb-3 shadow-[3px_3px_0px_#000] text-dungeon">
          ✉️ support & feedback
        </div>
        <h1 className="font-cinzel text-6xl font-extrabold tracking-tighter text-white drop-shadow-sm select-none">
          SUPPORT
        </h1>
        <p className="text-lg font-sans text-zinc-400 uppercase tracking-widest mt-2">
          Need help or want to leave a review?
        </p>
      </div>

      {/* Main Support & Feedback Container */}
      <main className="w-full max-w-xl bg-zinc-900 border-4 border-black shadow-[10px_10px_0px_#000] p-8 flex flex-col gap-8 z-10 relative text-white">
        
        {/* Developer Contact Info */}
        <section className="flex flex-col gap-4 border-b-4 border-black pb-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-baby-pink border-4 border-black text-dungeon rounded-2xl flex items-center justify-center text-4xl shadow-[4px_4px_0px_#000] select-none mb-3">
              💻
            </div>
            <h2 className="font-cinzel text-3xl font-extrabold text-white">Developer Contact</h2>
            <p className="text-base text-zinc-400 mt-1">Reach out directly on developer channels or leave feedback below.</p>
          </div>

          {/* Email and GitHub Stacked Vertically to prevent text wrapping/squishing */}
          <div className="flex flex-col gap-4 mt-2">
            {/* Email */}
            <a 
              href="mailto:fakhrifajarrr@gmail.com" 
              className="flex items-center gap-4 p-4 border-4 border-black bg-sky-blue hover:bg-sky-200 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_#000] text-dungeon font-bold w-full"
            >
              <div className="bg-white border-2 border-black p-2 flex items-center justify-center rounded shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-cinzel text-xs uppercase tracking-wider text-zinc-700">Send Email</span>
                <span className="font-sans text-base sm:text-lg">{`fakhrifajarrr@gmail.com`}</span>
              </div>
            </a>

            {/* GitHub */}
            <a 
              href="https://github.com/fraamadhan" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-4 p-4 border-4 border-black bg-baby-pink hover:bg-pink-200 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_#000] text-dungeon font-bold w-full"
            >
              <div className="bg-white border-2 border-black p-2 flex items-center justify-center rounded shrink-0 text-dungeon">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-cinzel text-xs uppercase tracking-wider text-zinc-700">GitHub Profile</span>
                <span className="font-sans text-base sm:text-lg">github.com/fraamadhan</span>
              </div>
            </a>
          </div>
        </section>

        {/* Feedback & Review Form */}
        <section className="flex flex-col gap-4">
          <h3 className="font-cinzel text-2xl font-bold text-white">Send Feedback</h3>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Rating stars - only visible to logged in users */}
            {isLoggedIn ? (
              <div className="flex flex-col gap-2">
                <label className="font-cinzel text-base font-bold text-zinc-300">How would you rate Poka Pocket?</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-4xl transition-all duration-100 hover:scale-110 ${
                        rating && rating >= star ? "grayscale-0 scale-105" : "grayscale opacity-50"
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-2 border-black border-dashed p-3 bg-zinc-950 text-sm text-zinc-400 font-sans">
                ℹ️ Rating stars are locked for guest users. Please log in to rate the app.
              </div>
            )}

            {/* Message input */}
            <div className="flex flex-col gap-2">
              <label htmlFor="message" className="font-cinzel text-base font-bold text-zinc-300">Write your feedback</label>
              <textarea
                id="message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts, report bugs, or suggest features..."
                className="w-full p-4 border-4 border-black bg-zinc-950 text-white shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all text-base outline-none resize-none font-sans focus:bg-zinc-900"
              />
            </div>

            {/* Status Messages */}
            {status?.error && (
              <div className="border-4 border-black bg-red-950/40 text-red-400 font-bold p-3 text-base shadow-[3px_3px_0px_#000]">
                ⚠️ {status.error}
              </div>
            )}
            {status?.success && (
              <div className="border-4 border-black bg-green-950/40 text-green-400 font-bold p-3 text-base shadow-[3px_3px_0px_#000]">
                🎉 Feedback sent! Thank you for your review.
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-sky-blue text-dungeon font-cinzel text-base font-bold border-4 border-black shadow-[4px_4px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:bg-zinc-850 disabled:text-zinc-500 disabled:pointer-events-none"
            >
              {isSubmitting ? "SUBMITTING..." : "SUBMIT FEEDBACK"}
            </button>
          </form>
        </section>

        {/* Back Navigation */}
        <div className="border-t-4 border-black pt-6">
          <a 
            href="/" 
            className="block text-center w-full py-4 bg-zinc-950 hover:bg-neutral-800 text-white font-cinzel text-base font-bold border-4 border-black shadow-[4px_4px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            RETURN TO HOME
          </a>
        </div>

      </main>

      <BrutalistFooter />
    </div>
  );
}
