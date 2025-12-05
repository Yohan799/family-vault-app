import { Skeleton } from "@/components/ui/skeleton";

const CategoryViewSkeleton = () => {
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

            {/* Subcategories Grid */}
            <div className="px-6">
                <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-[#F3E8FF] rounded-2xl p-5 flex flex-col items-center">
                            <Skeleton className="w-14 h-14 rounded-full mb-3" />
                            <Skeleton className="h-5 w-24 mb-1" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CategoryViewSkeleton;
