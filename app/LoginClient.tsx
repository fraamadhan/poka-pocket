"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import BrutalistFooter from "@/components/BrutalistFooter";

interface LoginClientProps {
  error?: string;
}

export default function LoginClient({ error }: LoginClientProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastKey, setToastKey] = useState(0);

  // Monitor searchParams for real Google OAuth errors redirected back to this page
  useEffect(() => {
    if (error) {
      let friendlyMessage = "Google OAuth authentication failed. Please try again.";
      if (error === "OAuthSignin") friendlyMessage = "Could not start Google Sign-In. Check network connection.";
      if (error === "OAuthCallback") friendlyMessage = "Google OAuth validation failed. The authentication server rejected it.";
      if (error === "OAuthCreateAccount") friendlyMessage = "Failed to create your pocket account. Contact support.";
      if (error === "EmailSignin") friendlyMessage = "Email validation failed.";
      if (error === "CredentialsSignin") friendlyMessage = "Invalid credentials.";
      
      setToastMessage(friendlyMessage);
      setToastKey(prev => prev + 1);
      setShowToast(true);
    }
  }, [error]);

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setShowToast(false);

    try {
      // Direct integration to Google Provider callback redirecting to /dashboard on success
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      setIsLoggingIn(false);
      setToastMessage("Failed to connect to Google OAuth servers.");
      setToastKey(prev => prev + 1);
      setShowToast(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent p-6 pb-28 justify-center items-center gap-6 relative overflow-hidden select-none">
      
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-6 grid-rows-6 opacity-[0.03] border border-black" />

      {/* Header */}
      <div className="w-full max-w-md text-center z-10">
        <div className="inline-block px-3 py-1.5 bg-sky-blue border-2 border-black text-dungeon font-vt323 text-base tracking-wide mb-3 shadow-[2px_2px_0px_#000]">
          🪙 allowance tracker
        </div>
        <h1 className="font-cinzel text-5xl font-extrabold tracking-tighter text-white drop-shadow-sm select-none">
          POKA POCKET
        </h1>
        <p className="text-base font-sans text-zinc-400 uppercase tracking-widest mt-2">
          Gamified Allowance Tracker
        </p>
      </div>

      {/* Main Login Card */}
      <main className="w-full max-w-md bg-zinc-900 text-white border-4 border-black shadow-[8px_8px_0px_#000] p-6 flex flex-col gap-6 z-10 relative">
        
        {/* Logo Icon */}
        <div className="w-24 h-24 mx-auto bg-baby-pink border-4 border-black text-dungeon rounded-b-xl flex items-center justify-center text-4xl shadow-[4px_4px_0px_#000] select-none">
          🪙
        </div>

        <div className="text-center">
          <h2 className="font-cinzel text-2xl font-bold">Log in to Poka Pocket</h2>
          <p className="text-sm text-zinc-400 mt-1">Sign in with Google to manage your pockets and track your cash flow.</p>
        </div>

        {/* Feature Highlights */}
        <div className="border-2 border-black border-dashed p-4 bg-sky-blue/5 flex flex-col gap-3 text-sm text-zinc-300">
          <div className="flex items-center gap-2">
            <span>💼</span>
            <span>Divide your money into different pockets (Wallet, Savings, Snacks)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔥</span>
            <span>Category icons change color and state based on your budget limit</span>
          </div>
        </div>

        {/* Interactive Google Button */}
        <div className="relative mt-2">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full py-4 bg-sky-blue text-dungeon font-cinzel text-md font-extrabold tracking-wider border-4 border-black shadow-[6px_6px_0px_#000] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 active:bg-sky-300 transition-all flex items-center justify-center gap-3 disabled:bg-zinc-200 disabled:pointer-events-none"
          >
            {isLoggingIn ? (
              <span className="font-vt323 text-lg animate-pulse">SIGNING IN...</span>
            ) : (
              <>
                <svg className="w-5 h-5 fill-current border border-black p-0.5 bg-white shadow-[1px_1px_0px_#000]" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.71 0 3.27.61 4.5 1.625l2.437-2.437C17.312 1.696 14.933 1 12.24 1c-5.523 0-10 4.477-10 10s4.477 10 10 10c5.77 0 9.606-4.056 9.606-9.776 0-.658-.078-1.164-.206-1.564H12.24z"/>
                </svg>
                <span>SIGN IN WITH GOOGLE</span>
              </>
            )}
          </button>
        </div>

      </main>

      {/* Error Alert Toast */}
      {showToast && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            key={toastKey}
            className="w-full max-w-sm bg-zinc-900 border-4 border-black text-white p-4 shadow-[6px_6px_0px_rgba(0,0,0,0.8)] animate-shake flex flex-col gap-2 relative overflow-hidden"
          >
            <div className="flex items-start gap-3 mt-1">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-cinzel text-red-500 font-extrabold tracking-widest text-sm uppercase">
                  ⚠️ ERROR OCCURRED
                </h3>
                <p className="font-vt323 text-red-300 text-sm mt-1 leading-snug">
                  {toastMessage}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={() => setShowToast(false)}
                className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white font-cinzel text-xs font-bold border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Brutalist Footer */}
      <BrutalistFooter />

    </div>
  );
}
