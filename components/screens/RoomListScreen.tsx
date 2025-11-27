"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/mockSupabase";
import { Profile, UserRole, RoomWithPartner } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";

export const RoomListScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [rooms, setRooms] = useState<RoomWithPartner[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [searchMessage, setSearchMessage] = useState("");

  // ===== 安全ナビゲーション =====
  const safeNavigate = useCallback(
    (path: string) => {
      setTimeout(() => navigate(path), 0);
    },
    [navigate]
  );

  // ===== ルーム読み込み =====
  useEffect(() => {
    if (!currentUser) return;

    const load = async () => {
      const r = await db.getRooms(currentUser.id);
      const rWithP = await Promise.all(
        r.map(async (room) => {
          if (room.type === "dm") {
            const pid = room.member_ids.find((id) => id !== currentUser.id);
            const p = pid ? await db.getProfileById(pid) : undefined;
            return { ...room, partner: p };
          }
          return { ...room };
        })
      );
      setRooms(rWithP);
    };

    load();
  }, [currentUser]);

  // ===== ID検索 =====
  const handleSearch = async () => {
    if (!searchId.trim()) return;

    setSearchResult(null);
    setSearchMessage("");

    const res = await db.searchProfileByDisplayId(searchId.trim());

    if (!res) {
      setSearchMessage("ユーザーが見つかりませんでした");
      return;
    }

    if (res.id === currentUser?.id) {
      setSearchMessage("あなた自身のIDです");
      return;
    }

    setSearchResult(res);
  };

  // ===== DM開始 =====
  const handleStartChat = useCallback(
    async (target: Profile) => {
      if (!currentUser) return;

      const room = await db.createRoom(currentUser.id, target.id);
      setShowSearch(false);
      safeNavigate(`/talk/${room.id}`);
    },
    [currentUser, safeNavigate]
  );

  // ===== ロード中 =====
  if (!currentUser) {
    return (
      <div className="roomlist-message roomlist-message-muted">
        読み込み中...
      </div>
    );
  }

  // ===== 画面本体 =====
  return (
    <div className="roomlist-screen">
      {/* Header */}
      <div className="roomlist-header">
        <h2 className="heading-xl">トーク一覧</h2>

        <div className="roomlist-header-actions">
          <button
            onClick={() => {
              setSearchId("");
              setSearchResult(null);
              setSearchMessage("");
              setShowSearch(true);
            }}
            className="btn-icon roomlist-search-btn"
          >
            <svg viewBox="0 0 24 24" className="roomlist-search-icon">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                stroke="currentColor"
                fill="none"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </button>

          {currentUser.role === UserRole.STORE && (
            <button
              onClick={() => safeNavigate("/group/create")}
              className="roomlist-chip roomlist-chip-pink"
            >
              ＋グループ
            </button>
          )}

          {currentUser.role !== UserRole.USER && (
            <button
              onClick={() => safeNavigate("/broadcast")}
              className="roomlist-chip roomlist-chip-indigo"
            >
              一斉送信
            </button>
          )}
        </div>
      </div>

      {/* ===== トーク一覧 ===== */}
      <div className="roomlist-list">
        {rooms.map((r) => {
          let name = "不明なルーム";
          let icon = "https://via.placeholder.com/50";
          let subText = r.last_message || "会話を始める";

          if (r.type === "group") {
            name = r.group_name || "グループチャット";
            icon = "https://ui-avatars.com/api/?name=Group&background=random";
          } else if (r.partner) {
            name = r.partner.name;
            icon = r.partner.avatar_url;
          }

          return (
            <div
              key={r.id}
              className="roomlist-room-card"
              onClick={() => safeNavigate(`/talk/${r.id}`)}
            >
              <img src={icon} className="avatar" />
              <div className="roomlist-room-text">
                <div className="roomlist-room-top">
                  <div className="roomlist-room-name">
                    {r.type === "group" && (
                      <span className="roomlist-group-badge">GROUP</span>
                    )}
                    {name}
                  </div>
                  <div className="roomlist-room-time">
                    {new Date(r.updated_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="roomlist-room-sub">{subText}</div>
              </div>
            </div>
          );
        })}

        {rooms.length === 0 && (
          <div className="roomlist-empty">
            まだメッセージはありません。
            {currentUser.role === UserRole.USER && (
              <div
                className="roomlist-empty-link"
                onClick={() => safeNavigate("/home")}
              >
                相手を探す
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== ID検索モーダル ===== */}
      {showSearch && (
        <div className="roomlist-modal-overlay">
          <div className="roomlist-modal">
            <div className="roomlist-modal-header">
              <h3 className="roomlist-modal-title">IDで検索</h3>
              <button
                onClick={() => setShowSearch(false)}
                className="roomlist-modal-close"
              >
                ✕
              </button>
            </div>

            <div className="roomlist-modal-search">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="IDを入力"
                className="input-field"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button onClick={handleSearch} className="btn-primary">
                検索
              </button>
            </div>

            {searchMessage && (
              <div className="roomlist-modal-error">{searchMessage}</div>
            )}

            {searchResult && (
              <div className="roomlist-result-card">
                <div className="roomlist-result-left">
                  <img
                    src={searchResult.avatar_url}
                    className="roomlist-result-avatar"
                  />
                  <div>
                    <div className="roomlist-result-name">
                      {searchResult.name}
                    </div>
                    <div className="roomlist-result-role">
                      {searchResult.role}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleStartChat(searchResult)}
                  className="btn-primary roomlist-result-btn"
                >
                  トーク
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
