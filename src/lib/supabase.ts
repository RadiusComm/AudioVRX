import { createClient } from '@supabase/supabase-js';
import { User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;

  // Ensure we have a valid session after sign in
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Failed to establish session');
  }

  return { data, error };
}

export async function signUp(email: string, password: string, firstName?: string, lastName?: string) {
  const accountId = crypto.randomUUID();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        accountId: accountId
      },
      emailRedirectTo: undefined
    }
  });

  if (authError) throw authError;

  if (authData.user) {
    // Create profile as the authenticated user
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
          email: email,
          account_id: accountId
        }
      ]);

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw new Error('Failed to create user profile');
    }
  }

  return { data: authData, error: null };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error || !data) {
    throw new Error(`Profile not found for user ${userId}`);
  }
  
  // Get mapped role name if available
  if (data.account_id) {
    try {
      const { data: roleMapping, error: roleMappingError } = await supabase
        .from('account_role_names')
        .select('custom_name, system_roles!inner(name)')
        .eq('account_id', data.account_id)
        .eq('is_active', true)
        .filter('system_roles.name', 'eq', data.role).maybeSingle();
                
      if (!roleMappingError && roleMapping) {
        data.mappedRoleName = roleMapping.custom_name;
      }
    } catch (err) {
      console.error('Error fetching role mapping:', err);
    }
  }
  
  return data;
}

export async function getAllUsers() {
  try {
    // Get current user to check if super admin
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    // Get current user's profile to check role and accountId
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, account_id')
      .eq('id', currentUser.id)
      .maybeSingle();
      
    if (profileError || !currentProfile) {
      throw new Error('Current user profile not found');
    }
    
    // Get auth users data
    const { data: authUsers, error: authError } = await supabase
      .rpc('get_auth_users');

    if (authError) throw authError;

    // Get profiles data with filtering based on role
    let query = supabase.from('profiles').select('*');
    
    // If not super admin, filter by account_id
    if (currentProfile.role !== 'super-admin') {
      query = query.eq('account_id', currentProfile.account_id);
    }
    
    const { data: profiles, error: profilesError } = await query;

    if (profilesError) throw profilesError;

    if (!profiles || !authUsers) {
      return [];
    }

    // Get user store assignments
    const { data: storeAssignments, error: storeError } = await supabase
      .from('user_store_assignments')
      .select('user_id, store_id, stores:store_id(store_id, name)');

    if (storeError) {
      console.error('Error fetching store assignments:', storeError);
    }

    // Create a map of user_id to store_ids
    const userStoreMap = new Map();
    if (storeAssignments) {
      storeAssignments.forEach(assignment => {
        if (!userStoreMap.has(assignment.user_id)) {
          userStoreMap.set(assignment.user_id, []);
        }
        userStoreMap.get(assignment.user_id).push({
          id: assignment.store_id,
          storeId: assignment.stores?.store_id,
          name: assignment.stores?.name
        });
      });
    }
    
    // Get role mappings for the current account
    const { data: roleMappings, error: roleMappingsError } = await supabase
      .from('account_role_names')
      .select('custom_name, system_roles!system_role_id(name)')
      .eq('account_id', currentProfile.account_id)
      .eq('is_active', true);
      
    if (roleMappingsError) {
      console.error('Error fetching role mappings:', roleMappingsError);
    }
    
    // Create a map of role name to custom name
    const roleNameMap = new Map();
    if (roleMappings) {
      roleMappings.forEach(mapping => {
        if (mapping.system_roles?.name) {
          roleNameMap.set(mapping.system_roles.name, mapping.custom_name);
        }
      });
    }

    // Combine auth and profile data
    return profiles.map(profile => {
      const authUser = authUsers.find(u => u.id === profile.id);
      const userStores = userStoreMap.get(profile.id) || [];
      const storeIds = userStores.map(store => store.id);
      const mappedRoleName = roleNameMap.get(profile.role);
      
      return {
        id: profile.id,
        email: authUser?.email || profile.email || '',
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        role: profile.role,
        mappedRoleName: mappedRoleName,
        avatarUrl: profile.avatar_url,
        lastActive: profile.last_active,
        status: profile.status,
        completedScenarios: profile.completed_scenarios,
        averageScore: profile.average_score,
        is_banned: profile.is_banned,
        in_game_currency: profile.in_game_currency,
        username: profile.username,
        storeIds: storeIds,
        stores: userStores,
        accountId: profile.account_id
      };
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  
  if (error) throw error;
  return data;
}

export async function uploadAvatar(userId: string, file: File) {
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  
  // Validate file type
  if (!['jpg', 'jpeg', 'png'].includes(fileExt || '')) {
    throw new Error('Only JPG and PNG files are allowed');
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  const fileName = `${userId}/${Math.random()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl }, error: urlError } = await supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  if (urlError) throw urlError;

  return publicUrl;
}

export async function uploadPersonaImage(userId: string, file: File) {
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  
  // Validate file type
  if (!['jpg', 'jpeg', 'png'].includes(fileExt || '')) {
    throw new Error('Only JPG and PNG files are allowed');
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  const fileName = `${userId}/${Math.random()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('scenario-images')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl }, error: urlError } = await supabase.storage
    .from('scenario-images')
    .getPublicUrl(fileName);

  if (urlError) throw urlError;

  return publicUrl;
}