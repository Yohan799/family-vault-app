import { Skeleton } from "@/components/ui/skeleton";

const SubcategoryViewSkeleton = () => {
    return (
        <div className="min-h-screen bg-[#FCFCF9] pb-20">
            <div className="bg-[#FCFCF9] p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="w-6 h-6 rounded" />
                    <div className="flex-1 text-center -ml-10">
                        <div className="flex items-center justify-center gap-2">
                            <Skeleton className="w-6 h-6 rounded" />
                            <Skeleton className="h-7 w-32" />
                        </div>
                        <Skeleton className="h-4 w-24 mx-auto mt-1" />
                    </div>
                </div>

                {/* Search bar */}
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            {/* Folders Section */}
            <div className="px-6 mb-6">
                <Skeleton className="h-6 w-20 mb-3" />
                <div className="grid grid-cols-2 gap-3">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="bg-[#F3E8FF] rounded-2xl p-5 flex flex-col items-center">
                            <Skeleton className="w-14 h-14 rounded-full mb-3" />
                            <Skeleton className="h-5 w-20 mb-1" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Documents Section */}
            <div className="px-6">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-10 w-24 rounded-lg" />
                </div>

                {/* Document Cards */}
                <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-card rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                                <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                                <div className="flex-1">
                                    <Skeleton className="h-5 w-3/4 mb-1" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                            <Skeleton className="w-6 h-6 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubcategoryViewSkeleton;
