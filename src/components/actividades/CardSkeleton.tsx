export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl aspect-[4/3] bg-stone-100 animate-pulse" />
      <div className="flex flex-col gap-2 px-1">
        <div className="h-3.5 bg-stone-100 rounded-full animate-pulse" />
        <div className="h-3.5 bg-stone-100 rounded-full animate-pulse w-3/4" />
        <div className="h-3 bg-stone-100 rounded-full animate-pulse w-1/2 mt-0.5" />
        <div className="h-3 bg-stone-100 rounded-full animate-pulse w-2/3" />
        <div className="flex gap-1 mt-0.5">
          <div className="w-2 h-2 rounded-full bg-stone-100 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-stone-100 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-stone-100 animate-pulse" />
        </div>
        <div className="h-3 bg-stone-100 rounded-full animate-pulse w-1/4 mt-0.5" />
      </div>
    </div>
  )
}
