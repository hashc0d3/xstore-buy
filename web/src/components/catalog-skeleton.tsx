/** Плейсхолдеры до гидрации каталога (или при отсутствии SSR). */
export function CategoryStripSkeleton() {
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => (
        <div
          key={i}
          className="h-[74px] min-[480px]:h-[88px] min-[640px]:h-[108px] min-[960px]:h-[132px] animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-100/90 min-[960px]:rounded-2xl"
        />
      ))}
    </>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 min-[640px]:grid-cols-2 min-[640px]:gap-3 min-[960px]:grid-cols-5 min-[1440px]:grid-cols-6 min-[1920px]:grid-cols-7 min-[1920px]:gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex h-[22rem] animate-pulse flex-col rounded-xl border border-zinc-200 bg-zinc-100/80 p-2 min-[640px]:h-[24rem]"
        >
          <div className="h-[7.5rem] rounded-lg bg-zinc-200/90 min-[640px]:h-[8.5rem]" />
          <div className="mt-3 flex flex-1 flex-col gap-2 px-1">
            <div className="h-4 rounded bg-zinc-200/90 min-[640px]:h-5" />
            <div className="h-3 w-2/3 rounded bg-zinc-200/70" />
            <div className="mt-auto h-8 rounded-lg bg-zinc-200/80" />
            <div className="h-8 rounded-lg bg-zinc-200/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
