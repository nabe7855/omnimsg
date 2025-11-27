"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile, UserRole } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";
import React, { useEffect, useState } from "react";

// 画像がない場合のフォールバック
const PLACEHOLDER_AVATAR = "/placeholder-avatar.png";

export const HomeScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // 検索を実行したかどうかのフラグ

  // ============================
  // 認証チェック
  // ============================
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // ============================
  // 検索実行関数（ボタンクリック時に発火）
  // ============================
  const handleSearch = async () => {
    if (!searchText.trim()) return;

    setLoading(true);
    setHasSearched(true); // 検索実行済みにする

    try {
      // IDの完全一致で検索
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUser?.id)
        .eq("display_id", searchText.trim()); // ここで完全一致検索

      if (error) throw error;
      setProfiles((data as Profile[]) || []);
    } catch (e) {
      console.error("Search error:", e);
      alert("検索中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // Enterキーでも検索できるようにする
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // ============================
  // プロフィール詳細へ遷移
  // ============================
  const handleUserClick = (targetUser: Profile) => {
    navigate(`/users/${targetUser.id}`);
  };

  const getRoleLabel = (role: string) => {
    if (role === UserRole.STORE) return "店舗";
    if (role === UserRole.CAST) return "キャスト";
    return "ユーザー";
  };

  if (!currentUser) return null;

  return (
    <div className="home-screen">
      <h2 className="home-title">探す</h2>

      {/* 検索ボックスとボタンのレイアウト */}
      <div className="home-search-box" style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="IDを入力..."
          className="home-search-input"
          style={{ flex: 1 }} // 入力欄を可能な限り広げる
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
          {/* 虫眼鏡アイコン (SVG) */}
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
            className="text-gray-600"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>

      <div className="home-list">
        {loading ? (
          <div className="p-4 text-center text-gray-400">検索中...</div>
        ) : !hasSearched ? (
          // まだ検索ボタンを押していない場合
          <div className="p-4 text-center text-gray-400">
            IDを入力して検索ボタンを押してください
          </div>
        ) : profiles.length === 0 ? (
          // 検索したが結果が0件の場合
          <div className="p-4 text-center text-gray-400">
            該当するユーザーが見つかりません
          </div>
        ) : (
          // 検索結果がある場合
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
    </div>
  );
};
