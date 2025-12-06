import { supabase } from '@/integrations/supabase/client';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    body: string;
    type: string;
    data: Record<string, any>;
    is_read: boolean;
    created_at: string;
}

// Fetch all notifications for a user
export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return (data || []) as Notification[];
};

// Get unread notification count
export const getUnreadCount = async (userId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }

    return count || 0;
};

// Mark a notification as read
export const markAsRead = async (notificationId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }

    return true;
};

// Mark all notifications as read
export const markAllAsRead = async (userId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking all as read:', error);
        return false;
    }

    return true;
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

    if (error) {
        console.error('Error deleting notification:', error);
        return false;
    }

    return true;
};

// Clear all notifications for a user
export const clearAllNotifications = async (userId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

    if (error) {
        console.error('Error clearing notifications:', error);
        return false;
    }

    return true;
};

// Get icon for notification type
export const getNotificationIcon = (type: string): string => {
    switch (type) {
        case 'new_device_login':
            return '🔐';
        case 'security':
            return '🛡️';
        case 'time_capsule':
            return '📦';
        case 'nominee':
            return '👥';
        case 'document':
            return '📄';
        default:
            return '🔔';
    }
};
