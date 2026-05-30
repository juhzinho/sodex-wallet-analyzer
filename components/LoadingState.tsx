interface Props {
  progress?: string | null;
}

export default function LoadingState({ progress }: Props) {
  return (
    <div className="space-y-6 mt-10">
      {/* Spinner + live progress */}
      <div className="flex flex-col items-center gap-4 py-8">
        {/* Dual-ring spinner */}
        <div className="relative w-14 h-14">
          <div
            className="absolute inset-0 rounded-full border-2 border-[rgba(255,107,0,0.12)]"
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#FF6B00] animate-spin"
            style={{ animationDuration: "0.9s" }}
          />
          <div
            className="absolute inset-[6px] rounded-full border border-transparent border-b-[rgba(255,107,0,0.5)] animate-spin"
            style={{ animationDuration: "1.4s", animationDirection: "reverse" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
          </div>
        </div>

        <div className="text-center">
          <p
            className="font-orbitron text-sm font-bold tracking-widest uppercase min-h-[1.25rem]"
            style={{ color: "#FF6B00" }}
          >
            {progress ?? "SCANNING WALLET..."}
          </p>
          <p className="text-xs text-white/25 mt-1 font-inter">
            Fetching complete on-chain history
          </p>
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="flex justify-between">
              <div className="skeleton h-2.5 w-16 rounded" />
              <div className="skeleton h-9 w-9 rounded-lg" />
            </div>
            <div className="skeleton h-7 w-24 rounded" />
            <div className="skeleton h-2.5 w-14 rounded" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-5">
          <div className="skeleton h-3 w-28 rounded mb-5" />
          <div className="skeleton h-52 w-full rounded-lg" />
        </div>
        <div className="glass-card p-5">
          <div className="skeleton h-3 w-24 rounded mb-5" />
          <div className="skeleton h-52 w-52 rounded-full mx-auto" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="glass-card p-5">
            <div className="skeleton h-3 w-28 rounded mb-5" />
            <div className="skeleton h-44 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-[rgba(255,107,0,0.12)]">
          <div className="skeleton h-3 w-36 rounded" />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-5 py-3 border-b border-[rgba(255,107,0,0.06)] flex gap-4">
            <div className="skeleton h-2.5 w-24 rounded" />
            <div className="skeleton h-2.5 w-14 rounded" />
            <div className="skeleton h-2.5 w-10 rounded" />
            <div className="skeleton h-2.5 w-18 rounded" />
            <div className="skeleton h-2.5 w-16 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
