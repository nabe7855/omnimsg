/**
 * 店舗のリッチメニュー設定  
 * Supabase の `store_rich_menus` テーブルに対応
 *
 * 店舗が設定する「定型文ボタン」などを管理するデータ構造
 */
export interface RichMenuItem {
  id: string;
  store_id: string;
  label: string;        // ボタンに表示するテキスト
  response_text: string; // 押したときに自動送信するテキスト
  display_order: number; // 表示順
}
