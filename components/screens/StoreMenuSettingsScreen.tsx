"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/mockSupabase";
import { RichMenuItem } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";

export const StoreMenuSettingsScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [menuItems, setMenuItems] = useState<RichMenuItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // -----------------------------
  // 🔒 安全な navigate
  // -----------------------------
  const safeNavigate = useCallback(
    (path: string) => {
      setTimeout(() => navigate(path), 0);
    },
    [navigate]
  );

  // -----------------------------
  // メニュー読み込み
  // -----------------------------
  useEffect(() => {
    if (!currentUser) return;

    const load = async () => {
      const result = await db.getRichMenu(currentUser.id);
      setMenuItems(result);
      setIsLoaded(true);
    };

    load();
  }, [currentUser]);

  // -----------------------------
  // 保存処理
  // -----------------------------
  const saveMenu = async () => {
    if (!currentUser) return;

    await db.updateRichMenu(currentUser.id, menuItems);
    alert("メニューを更新しました");
  };

  // -----------------------------------
  // 読み込み前は「ローディング」を出す
  // -----------------------------------
  if (!isLoaded) {
    return (
      <div className="p-4 text-gray-400 text-center">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="heading-xl mb-0">リッチメニュー</h2>
        <button onClick={saveMenu} className="text-primary font-bold">
          保存
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        ユーザーがチャット画面で利用できるボタンをカスタマイズします。
      </p>

      <div className="space-y-4">
        {menuItems.map((item, idx) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-xl border border-gray-200 space-y-2"
          >
            <span className="text-xs font-bold text-gray-400">
              ボタン {idx + 1}
            </span>

            <input
              className="input-field py-2 text-sm"
              value={item.label}
              onChange={(e) => {
                const newItems = [...menuItems];
                newItems[idx] = { ...newItems[idx], label: e.target.value };
                setMenuItems(newItems);
              }}
              placeholder="ボタン名"
            />

            <textarea
              className="input-field py-2 text-sm"
              rows={2}
              value={item.response_text}
              onChange={(e) => {
                const newItems = [...menuItems];
                newItems[idx] = {
                  ...newItems[idx],
                  response_text: e.target.value,
                };
                setMenuItems(newItems);
              }}
              placeholder="自動返信テキスト"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
