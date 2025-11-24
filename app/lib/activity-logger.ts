import { supabase } from '@/app/client/supabase';
import { Database } from '@/database.types';
import { createClient } from '@supabase/supabase-js';

// Create a service role client for server-side logging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE!;
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'send'
  | 'view';

export type ActivityModule =
  | 'user'
  | 'admin'
  | 'alert'
  | 'evacuation'
  | 'rescue'
  | 'report'
  | 'chat'
  | 'setting';

interface LogActivityParams {
  action: ActivityAction;
  module: ActivityModule;
  description: string;
  userId?: string;
}

/**
 * Log an activity to the logs table
 * @param action - The action performed (create, update, delete, etc.)
 * @param module - The module where the action was performed
 * @param description - Detailed description of the action
 * @param userId - Optional user ID (will fetch from session if not provided)
 */
export async function logActivity({
  action,
  module,
  description,
  userId,
}: LogActivityParams): Promise<void> {
  try {
    let currentUserId = userId;

    // If userId not provided, try to get from session
    if (!currentUserId) {
      // Try getting from cookies (server-side)
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();

        // Get all cookies and look for Supabase auth token
        const allCookies = cookieStore.getAll();
        const authCookie = allCookies.find(
          (c) => c.name.includes('auth-token') || c.name.includes('sb-'),
        );

        if (authCookie) {
          const {
            data: { user },
          } = await supabaseAdmin.auth.getUser(authCookie.value);
          currentUserId = user?.id;
        }
      } catch {
        // If cookies don't work, try client-side supabase
        const {
          data: { user },
        } = await supabase.auth.getUser();
        currentUserId = user?.id;
      }
    }

    const content = `[${module.toUpperCase()}] ${action.toUpperCase()}: ${description}`;

    if (!currentUserId) {
      console.warn('⚠️ Cannot log activity - no user ID available:', content);
      return;
    }

    console.log(`📝 Logging activity for user: ${currentUserId}`);

    // Insert log into database using admin client (bypasses RLS)
    const { error } = await supabaseAdmin.from('logs').insert({
      content,
      user: currentUserId,
    });

    if (error) {
      console.error('❌ Failed to log activity:', error);
    } else {
      console.log('✅ Activity logged:', content);
    }
  } catch (error) {
    console.error('❌ Error in logActivity:', error);
  }
}

/**
 * Helper function to log user/admin management actions
 */
export const logUserAction = (
  action: ActivityAction,
  targetName: string,
  details?: string,
  userId?: string,
) => {
  const description = details
    ? `${targetName} - ${details}`
    : `${
        action === 'create' ? 'Created' : action === 'update' ? 'Updated' : 'Deleted'
      } user: ${targetName}`;

  return logActivity({
    action,
    module: 'user',
    description,
    userId,
  });
};

/**
 * Helper function to log alert actions
 */
export const logAlertAction = (
  action: ActivityAction,
  alertLevel: string,
  location: string,
  details?: string,
  userId?: string,
) => {
  const description = details
    ? `${details}`
    : `${
        action === 'create' ? 'Created' : action === 'update' ? 'Updated' : 'Deleted'
      } ${alertLevel} alert for ${location}`;

  return logActivity({
    action,
    module: 'alert',
    description,
    userId,
  });
};

/**
 * Helper function to log evacuation center actions
 */
export const logEvacuationAction = (
  action: ActivityAction,
  centerName: string,
  details?: string,
  userId?: string,
) => {
  const description = details
    ? `${details}`
    : `${
        action === 'create' ? 'Created' : action === 'update' ? 'Updated' : 'Deleted'
      } evacuation center: ${centerName}`;

  return logActivity({
    action,
    module: 'evacuation',
    description,
    userId,
  });
};

/**
 * Helper function to log rescue operation actions
 */
export const logRescueAction = (
  action: ActivityAction,
  rescueId: number,
  details?: string,
  userId?: string,
) => {
  const description = details
    ? `${details}`
    : `${
        action === 'create'
          ? 'Created'
          : action === 'update'
          ? 'Updated'
          : action === 'approve'
          ? 'Approved'
          : action === 'reject'
          ? 'Rejected'
          : 'Deleted'
      } rescue request #${rescueId}`;

  return logActivity({
    action,
    module: 'rescue',
    description,
    userId,
  });
};

/**
 * Helper function to log report actions
 */
export const logReportAction = (action: ActivityAction, reportId: number, details?: string) => {
  const description = details
    ? `${details}`
    : `${action === 'delete' ? 'Deleted reported post' : 'Viewed report'} #${reportId}`;

  return logActivity({
    action,
    module: 'report',
    description,
  });
};

/**
 * Helper function to log admin management actions
 */
export const logAdminAction = (
  action: ActivityAction,
  targetName: string,
  modules?: string[],
  userId?: string,
) => {
  const modulesList = modules ? ` with modules: ${modules.join(', ')}` : '';
  const description = `${
    action === 'create' ? 'Created' : action === 'update' ? 'Updated' : 'Deleted'
  } admin: ${targetName}${modulesList}`;

  return logActivity({
    action,
    module: 'admin',
    description,
    userId,
  });
};
