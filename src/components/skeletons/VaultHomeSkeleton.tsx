import { Skeleton } from "@/components/ui/skeleton";

const VaultHomeSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#FCFCF9] pb-20">
      <div className="bg-[#FCFCF9] p-6">
        <Skeleton className="h-7 w-24 mx-auto" />
        <Skeleton className="h-4 w-28 mx-auto mt-2" />

        <Skeleton className="h-12 w-full rounded-xl mt-6" />
      </div>

      <div className="px-6">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#F3E8FF] rounded-2xl p-4 flex flex-col items-center">
              <Skeleton className="w-12 h-12 rounded-full mb-2" />
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VaultHomeSkeleton;
