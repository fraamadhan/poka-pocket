import React from "react";

interface FeedbackTabProps {
  feedbackRating: number | null;
  setFeedbackRating: (val: number | null) => void;
  feedbackMessage: string;
  setFeedbackMessage: (val: string) => void;
  isSubmittingFeedback: boolean;
  feedbackStatus: { success?: boolean; error?: string } | null;
  onSubmit: (e: React.FormEvent) => void;
}

export default function FeedbackTab({
  feedbackRating,
  setFeedbackRating,
  feedbackMessage,
  setFeedbackMessage,
  isSubmittingFeedback,
  feedbackStatus,
  onSubmit,
}: FeedbackTabProps) {
  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="border-4 border-black p-4 bg-zinc-950 shadow-[3px_3px_0px_#000] text-left text-white">
        <h4 className="font-cinzel font-bold text-sm text-white mb-1">
          ✉️ Send Feedback
        </h4>
        <p className="text-xs text-zinc-400 mb-4 font-sans">
          Share your thoughts, report bugs, or suggest features directly to the developer team.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {/* Rating stars */}
          <div className="flex flex-col gap-2">
            <label className="font-cinzel text-xs font-bold text-zinc-300">How would you rate Poka Pocket?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackRating(star)}
                  className={`text-3xl transition-all duration-100 hover:scale-110 ${
                    feedbackRating && feedbackRating >= star ? "grayscale-0 scale-105" : "grayscale opacity-50"
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Message input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="feedback-message" className="font-cinzel text-xs font-bold text-zinc-300">Write your feedback</label>
            <textarea
              id="feedback-message"
              rows={4}
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Tell us what you think or what we can improve..."
              className="w-full p-3 border-2 border-black bg-zinc-900 text-white shadow-[3px_3px_0px_#000] focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all text-xs outline-none resize-none font-sans focus:bg-zinc-800"
            />
          </div>

          {/* Status Messages */}
          {feedbackStatus?.error && (
            <div className="border-2 border-black bg-red-950/40 text-red-400 font-bold p-2 text-xs shadow-[2px_2px_0px_#000]">
              ⚠️ {feedbackStatus.error}
            </div>
          )}
          {feedbackStatus?.success && (
            <div className="border-2 border-black bg-green-950/40 text-green-400 font-bold p-2 text-xs shadow-[2px_2px_0px_#000]">
              🎉 Feedback sent! Thank you for your review.
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmittingFeedback}
            className="w-full py-2 bg-sky-blue text-dungeon font-cinzel text-xs font-bold border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:bg-zinc-850 disabled:text-zinc-500 disabled:pointer-events-none"
          >
            {isSubmittingFeedback ? "SUBMITTING..." : "SUBMIT FEEDBACK"}
          </button>
        </form>
      </div>
    </div>
  );
}
