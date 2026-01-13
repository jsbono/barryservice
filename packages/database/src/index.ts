/**
 * MotorAI Database Client
 * Supabase client setup and exports
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Re-export all types
export * from './types';

// ============================================
// Environment Configuration
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================
// Client Types
// ============================================

export type TypedSupabaseClient = SupabaseClient<Database>;

// ============================================
// Client Creation Functions
// ============================================

/**
 * Creates a Supabase client with the anon key
 * Use this for client-side operations with RLS
 */
export function createSupabaseClient(): TypedSupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set SUPABASE_URL and SUPABASE_ANON_KEY (or NEXT_PUBLIC_* variants).'
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Creates a Supabase client with the service role key
 * Use this for server-side operations that bypass RLS
 * WARNING: Never expose this client to the browser
 */
export function createSupabaseAdminClient(): TypedSupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing Supabase admin environment variables. ' +
      'Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a Supabase client with custom options
 */
export function createCustomSupabaseClient(
  url: string,
  key: string,
  options?: Parameters<typeof createClient>[2]
): TypedSupabaseClient {
  return createClient<Database>(url, key, options);
}

// ============================================
// Singleton Clients (Optional)
// ============================================

let supabaseClient: TypedSupabaseClient | null = null;
let supabaseAdminClient: TypedSupabaseClient | null = null;

/**
 * Gets or creates a singleton Supabase client
 * Useful for client-side React applications
 */
export function getSupabaseClient(): TypedSupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  return supabaseClient;
}

/**
 * Gets or creates a singleton Supabase admin client
 * Only use server-side
 */
export function getSupabaseAdminClient(): TypedSupabaseClient {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createSupabaseAdminClient();
  }
  return supabaseAdminClient;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Helper to handle Supabase errors consistently
 */
export function handleSupabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'message' in error) {
    throw new Error(`Database error: ${(error as { message: string }).message}`);
  }
  throw new Error('Unknown database error occurred');
}

/**
 * Type guard to check if a response has data
 */
export function hasData<T>(
  response: { data: T | null; error: unknown }
): response is { data: T; error: null } {
  return response.data !== null && response.error === null;
}

/**
 * Wrapper for Supabase queries with better error handling
 */
export async function query<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>
): Promise<T> {
  const response = await queryFn();

  if (response.error) {
    handleSupabaseError(response.error);
  }

  if (response.data === null) {
    throw new Error('No data returned from query');
  }

  return response.data;
}

// ============================================
// Table Names (for reference)
// ============================================

export const TABLE_NAMES = {
  CUSTOMERS: 'customers',
  VEHICLES: 'vehicles',
  MECHANICS: 'mechanics',
  SERVICE_RECORDS: 'service_records',
  PARTS: 'parts',
  SERVICE_RECORD_PARTS: 'service_record_parts',
  INVOICES: 'invoices',
  SERVICE_SCHEDULES: 'service_schedules',
  NOTIFICATIONS: 'notifications',
} as const;

export const VIEW_NAMES = {
  VEHICLE_SERVICE_HISTORY: 'vehicle_service_history',
  UPCOMING_SERVICE_DUE: 'upcoming_service_due',
  INVOICE_SUMMARY: 'invoice_summary',
} as const;

// ============================================
// Default Export
// ============================================

export default {
  createSupabaseClient,
  createSupabaseAdminClient,
  createCustomSupabaseClient,
  getSupabaseClient,
  getSupabaseAdminClient,
  handleSupabaseError,
  hasData,
  query,
  TABLE_NAMES,
  VIEW_NAMES,
};
