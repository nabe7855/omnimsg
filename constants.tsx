import type { Profile, RichMenuItem } from "./lib/types";
import { UserRole } from "./lib/types";

// --- アプリケーション基本情報 ---
export const APP_NAME = "OmniMsg";

// --- モック画像 ---
export const MOCK_AVATARS = {
  USER: "https://picsum.photos/200/200?random=1",
  CAST: "https://picsum.photos/200/200?random=2",
  STORE: "https://picsum.photos/200/200?random=3",
  DEFAULT: "https://picsum.photos/200/200?random=4",
};

// --- 初期データ (データベースが空の際に使用) ---
export const INITIAL_PROFILES: Profile[] = [
  {
    id: "user-1",
    role: UserRole.USER,
    display_id: "guest001",
    name: "山田 太郎",
    email: "user@example.com",
    avatar_url: MOCK_AVATARS.USER,
    bio: "楽しい時間を過ごしたいです。",
    birthday: "1990-01-01",
  },
  {
    id: "store-1",
    role: UserRole.STORE,
    display_id: "club_paradise",
    name: "Club Paradise",
    email: "store@example.com",
    avatar_url: MOCK_AVATARS.STORE,
    bio: "東京で最高のプレミアムラウンジ。",
    business_hours: "20:00 - 05:00",
  },
  {
    id: "cast-1",
    role: UserRole.CAST,
    display_id: "sakura_p",
    name: "さくら",
    email: "cast1@store.com",
    store_id: "store-1",
    avatar_url: MOCK_AVATARS.CAST,
    bio: "おしゃべりしましょ！ <3",
  },
  {
    id: "cast-2",
    role: UserRole.CAST,
    display_id: "yuna_p",
    name: "ユナ",
    email: "cast2@store.com",
    store_id: "store-1",
    avatar_url: MOCK_AVATARS.CAST,
    bio: "新人です！よろしくお願いします。",
  },
];

export const INITIAL_RICH_MENUS: RichMenuItem[] = [
  {
    id: "rm-1",
    store_id: "store-1",
    label: "予約する",
    response_text:
      "興味を持っていただきありがとうございます！ご希望の日時を教えてください。",
    display_order: 1,
  },
  {
    id: "rm-2",
    store_id: "store-1",
    label: "料金システム",
    response_text: "基本セットは60分 10,000円です。VIPルームもございます。",
    display_order: 2,
  },
  {
    id: "rm-3",
    store_id: "store-1",
    label: "本日の出勤",
    response_text:
      "本日はさくら、ユナ、アオイが出勤しています。誰をご指名ですか？",
    display_order: 3,
  },
  {
    id: "rm-4",
    store_id: "store-1",
    label: "ご意見・ご要望",
    response_text:
      "不手際があり申し訳ございません。担当者がすぐに確認いたします。",
    display_order: 4,
  },
];

// --- デザイン・カラー設定 ---
export const COLORS = {
  creator: {
    primary: "#4c1d95", // Deep Purple
    accent: "#f59e0b", // Gold
    bg: "bg-violet-900",
    text: "text-white",
  },
  user: {
    primary: "#f472b6", // Pink
    accent: "#2dd4bf", // Mint
    bg: "bg-pink-50",
    text: "text-gray-800",
  },
  safety: {
    green: "#10b981",
    blue: "#3b82f6",
  },
};

// --- アイコンコンポーネント ---
import React from "react";

export const Icons = {
  Mic: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  ),
  Send: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Trash: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Users: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Lock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Shield: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Alert: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  CheckCircle: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};
