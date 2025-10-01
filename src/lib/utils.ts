import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './supabase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Function to get the mapped role name for a given system role
export async function getMappedRoleName(systemRole: string, accountId: string | null): Promise<string> {
  if (!systemRole || !accountId) {
    return formatRoleName(systemRole);
  }

  try {
    // Query the account_role_names table to find a custom name for this role in this account
    const { data, error } = await supabase
      .from('account_role_names')
      .select('custom_name, system_roles!inner(name)')
      .eq('account_id', accountId)
      .eq('is_active', true)
      .filter('system_roles.name', 'eq', systemRole)
      .maybeSingle();

    if (error) {
      console.error('Error fetching mapped role name:', error);
      return formatRoleName(systemRole);
    }

    // If a mapping exists, return the custom name, otherwise return the formatted system role
    return data?.custom_name || formatRoleName(systemRole);
  } catch (err) {
    console.error('Error in getMappedRoleName:', err);
    return formatRoleName(systemRole);
  }
}

// Helper function to format role names (capitalize first letter, replace hyphens with spaces)
export function formatRoleName(role: string): string {
  if (!role) return '';
  
  return role
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}