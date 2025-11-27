"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/mockSupabase";
import { Profile, UserRole } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";

export const HomeScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // ============================
  // 認証チェック
  // ============================
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  // ============================
  // データロード
  // ============================
  useEffect(() => {
    const load = async () => {
      const stores = await db.getProfiles(UserRole.STORE);
      const casts = await db.getProfiles(UserRole.CAST);
      setProfiles([...stores, ...casts]);
    };
    load();
  }, []);

  // ============================
  // DM作成
  // ============================
  const handleCreateRoom = async (targetUser: Profile) => {
    const room = await db.createRoom(currentUser.id, targetUser.id);
    navigate(`/talk/${room.id}`);
  };

  return (
    <div className="home-screen">
      <h2 className="home-title">探す</h2>

      <div className="home-search-box">
        <input
          type="text"
          placeholder="キャストや店舗を検索..."
          className="home-search-input"
        />
      </div>

      <div className="home-list">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="home-user-card"
            onClick={() => handleCreateRoom(p)}
          >
            <img src={p.avatar_url} alt={p.name} className="home-avatar" />

            <div className="home-user-info">
              <div className="home-user-name">{p.name}</div>
              <div className="home-user-caption">
                {p.role === UserRole.STORE ? "店舗" : "キャスト"} • {p.bio}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
