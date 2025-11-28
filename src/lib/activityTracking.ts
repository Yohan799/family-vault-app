import { supabase } from "@/integrations/supabase/client";

/**
 * Update user's last activity timestamp in inactivity_triggers table
 * This should be called on significant user actions to track activity
 */
export const updateActivityTimestamp = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("inactivity_triggers")
      .upsert(
        {
          user_id: userId,
          last_activity_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error("Error updating activity timestamp:", error);
    }
  } catch (err) {
    console.error("Failed to update activity:", err);
  }
};

/**
 * Get days since last activity for a user
 */
export const getDaysSinceActivity = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("inactivity_triggers")
      .select("last_activity_at")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return 0;
    }

    const lastActivity = new Date(data.last_activity_at);
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (err) {
    console.error("Error getting days since activity:", err);
    return 0;
  }
};