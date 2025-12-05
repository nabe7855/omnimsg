"use client";

import { FriendTabs } from "@/components/friend/FriendTabs";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";
import React, { useEffect, useState } from "react";

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
    // currentUserがnullでも、まだ読み込み中の可能性があるので即リダイレクトしない
    // 親コンポーネント(page.tsx)側でリダイレクト制御している場合はここは補助的な役割
    if (currentUser === null) {
      // 少し待ってもnullなら飛ばす、などの処理でもよいが、
      // 基本は親側のAuthガードに任せるのが安全
    }
  }, [currentUser, navigate]);

  // 🔍 検索
  const handleSearch = async () => {
    if (!searchText.trim() || !currentUser) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUser.id) // 自分以外
        .eq("display_id", searchText.trim()); // 完全一致検索

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

  // ▼ 修正: Roleの大文字小文字を吸収して判定
  const getRoleLabel = (role: string) => {
    const r = role?.toLowerCase();
    // UserRole.STORE が "STORE" だとしても "store" と比較できるようにする
    if (r === "store") return "店舗";
    if (r === "cast") return "キャスト";
    return "ユーザー";
  };

  // ▼ 修正: currentUserがない場合も「真っ白」にせずローディングを表示
  if (!currentUser) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div
      className="home-screen"
      style={{
        background: "#fff",
        minHeight: "100vh",
        paddingBottom: "140px",
        overflowY: "auto",
        position: "relative",
      }}
    >
      {/* タイトル */}
      <h2
        className="home-title"
        style={{ padding: "20px", fontSize: "20px", fontWeight: "bold" }}
      >
        探す
      </h2>

      {/* 🔍 検索ボックス */}
      <div
        className="home-search-box"
        style={{
          display: "flex",
          gap: "8px",
          padding: "0 20px 20px 20px", // 余白調整
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="IDを入力..."
          className="home-search-input"
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            fontSize: "16px",
          }}
        />

        <button
          onClick={handleSearch}
          disabled={loading || !searchText.trim()}
          style={{
            background: "#6b46c1", // ボタン色を追加
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: loading || !searchText.trim() ? 0.6 : 1,
          }}
          aria-label="検索"
        >
          {loading ? (
            <span style={{ fontSize: "12px" }}>...</span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
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
          )}
        </button>
      </div>

      {/* 🔍 検索結果 */}
      <div className="home-list" style={{ padding: "20px" }}>
        {loading ? (
          <div className="text-center text-gray-400">検索中...</div>
        ) : !hasSearched ? (
          <div
            className="text-center text-gray-400"
            style={{ fontSize: "14px" }}
          >
            ユーザーIDを入力して検索してください
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center text-gray-400">
            該当するユーザーが見つかりません
          </div>
        ) : (
          profiles.map((p) => (
            <div
              key={p.id}
              className="home-user-card"
              onClick={() => handleUserClick(p)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px",
                marginBottom: "10px",
                border: "1px solid #eee",
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor: "#fff",
              }}
            >
              <img
                src={p.avatar_url || PLACEHOLDER_AVATAR}
                alt={p.name}
                className="home-avatar"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginRight: "12px",
                }}
                onError={(e) =>
                  ((e.target as HTMLImageElement).src = PLACEHOLDER_AVATAR)
                }
              />

              <div className="home-user-info">
                <div className="home-user-name" style={{ fontWeight: "bold" }}>
                  {p.name}
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "12px",
                      color: "#999",
                      fontWeight: "normal",
                    }}
                  >
                    ID: {p.display_id}
                  </span>
                </div>
                <div
                  className="home-user-caption"
                  style={{ fontSize: "12px", color: "#666" }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: "#f0f0f0",
                      marginRight: "6px",
                    }}
                  >
                    {getRoleLabel(p.role)}
                  </span>
                  {p.bio}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🔥 友だちタブ（固定配置） */}
      <div style={{ marginTop: "10px", borderTop: "8px solid #f9f9f9" }}>
        <FriendTabs currentUser={currentUser} />
      </div>
    </div>
  );
};
