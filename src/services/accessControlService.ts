import { supabase } from "@/integrations/supabase/client";
import {
  AccessLevel,
  NomineeAccess,
  AccessSummary
} from '../types/access';

export const accessControlService = {
  // Get all nominees with their access status for a resource
  async getAccessSummary(
    resourceType: AccessLevel,
    resourceId: string
  ): Promise<AccessSummary> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get all nominees for this user
      const { data: nominees, error: nomineesError } = await supabase
        .from('nominees')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (nomineesError) throw nomineesError;

      // Get access controls for this resource
      const { data: accessControls, error: accessError } = await supabase
        .from('access_controls')
        .select('*')
        .eq('user_id', user.id)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId);

      if (accessError) throw accessError;

      const accessDetails: NomineeAccess[] = (nominees || []).map((nominee) => ({
        nomineeId: nominee.id,
        nomineeName: nominee.full_name,
        nomineeEmail: nominee.email,
        nomineeAvatar: undefined,
        hasAccess: (accessControls || []).some(
          (access) => access.nominee_id === nominee.id
        ),
      }));

      return {
        totalNominees: nominees?.length || 0,
        nomineesWithAccess: accessDetails.filter(n => n.hasAccess).length,
        accessDetails,
      };
    } catch (error) {
      console.error('Error getting access summary:', error);
      return {
        totalNominees: 0,
        nomineesWithAccess: 0,
        accessDetails: [],
      };
    }
  },

  // Grant access to a nominee for a resource
  async grantAccess(
    resourceType: AccessLevel,
    resourceId: string,
    nomineeId: string,
    accessLevel: 'view' | 'download' = 'view'
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('access_controls')
        .insert({
          user_id: user.id,
          nominee_id: nomineeId,
          resource_type: resourceType,
          resource_id: resourceId,
          access_level: accessLevel,
        });

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
    } catch (error) {
      console.error('Error granting access:', error);
      throw error;
    }
  },

  // Revoke access from a nominee for a resource
  async revokeAccess(
    resourceType: AccessLevel,
    resourceId: string,
    nomineeId: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('access_controls')
        .delete()
        .eq('user_id', user.id)
        .eq('nominee_id', nomineeId)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error revoking access:', error);
      throw error;
    }
  },

  // Toggle access for a nominee
  async toggleAccess(
    resourceType: AccessLevel,
    resourceId: string,
    nomineeId: string,
    grant: boolean
  ): Promise<void> {
    if (grant) {
      await this.grantAccess(resourceType, resourceId, nomineeId);
    } else {
      await this.revokeAccess(resourceType, resourceId, nomineeId);
    }
  },

  // Check if a nominee has access to a resource (including inherited access)
  async hasAccess(
    resourceType: AccessLevel,
    resourceId: string,
    nomineeId: string,
    categoryId?: string,
    subcategoryId?: string
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check direct access
      const { data: directAccess } = await supabase
        .from('access_controls')
        .select('id')
        .eq('user_id', user.id)
        .eq('nominee_id', nomineeId)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .single();

      if (directAccess) return true;

      // Check inherited access (category -> subcategory -> document)
      if (resourceType === 'document' && categoryId) {
        const { data: categoryAccess } = await supabase
          .from('access_controls')
          .select('id')
          .eq('user_id', user.id)
          .eq('nominee_id', nomineeId)
          .eq('resource_type', 'category')
          .eq('resource_id', categoryId)
          .single();

        if (categoryAccess) return true;

        if (subcategoryId) {
          const { data: subcategoryAccess } = await supabase
            .from('access_controls')
            .select('id')
            .eq('user_id', user.id)
            .eq('nominee_id', nomineeId)
            .eq('resource_type', 'subcategory')
            .eq('resource_id', subcategoryId)
            .single();

          if (subcategoryAccess) return true;
        }
      }

      if (resourceType === 'subcategory' && categoryId) {
        const { data: categoryAccess } = await supabase
          .from('access_controls')
          .select('id')
          .eq('user_id', user.id)
          .eq('nominee_id', nomineeId)
          .eq('resource_type', 'category')
          .eq('resource_id', categoryId)
          .single();

        if (categoryAccess) return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  },

  // Get all resources a nominee has access to
  async getNomineeAccessibleResources(
    resourceType: AccessLevel,
    nomineeId: string
  ): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('access_controls')
        .select('resource_id')
        .eq('user_id', user.id)
        .eq('nominee_id', nomineeId)
        .eq('resource_type', resourceType);

      if (error) throw error;

      return (data || []).map(access => access.resource_id);
    } catch (error) {
      console.error('Error getting accessible resources:', error);
      return [];
    }
  },

  // Clear all access for a resource (useful when deleting)
  async clearAllAccess(resourceType: AccessLevel, resourceId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('access_controls')
        .delete()
        .eq('user_id', user.id)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing access:', error);
      throw error;
    }
  },

  // Bulk grant access
  async bulkGrantAccess(
    resourceType: AccessLevel,
    resourceId: string,
    nomineeIds: string[]
  ): Promise<void> {
    for (const nomineeId of nomineeIds) {
      await this.grantAccess(resourceType, resourceId, nomineeId);
    }
  },

  // Bulk revoke access
  async bulkRevokeAccess(
    resourceType: AccessLevel,
    resourceId: string,
    nomineeIds: string[]
  ): Promise<void> {
    for (const nomineeId of nomineeIds) {
      await this.revokeAccess(resourceType, resourceId, nomineeId);
    }
  },
};
