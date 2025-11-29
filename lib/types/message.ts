/**
 * メッセージの種類
 * - TEXT: テキスト
 * - IMAGE: 画像
 * - AUDIO: 音声
 * - BOT_RESPONSE: AI応答などの自動メッセージ
 */
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  AUDIO = "audio",
  BOT_RESPONSE = "bot_response",
}

/**
 * Message（メッセージ）データ
 * Supabase の `messages` テーブルに対応
 */
export interface Message {
  id: string;
  room_id: string; // どのルームに紐づくか
  sender_id: string; // 送信者ID
  content: string;
  message_type: MessageType;
  media_url?: string; // 画像・音声のURL
  created_at: string;
  link_url?: string;
}
