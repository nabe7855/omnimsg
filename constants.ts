import { Profile, UserRole, RichMenuItem } from './types';

export const APP_NAME = "OmniMsg";

// Mock Avatars
export const MOCK_AVATARS = {
  USER: "https://picsum.photos/200/200?random=1",
  CAST: "https://picsum.photos/200/200?random=2",
  STORE: "https://picsum.photos/200/200?random=3",
  DEFAULT: "https://picsum.photos/200/200?random=4"
};

// Initial Mock Data to populate the "Database" if empty
export const INITIAL_PROFILES: Profile[] = [
  // Users
  {
    id: 'user-1',
    role: UserRole.USER,
    display_id: 'guest001',
    name: '山田 太郎',
    email: 'user@example.com',
    avatar_url: MOCK_AVATARS.USER,
    bio: '楽しい時間を過ごしたいです。',
    birthday: '1990-01-01'
  },
  // Stores
  {
    id: 'store-1',
    role: UserRole.STORE,
    display_id: 'club_paradise',
    name: 'Club Paradise',
    email: 'store@example.com',
    avatar_url: MOCK_AVATARS.STORE,
    bio: '東京で最高のプレミアムラウンジ。',
    business_hours: '20:00 - 05:00'
  },
  // Casts
  {
    id: 'cast-1',
    role: UserRole.CAST,
    display_id: 'sakura_p',
    name: 'さくら',
    email: 'cast1@store.com',
    store_id: 'store-1',
    avatar_url: MOCK_AVATARS.CAST,
    bio: 'おしゃべりしましょ！ <3'
  },
  {
    id: 'cast-2',
    role: UserRole.CAST,
    display_id: 'yuna_p',
    name: 'ユナ',
    email: 'cast2@store.com',
    store_id: 'store-1',
    avatar_url: MOCK_AVATARS.CAST,
    bio: '新人です！よろしくお願いします。'
  }
];

export const INITIAL_RICH_MENUS: RichMenuItem[] = [
  {
    id: 'rm-1',
    store_id: 'store-1',
    label: '予約する',
    response_text: '興味を持っていただきありがとうございます！ご希望の日時を教えてください。',
    display_order: 1
  },
  {
    id: 'rm-2',
    store_id: 'store-1',
    label: '料金システム',
    response_text: '基本セットは60分 10,000円です。VIPルームもございます。',
    display_order: 2
  },
  {
    id: 'rm-3',
    store_id: 'store-1',
    label: '本日の出勤',
    response_text: '本日はさくら、ユナ、アオイが出勤しています。誰をご指名ですか？',
    display_order: 3
  },
  {
    id: 'rm-4',
    store_id: 'store-1',
    label: 'ご意見・ご要望',
    response_text: '不手際があり申し訳ございません。担当者がすぐに確認いたします。',
    display_order: 4
  }
];