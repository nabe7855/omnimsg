import { UserRole } from "@/lib/types";

/**
 * Profile（プロファイル）データ
 * Supabaseの `profiles` テーブルに完全対応
 */
export interface Profile {
  id: string;
  role: UserRole;
  display_id: string;
  name: string;
  avatar_url: string | null;

  // オプション項目
  email?: string | null;
  password?: string | null;
  bio?: string | null;

  // CAST 用
  store_id?: string | null;

  // USER 用
  birthday?: string | null;

  // STORE 用
  business_hours?: string | null;
  address?: string | null;        // ← NEW
  phone_number?: string | null;   // ← NEW
  website_url?: string | null;    // ← NEW

  // ブロック管理
  is_blocked?: boolean;

  // Supabase の timestamp
  created_at?: string;
}
