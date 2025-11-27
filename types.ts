/**
 * Role Definitions
 */
export enum UserRole {
  USER = 'user',
  CAST = 'cast',
  STORE = 'store'
}

/**
 * Message Type Definitions
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  BOT_RESPONSE = 'bot_response'
}

/**
 * User/Store/Cast Profile Interface
 * Corresponds to 'profiles' table in Supabase
 */
export interface Profile {
  id: string;
  role: UserRole;
  display_id: string; // Unique search ID
  name: string;
  avatar_url: string;
  email?: string;
  password?: string;
  bio?: string;
  store_id?: string | null; // For Casts belonging to a store
  birthday?: string; // Users only
  business_hours?: string; // Stores only
  is_blocked?: boolean;
}

/**
 * Chat Room Interface
 * Corresponds to 'rooms' table
 */
export interface Room {
  id: string;
  type: 'dm' | 'group';
  member_ids: string[];
  group_name?: string; // For group chats
  last_message?: string;
  updated_at: string;
}

/**
 * Chat Message Interface
 * Corresponds to 'messages' table
 */
export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  media_url?: string;
  created_at: string;
}

/**
 * Store Rich Menu Configuration
 * Corresponds to 'store_rich_menus' table
 */
export interface RichMenuItem {
  id: string;
  store_id: string;
  label: string;
  response_text: string;
  display_order: number;
}

/**
 * Extended Room interface for UI display
 */
export interface RoomWithPartner extends Room {
  partner?: Profile; // For DM, this is the other person. For Group, this might be null.
}