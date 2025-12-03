import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="bg-primary/20 text-foreground p-4 rounded-b-3xl">
        <div className="flex justify-between items-start mb-3">
          <div>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        <div className="bg-card rounded-xl p-3 text-center">
          <Skeleton className="w-14 h-14 rounded-full mx-auto mb-1" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-2.5 text-center flex flex-col items-center justify-center h-20">
              <Skeleton className="w-5 h-5 rounded mb-1.5" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        <div>
          <Skeleton className="h-5 w-28 mb-2" />
          <div className="space-y-1.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-full bg-card rounded-lg p-2.5 flex items-center gap-2.5">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-2 w-32" />
                </div>
                <Skeleton className="w-4 h-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
