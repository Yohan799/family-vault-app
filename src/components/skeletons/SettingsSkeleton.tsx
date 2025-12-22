import { Skeleton } from "@/components/ui/skeleton";

const SettingsSkeleton = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/20 text-foreground p-6 pt-4 rounded-b-3xl mb-4">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-4 w-36 mt-1" />
      </div>

      <div className="px-4 space-y-3">
        {/* Profile Card */}
        <div className="w-full bg-card rounded-xl p-4 flex items-center gap-4 mb-2">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="w-5 h-5" />
        </div>

        {/* Settings List */}
        <div className="space-y-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-full bg-card rounded-xl p-3 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="w-5 h-5" />
            </div>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="pt-4 space-y-2">
          <div className="w-full bg-card rounded-xl p-3 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="w-full bg-card rounded-xl p-3 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSkeleton;
