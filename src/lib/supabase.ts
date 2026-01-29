import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 클라이언트 사이드 Supabase 클라이언트
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// 서버 사이드 Supabase 클라이언트 (서비스 롤)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// 티어별 제한
export const TIER_LIMITS = {
  free: { monthlyGenerations: 5, platforms: 3 },
  creator: { monthlyGenerations: 100, platforms: 5 },
  pro: { monthlyGenerations: Infinity, platforms: 5 },
  agency: { monthlyGenerations: Infinity, platforms: 5 },
} as const;

export type Tier = keyof typeof TIER_LIMITS;
