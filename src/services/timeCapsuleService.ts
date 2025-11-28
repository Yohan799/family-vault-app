import { supabase } from "@/integrations/supabase/client";

export interface TimeCapsule {
  id: string;
  user_id: string;
  title: string;
  message: string;
  recipient_email: string;
  phone: string | null;
  attachment_url: string | null;
  release_date: string;
  status: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}

export const timeCapsuleService = {
  async getAll(): Promise<TimeCapsule[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("time_capsules")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("release_date", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(capsule: {
    title: string;
    message: string;
    recipient_email: string;
    phone?: string;
    release_date: string;
    attachment_url?: string;
  }): Promise<TimeCapsule> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("time_capsules")
      .insert({
        user_id: user.id,
        title: capsule.title,
        message: capsule.message,
        recipient_email: capsule.recipient_email,
        phone: capsule.phone || null,
        release_date: capsule.release_date,
        attachment_url: capsule.attachment_url || null,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<TimeCapsule>): Promise<TimeCapsule> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("time_capsules")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("time_capsules")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
  },

  async uploadAttachment(file: File, capsuleId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/time-capsules/${capsuleId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    return publicUrl;
  },
};
