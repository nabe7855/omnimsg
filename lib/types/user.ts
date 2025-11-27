/**
 * ユーザーの役割（ロール）
 * - USER: 一般ユーザー
 * - CAST: キャスト
 * - STORE: 店舗アカウント
 */
export enum UserRole {
  USER = "user",
  CAST = "cast",
  STORE = "store",
}

/**
 * Profile（プロファイル）データ
 * Supabaseの `profiles` テーブルに対応
 *
 * ・ユーザー、キャスト、店舗すべてがこの形を使う
 * ・role によって利用するプロパティが変わる（例: business_hours は STORE 用）
 */
export interface Profile {
  id: string;
  role: UserRole;
  display_id: string; // 検索用のユニークID
  name: string;
  avatar_url: string;

  // オプション項目
  email?: string;
  password?: string;
  bio?: string;

  // CAST 用：どの店舗に所属しているか
  store_id?: string | null;

  // USER 用：誕生日など
  birthday?: string;

  // STORE 用：営業時間
  business_hours?: string;

  // ブロック管理（システム用）
  is_blocked?: boolean;
}
