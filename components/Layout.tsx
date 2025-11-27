"use client";

import React from "react";
import { Profile, UserRole, NavItem } from "../lib/types";

interface LayoutProps {
  children: React.ReactNode;
  currentUser: Profile | null;
  currentPath: string;
  onNavigate: (path: string) => void;
}

// --------------------
// SVG Icons
// --------------------
const HomeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="nav-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const ChatIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="nav-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-2.281l-9.8-9.8c-.641-.641-1.614-.72-2.316-.145a5.558 5.558 0 0 0-1.897 4.549v.21c0 .762.36 1.481.977 1.957.653.504 1.396.883 2.193 1.112.186.054.379.102.574.145M12 21a9.004 9.004 0 0 1-5.35-1.745L3 21l1.75-4.033a8.995 8.995 0 0 1-1.378-5.234" />
  </svg>
);

const ProfileIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="nav-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const UsersIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="nav-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const MenuIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="nav-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5" />
  </svg>
);

// --------------------
// Layout Component
// --------------------
export const Layout: React.FC<LayoutProps> = ({
  children,
  currentUser,
  currentPath,
  onNavigate
}) => {

  const renderNavItems = () => {
    if (!currentUser) return null;

    const role = currentUser.role;

    // 共通項目
    const talkItem: NavItem = { id: "/talks", label: "トーク", icon: <ChatIcon /> };
    const profileItem: NavItem = { id: "/profile", label: "マイページ", icon: <ProfileIcon /> };

    // ★ NavItem 型を付ける（ここが修正ポイント）
    let items: NavItem[] = [];

    if (role === UserRole.USER) {
      items = [
        { id: "/home", label: "ホーム", icon: <HomeIcon /> },
        talkItem,
        profileItem
      ];
    } else if (role === UserRole.CAST) {
      items = [talkItem, profileItem];
    } else if (role === UserRole.STORE) {
      items = [
        { id: "/store/casts", label: "キャスト管理", icon: <UsersIcon /> },
        talkItem,
        { id: "/store/menu", label: "メニュー設定", icon: <MenuIcon /> },
        profileItem
      ];
    }

    return items.map((item) => (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className={`nav-item ${
          currentPath === item.id ||
          currentPath.startsWith(item.id + "/")
            ? "active"
            : ""
        }`}
      >
        {item.icon}
        <span className="nav-label">{item.label}</span>
      </button>
    ));
  };

  return (
    <div className="app-container">
      <div className="content-area">{children}</div>

      {currentUser && (
        <nav className="bottom-nav">{renderNavItems()}</nav>
      )}
    </div>
  );
};
