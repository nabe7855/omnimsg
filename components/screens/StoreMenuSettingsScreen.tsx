"use client";

import { supabase } from "@/lib/supabaseClient";
import { RichMenuItem, UserRole } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";
import React, { useEffect, useState } from "react";

export const StoreMenuSettingsScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [items, setItems] = useState<RichMenuItem[]>([]);
  const [label, setLabel] = useState("");
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. メニュー読み込み
  const fetchMenu = async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from("rich_menu_items")
        .select("*")
        .eq("store_id", currentUser.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) setItems(data as RichMenuItem[]);
    } catch (e) {
      console.error(e);
      alert("データの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role !== UserRole.STORE) {
      navigate("/home");
      return;
    }
    fetchMenu();
  }, [currentUser, navigate]);

  // 2. 新規追加
  const handleAdd = async () => {
    if (!currentUser) return;
    if (!label.trim() || !responseText.trim()) {
      alert("ボタン名と返信テキストを入力してください");
      return;
    }
    if (items.length >= 6) {
      alert("登録できるボタンは最大6個までです");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.from("rich_menu_items").insert([
        {
          store_id: currentUser.id,
          label: label,
          response_text: responseText,
        },
      ]);

      if (error) throw error;
      setLabel("");
      setResponseText("");
      await fetchMenu();
      alert("メニューを追加しました");
    } catch (e) {
      console.error(e);
      alert("追加に失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. 削除
  const handleDelete = async (id: string) => {
    if (!confirm("このボタンを削除しますか？")) return;
    try {
      const { error } = await supabase
        .from("rich_menu_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error(e);
      alert("削除に失敗しました");
    }
  };

  if (loading) {
    return <div className="store-menu-loading">読み込み中...</div>;
  }

  return (
    <div className="store-menu-screen">
      {/* Header */}
      <div className="store-menu-header">
        <h2 className="store-menu-title">メニュー設定</h2>
      </div>

      <div className="store-menu-content">
        <p className="store-menu-description">
          チャット画面の下部に表示されるボタンを設定します。<br />
          ユーザーがボタンを押すと、設定したテキストが自動送信されます。
        </p>

        {/* --- 新規追加フォーム --- */}
        <div className="store-menu-form-card">
          <h3 className="store-menu-section-title">
            <span className="store-menu-icon-plus">+</span>
            新しいボタンを追加
          </h3>
          
          <div className="store-menu-form-group">
            <div>
              <label className="store-menu-label">ボタン名 (表示される文字)</label>
              <input
                className="store-menu-input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="例：料金表"
              />
            </div>
            <div>
              <label className="store-menu-label">自動送信テキスト</label>
              <input
                className="store-menu-input"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="例：料金表を見せてください"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={isProcessing || items.length >= 6}
              className="store-menu-add-btn"
            >
              {isProcessing ? "追加中..." : items.length >= 6 ? "登録上限です" : "追加する"}
            </button>
          </div>
        </div>

        {/* --- 登録済みリスト --- */}
        <div className="store-menu-list-header">
          <h3 className="store-menu-section-title">登録済みボタン</h3>
          <span className="store-menu-count">{items.length} / 6</span>
        </div>

        <div className="store-menu-list">
          {items.length === 0 ? (
            <div className="store-menu-empty">まだ登録されていません</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="store-menu-item">
                <div className="store-menu-item-info">
                  <div className="store-menu-item-label">{item.label}</div>
                  <div className="store-menu-item-response">&quot;{item.response_text}&quot;</div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="store-menu-delete-btn"
                >
                  削除
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};