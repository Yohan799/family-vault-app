import { supabase } from '@/integrations/supabase/client';
import { DocumentGroup, CreateGroupInput, GroupWithDocuments } from '@/types/groups';

/**
 * Service for managing document groups
 */
export const groupService = {
    /**
     * Create a new document group
     */
    async createGroup(input: CreateGroupInput): Promise<DocumentGroup> {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('folders')
            .insert({
                user_id: user.user.id,
                subcategory_id: input.subcategory_id,
                name: input.name,
                folder_type: 'group',
                icon: input.icon || 'Folder',
                icon_bg_color: input.icon_bg_color || 'bg-blue-500',
                description: input.description,
            })
            .select()
            .single();

        if (error) throw error;
        return data as DocumentGroup;
    },

    /**
     * Get all groups for a subcategory
     */
    async getGroupsBySubcategory(subcategoryId: string): Promise<GroupWithDocuments[]> {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        // Get groups
        const { data: groups, error } = await supabase
            .from('folders')
            .select('*')
            .eq('user_id', user.user.id)
            .eq('subcategory_id', subcategoryId)
            .eq('folder_type', 'group')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get document counts for each group
        const groupsWithCounts = await Promise.all(
            (groups || []).map(async (group) => {
                const { count } = await supabase
                    .from('documents')
                    .select('*', { count: 'exact', head: true })
                    .eq('folder_id', group.id)
                    .is('deleted_at', null);

                return {
                    ...group,
                    document_count: count || 0,
                } as GroupWithDocuments;
            })
        );

        return groupsWithCounts;
    },

    /**
     * Move documents to a group
     */
    async moveDocumentsToGroup(documentIds: string[], groupId: string): Promise<void> {
        const { error } = await supabase
            .from('documents')
            .update({ folder_id: groupId, updated_at: new Date().toISOString() })
            .in('id', documentIds);

        if (error) throw error;
    },

    /**
     * Remove documents from group (move back to subcategory root)
     */
    async removeDocumentsFromGroup(documentIds: string[]): Promise<void> {
        const { error } = await supabase
            .from('documents')
            .update({ folder_id: null, updated_at: new Date().toISOString() })
            .in('id', documentIds);

        if (error) throw error;
    },

    /**
     * Update a group
     */
    async updateGroup(groupId: string, updates: Partial<CreateGroupInput>): Promise<DocumentGroup> {
        const { data, error } = await supabase
            .from('folders')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', groupId)
            .select()
            .single();

        if (error) throw error;
        return data as DocumentGroup;
    },

    /**
     * Delete a group (soft delete)
     * Documents inside will be moved to subcategory root
     */
    async deleteGroup(groupId: string): Promise<void> {
        // First, move all documents out of the group
        const { error: moveError } = await supabase
            .from('documents')
            .update({ folder_id: null, updated_at: new Date().toISOString() })
            .eq('folder_id', groupId);

        if (moveError) throw moveError;

        // Soft delete the group
        const { error } = await supabase
            .from('folders')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', groupId);

        if (error) throw error;
    },

    /**
     * Get documents in a group
     */
    async getDocumentsInGroup(groupId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('folder_id', groupId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Check if a group has nominee access
     */
    async hasNomineeAccess(groupId: string): Promise<boolean> {
        const { count, error } = await supabase
            .from('access_controls')
            .select('*', { count: 'exact', head: true })
            .eq('resource_type', 'folder')
            .eq('resource_id', groupId);

        if (error) return false;
        return (count || 0) > 0;
    },

    /**
     * Grant access to a group for a nominee
     * This also grants inherited access to all documents in the group
     */
    async grantGroupAccess(groupId: string, nomineeId: string, accessLevel: 'view' | 'download' = 'view'): Promise<void> {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('access_controls')
            .upsert({
                user_id: user.user.id,
                nominee_id: nomineeId,
                resource_type: 'folder',
                resource_id: groupId,
                access_level: accessLevel,
            }, {
                onConflict: 'nominee_id,resource_type,resource_id,access_level'
            });

        if (error) throw error;
    },

    /**
     * Revoke access to a group for a nominee
     */
    async revokeGroupAccess(groupId: string, nomineeId: string): Promise<void> {
        const { error } = await supabase
            .from('access_controls')
            .delete()
            .eq('resource_type', 'folder')
            .eq('resource_id', groupId)
            .eq('nominee_id', nomineeId);

        if (error) throw error;
    },
};
