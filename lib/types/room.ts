import { Profile } from "./user";

/**
 * Room（チャットルーム）データ  
 * Supabase の `rooms` テーブルに対応
 *
 * type:
 * - dm: 1対1チャット
 * - group: 複数人グループチャット
 */
export interface Room {
  id: string;
  type: "dm" | "group";
  member_ids: string[]; // メンバーID一覧
  group_name?: string; // グループチャットの場合
  last_message?: string;
  updated_at: string;
}

/**
 * UI表示のための拡張型（DBに存在しない）  
 * `partner` は DM の「相手のプロフィール」
 */
export interface RoomWithPartner extends Room {
  partner?: Profile;
}
