import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const permissionService = {
  async getUserPermissions(userId: string): Promise<string[]> {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user) return [];

    const { data: permissions } = await supabase
      .from('role_permissions')
      .select(`
        permissions (
          name
        )
      `)
      .eq('role', user.role);

    return permissions?.map(p => p.permissions.name) || [];
  },

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }
};