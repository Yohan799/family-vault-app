import { Skeleton } from "@/components/ui/skeleton";

const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-16" />
        </div>

        {/* Profile Avatar */}
        <div className="flex flex-col items-center">
          <Skeleton className="w-24 h-24 rounded-full mb-4" />
          <Skeleton className="h-6 w-32 mb-1" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Profile Details */}
        <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>

        {/* Edit Button */}
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
};

export default ProfileSkeleton;
