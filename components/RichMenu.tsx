"use client";

import { getRichMenuByStore } from "@/lib/db/richmenu";
import { RichMenuItem } from "@/lib/types/richmenu";
import React, { useEffect, useState } from "react";
import "@/styles/richmenu.css"; // ← Tailwindの代わりにCSSを当てる

interface RichMenuProps {
  storeId: string | null | undefined;
  onSend: (text: string) => void;
}

export const RichMenu: React.FC<RichMenuProps> = ({ storeId, onSend }) => {
  const [items, setItems] = useState<RichMenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!storeId) return;

    const loadMenu = async () => {
      const data = await getRichMenuByStore(storeId);
      setItems(data);
      setLoaded(true);
    };

    loadMenu();
  }, [storeId]);

  if (!loaded || items.length === 0) return null;

  return (
    <div className="rich-menu-panel">
      <div className="rich-menu-grid">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSend(item.response_text)}
            className="rich-menu-btn"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
