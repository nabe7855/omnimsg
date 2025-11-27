"use client";

import React, { useEffect, useState } from "react";
import { RichMenuItem } from "@/lib/types";
import { db } from "@/lib/mockSupabase";

interface RichMenuProps {
  storeId: string | null | undefined;
  onSend: (text: string) => void;
}

export const RichMenu: React.FC<RichMenuProps> = ({ storeId, onSend }) => {
  const [items, setItems] = useState<RichMenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!storeId) return; // ❗storeIdが来るまで絶対に動かさない

    const loadMenu = async () => {
      const data = await db.getRichMenu(storeId);
      setItems(data);
      setLoaded(true);
    };

    loadMenu();
  }, [storeId]);

  // 安全なローディングガード
  if (!loaded) return null;

  // メニューが空の場合は表示しない
  if (items.length === 0) return null;

  return (
    <div className="rich-menu-panel">
      <div className="rich-menu-grid">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSend(item.response_text)} // ← 修正！label ではなく response_text
            className="rich-menu-btn"
          >
            <span className="rich-menu-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
