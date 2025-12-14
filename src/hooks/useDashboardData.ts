import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    fetchDashboardStats,
    type DashboardStats
} from "@/services/dashboardService";
import {
    getQuickActions,
    initializeDefaultActions,
    type QuickAction
} from "@/services/quickActionsService";
import { getUnreadCount } from "@/services/notificationService";

// Query keys for cache management
export const dashboardKeys = {
    all: ["dashboard"] as const,
    stats: (userId: string) => [...dashboardKeys.all, "stats", userId] as const,
    quickActions: (userId: string) => [...dashboardKeys.all, "quickActions", userId] as const,
    notifications: (userId: string) => [...dashboardKeys.all, "notifications", userId] as const,
};

/**
 * Hook to fetch dashboard statistics with caching
 */
export const useDashboardStats = (userId: string | undefined) => {
    return useQuery({
        queryKey: dashboardKeys.stats(userId || ""),
        queryFn: () => fetchDashboardStats(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook to fetch quick actions with caching
 * Also initializes default actions if needed
 */
export const useQuickActions = (userId: string | undefined) => {
    return useQuery({
        queryKey: dashboardKeys.quickActions(userId || ""),
        queryFn: async (): Promise<QuickAction[]> => {
            if (!userId) return [];
            await initializeDefaultActions(userId);
            const actions = await getQuickActions(userId);
            return actions.filter(a => a.is_enabled);
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook to fetch unread notification count with caching
 */
export const useUnreadNotifications = (userId: string | undefined) => {
    return useQuery({
        queryKey: dashboardKeys.notifications(userId || ""),
        queryFn: () => getUnreadCount(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes (notifications update more frequently)
    });
};

/**
 * Hook to invalidate all dashboard caches (useful after mutations)
 */
export const useInvalidateDashboard = () => {
    const queryClient = useQueryClient();

    return {
        invalidateStats: (userId: string) =>
            queryClient.invalidateQueries({ queryKey: dashboardKeys.stats(userId) }),
        invalidateAll: () =>
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    };
};
