"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile, UserRole } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";
import React, { useEffect, useState } from "react";
import { FriendTabs } from "@/components/friend/FriendTabs";

const PLACEHOLDER_AVATAR = "/placeholder-avatar.png";

export const HomeScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 未ログインチェック
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // 🔍 検索
  const handleSearch = async () => {
    if (!searchText.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUser?.id)
        .eq("display_id", searchText.trim());

      if (error) throw error;

      setProfiles((data as Profile[]) || []);
    } catch (e) {
      console.error(e);
      alert("検索中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleUserClick = (user: Profile) => {
    navigate(`/users/${user.id}`);
  };

  const getRoleLabel = (role: string) => {
    if (role === UserRole.STORE) return "店舗";
    if (role === UserRole.CAST) return "キャスト";
    return "ユーザー";
  };

  if (!currentUser) return null;

  return (
    <div
      className="home-screen"
      style={{
        background: "#fff",      // ← 背景リセット（巨大アイコンを消す）
        minHeight: "100vh",
        paddingBottom: "140px",  // ← 固定FriendTabs + 下ナビ分の余白
        overflowY: "auto",       // ← スクロール可能
        position: "relative",
      }}
    >
      {/* タイトル */}
      <h2 className="home-title">探す</h2>

      {/* 🔍 検索ボックス */}
      <div className="home-search-box" style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="IDを入力..."
          className="home-search-input"
          style={{ flex: 1 }}
        />

        <button
          onClick={handleSearch}
          disabled={loading || !searchText.trim()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="検索"
        >
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
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>

      {/* 🔍 検索結果 */}
      <div className="home-list">
        {loading ? (
          <div className="p-4 text-center text-gray-400">検索中...</div>
        ) : !hasSearched ? (
          <div className="p-4 text-center text-gray-400">
            IDを入力して検索ボタンを押してください
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            該当するユーザーが見つかりません
          </div>
        ) : (
          profiles.map((p) => (
            <div
              key={p.id}
              className="home-user-card"
              onClick={() => handleUserClick(p)}
            >
              <img
                src={p.avatar_url || PLACEHOLDER_AVATAR}
                alt={p.name}
                className="home-avatar"
                onError={(e) =>
                  ((e.target as HTMLImageElement).src = PLACEHOLDER_AVATAR)
                }
              />

              <div className="home-user-info">
                <div className="home-user-name">
                  {p.name}
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    ID: {p.display_id}
                  </span>
                </div>
                <div className="home-user-caption">
                  {getRoleLabel(p.role)}
                  {p.bio && ` • ${p.bio}`}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🔥 友だちタブ（固定配置） */}
      <div style={{ marginTop: "32px" }}>
        <FriendTabs currentUser={currentUser} />
      </div>
    </div>
  );
};
