import { Skeleton } from "@/components/ui/skeleton";

const NomineeSkeleton = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/20 text-foreground p-4 sm:p-6 rounded-b-3xl">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 text-center -ml-9">
            <Skeleton className="h-6 w-36 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto mt-1" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card/50 rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
              <Skeleton className="h-8 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>

        <div className="space-y-2 sm:space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
              <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-16 mb-1.5" />
                <Skeleton className="h-3 w-40" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="w-8 h-8 rounded" />
                <Skeleton className="w-8 h-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NomineeSkeleton;
