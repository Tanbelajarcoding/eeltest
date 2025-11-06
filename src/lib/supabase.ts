import { createClient } from "@supabase/supabase-js";

// Extract Supabase URL and key from DATABASE_URL
// Format: postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.co:6543/postgres
const getDatabaseUrl = () => {
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

  // Extract project reference from URL
  // Example: postgres.ljildxhaxtqacahrurng from the connection string
  const match = dbUrl.match(/postgres\.([^:]+):/);
  const projectRef = match ? match[1] : "";

  return {
    url: projectRef ? `https://${projectRef}.supabase.co` : "",
    projectRef,
  };
};

const { url: supabaseUrl, projectRef } = getDatabaseUrl();

// For Supabase Storage, we need the anon key
// This should be set in environment variables
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create Supabase client for storage operations
export const supabase =
  supabaseAnonKey && supabaseUrl
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const STORAGE_BUCKET = "drawings";

// Helper to get public URL for uploaded files
export function getPublicUrl(path: string) {
  if (!supabase) return path;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
