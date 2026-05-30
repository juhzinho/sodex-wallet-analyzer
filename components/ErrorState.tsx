interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="mt-10 flex flex-col items-center justify-center text-center py-16">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.25)",
          boxShadow: "0 0 20px rgba(239,68,68,0.10)",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-red-400">
          <path
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>

      <h3 className="font-orbitron font-bold text-base text-white mb-2 tracking-wider uppercase">
        Analysis Failed
      </h3>
      <p className="text-white/40 text-sm max-w-md leading-relaxed mb-7 font-inter">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-lg font-orbitron font-bold text-xs tracking-widest uppercase text-black transition-all hover:shadow-glow"
          style={{ background: "linear-gradient(135deg, #FF8A33, #FF6B00)" }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
