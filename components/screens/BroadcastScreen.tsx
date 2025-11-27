"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/mockSupabase";
import { ScreenProps } from "@/lib/types/screen";

export const BroadcastScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [broadcastText, setBroadcastText] = useState("");

  // ===== 認証チェック =====
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // ログインしていない一瞬の間は画面を描画しない
  if (!currentUser) return null;

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return;

    const count = await db.sendBroadcast(currentUser.id, broadcastText);
    alert(`${count} 件のチャットに一斉送信しました。`);
    setBroadcastText("");
  };

  return (
    <div className="broadcast-page">
      <div className="broadcast-header">
        <button
          onClick={() => navigate("/talks")}
          className="icon-button broadcast-back-button"
        >
          <svg
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="icon-sm"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <h2 className="broadcast-title">一斉送信</h2>
      </div>

      <div className="broadcast-card">
        <label className="broadcast-label">
          アクティブな全ユーザーへのメッセージ
        </label>

        <textarea
          className="broadcast-textarea"
          placeholder="お知らせ内容を入力..."
          value={broadcastText}
          onChange={(e) => setBroadcastText(e.target.value)}
        />

        <button
          onClick={handleBroadcast}
          disabled={!broadcastText.trim()}
          className="btn btn-primary btn-full broadcast-submit"
        >
          一斉送信する
        </button>
      </div>
    </div>
  );
};
