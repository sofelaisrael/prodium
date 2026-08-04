function Block({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded bg-neutral-200 ${className}`}>
      <div className="media-skeleton" />
    </div>
  )
}

export default function EpisodeSkeleton() {
  return (
    <div className="animate-fade-in mx-5 md:mx-20 py-6">
      <div className="mb-8">
        <Block className="h-10 w-10 rounded-full" />
        <div className="mt-[31px] md:mt-[81px] space-y-3">
          <Block className="h-9 md:h-14 w-3/4" />
          <Block className="h-9 md:h-14 w-1/2" />
        </div>
      </div>

      <div className="rounded-[17px] bg-black p-2 md:p-[17px]">
        <div className="rounded-[17px] bg-[#F8F8F8] p-5 md:p-10">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-200">
            <div className="media-skeleton" />
          </div>
          <div className="mt-8 space-y-3">
            <Block className="h-3 w-full" />
            <Block className="h-3 w-11/12" />
            <Block className="h-3 w-4/5" />
            <Block className="h-3 w-10/12" />
            <Block className="h-3 w-3/4" />
            <Block className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )
}
