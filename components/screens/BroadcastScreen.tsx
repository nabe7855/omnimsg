"use client";

import {
  BroadcastTargets,
  getBroadcastTargets,
  sendBroadcastMessage,
} from "@/lib/db/broadcast";
import { supabase } from "@/lib/supabaseClient";
import { Profile, UserRole } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";
import imageCompression from "browser-image-compression";
import React, { useEffect, useRef, useState } from "react";

const PLACEHOLDER_AVATAR = "/placeholder-avatar.png";

export const BroadcastScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ★追加: リンクURL用ステート
  const [linkUrl, setLinkUrl] = useState("");

  const [targets, setTargets] = useState<BroadcastTargets | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // アコーディオン開閉状態 (キャストIDごとのboolean)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // ==============================
  // 初期ロード
  // ==============================
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    const load = async () => {
      const data = await getBroadcastTargets(currentUser);
      setTargets(data);
      setIsLoading(false);
    };
    load();
  }, [currentUser, navigate]);

  // ==============================
  // 選択ロジック
  // ==============================
  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // 全キャストを選択/解除
  const toggleAllCasts = () => {
    if (!targets) return;
    const allCastIds = targets.castGroups.map((g) => g.cast.id);
    const isAllSelected = allCastIds.every((id) => selectedIds.has(id));

    const next = new Set(selectedIds);
    allCastIds.forEach((id) => {
      if (isAllSelected) next.delete(id);
      else next.add(id);
    });
    setSelectedIds(next);
  };

  // 全ユーザー(客)を選択/解除
  const toggleAllUsers = () => {
    if (!targets) return;
    // 自分の直接の客 + 各キャストの客
    let allUserIds = targets.directUsers.map((u) => u.id);
    targets.castGroups.forEach((g) => {
      g.users.forEach((u) => allUserIds.push(u.id));
    });
    // 重複排除
    allUserIds = Array.from(new Set(allUserIds));

    const isAllSelected = allUserIds.every((id) => selectedIds.has(id));
    const next = new Set(selectedIds);
    allUserIds.forEach((id) => {
      if (isAllSelected) next.delete(id);
      else next.add(id);
    });
    setSelectedIds(next);
  };

  // 特定キャストに紐づくユーザーを全選択/解除
  const toggleGroupUsers = (castId: string) => {
    if (!targets) return;
    const group = targets.castGroups.find((g) => g.cast.id === castId);
    if (!group) return;

    const userIds = group.users.map((u) => u.id);
    const isAllSelected = userIds.every((id) => selectedIds.has(id));

    const next = new Set(selectedIds);
    userIds.forEach((id) => {
      if (isAllSelected) next.delete(id);
      else next.add(id);
    });
    setSelectedIds(next);
  };

  // ==============================
  // 画像処理
  // ==============================
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920 };
      try {
        const compressed = await imageCompression(file, options);
        setImageFile(compressed);
        setPreviewUrl(URL.createObjectURL(compressed));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // ==============================
  // 送信処理
  // ==============================
  const handleSend = async () => {
    if (selectedIds.size === 0) return alert("送信先を選択してください");
    if (!text && !imageFile)
      return alert("メッセージまたは画像を入力してください");
    if (!currentUser) return;

    if (!window.confirm(`${selectedIds.size}人に一斉送信しますか？`)) return;

    setIsSending(true);
    try {
      let publicImageUrl = "";

      // 画像アップロード
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const fileName = `broadcast/${Date.now()}-${Math.random()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("chat-images")
          .upload(fileName, imageFile);

        if (upErr) throw upErr;

        const { data } = supabase.storage
          .from("chat-images")
          .getPublicUrl(fileName);
        publicImageUrl = data.publicUrl;
      }

      // 送信実行 (linkUrlも渡す)
      const count = await sendBroadcastMessage(
        currentUser.id,
        Array.from(selectedIds),
        text,
        publicImageUrl,
        linkUrl // ★追加: リンクURLを渡す
      );

      alert(`${count}件 送信しました！`);
      navigate("/talks");
    } catch (e) {
      console.error(e);
      alert("送信中にエラーが発生しました");
    } finally {
      setIsSending(false);
    }
  };

  // ==============================
  // UI Render
  // ==============================
  if (!currentUser || isLoading)
    return <div style={{ padding: 20 }}>読み込み中...</div>;

  const isStore = currentUser.role === UserRole.STORE;

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8f9fa",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "15px",
          background: "white",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => navigate("/talks")}
          style={{
            background: "none",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          ←
        </button>
        <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "bold" }}>
          一斉送信
        </h2>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "15px" }}>
        {/* --- ターゲット選択エリア --- */}
        <div
          style={{
            background: "white",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "20px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
            送信先を選択 ({selectedIds.size}人)
          </h3>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "15px",
              flexWrap: "wrap",
            }}
          >
            {isStore && (
              <button onClick={toggleAllCasts} style={btnStyle}>
                全キャスト選択
              </button>
            )}
            <button onClick={toggleAllUsers} style={btnStyle}>
              全お客様を選択
            </button>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #eee",
              margin: "10px 0",
            }}
          />

          {/* 1. 直接の友達 */}
          {targets?.directUsers.length ? (
            <div style={{ marginBottom: "15px" }}>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                {isStore ? "店舗のお客様" : "自分のお客様"}
              </div>
              {targets.directUsers.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isSelected={selectedIds.has(u.id)}
                  onToggle={() => toggleSelection(u.id)}
                />
              ))}
            </div>
          ) : null}

          {/* 2. 店舗用: キャストごとのグループ */}
          {isStore &&
            targets?.castGroups.map((group) => {
              const isOpen = openGroups[group.cast.id];
              return (
                <div
                  key={group.cast.id}
                  style={{
                    marginBottom: "10px",
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  {/* キャストヘッダー */}
                  <div
                    style={{
                      background: "#f0f0f5",
                      padding: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(group.cast.id)}
                        onChange={() => toggleSelection(group.cast.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <img
                        src={group.cast.avatar_url || PLACEHOLDER_AVATAR}
                        style={{ width: 30, height: 30, borderRadius: "50%" }}
                      />
                      <span style={{ fontWeight: "bold" }}>
                        {group.cast.name} (キャスト)
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => toggleGroupUsers(group.cast.id)}
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          background: "white",
                          cursor: "pointer",
                        }}
                      >
                        客全選択
                      </button>
                      <button
                        onClick={() =>
                          setOpenGroups((prev) => ({
                            ...prev,
                            [group.cast.id]: !prev[group.cast.id],
                          }))
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        {isOpen ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>

                  {/* キャストの客リスト */}
                  {isOpen && (
                    <div style={{ padding: "10px" }}>
                      {group.users.length === 0 ? (
                        <p
                          style={{ fontSize: "12px", color: "#999", margin: 0 }}
                        >
                          お客様はいません
                        </p>
                      ) : null}
                      {group.users.map((u) => (
                        <UserRow
                          key={u.id}
                          user={u}
                          isSelected={selectedIds.has(u.id)}
                          onToggle={() => toggleSelection(u.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* --- メッセージ入力エリア --- */}
        <div
          style={{
            background: "white",
            padding: "15px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
            メッセージ作成
          </h3>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="メッセージを入力..."
            style={{
              width: "100%",
              height: "120px",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              marginBottom: "10px",
              resize: "none",
              fontSize: "16px",
            }}
          />

          <div style={{ marginBottom: "15px" }}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleImageSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "#eee",
                border: "none",
                padding: "8px 15px",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              📷 画像を追加
            </button>
            {previewUrl && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={previewUrl}
                    style={{
                      maxWidth: "200px",
                      maxHeight: "200px",
                      borderRadius: "8px",
                      border: "1px solid #eee",
                    }}
                  />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setPreviewUrl(null);
                      setLinkUrl(""); // リセット
                    }}
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      background: "black",
                      color: "white",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* ★追加: 画像がある場合のみリンクURL入力欄を表示 */}
                <div style={{ marginTop: "10px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "#666",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    画像リンク先URL (任意)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={isSending || selectedIds.size === 0}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background:
                isSending || selectedIds.size === 0 ? "#ccc" : "#6b46c1",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {isSending ? "送信中..." : "一斉送信する"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ヘルパーコンポーネント: ユーザー行
const UserRow = ({
  user,
  isSelected,
  onToggle,
}: {
  user: Profile;
  isSelected: boolean;
  onToggle: () => void;
}) => (
  <div
    onClick={onToggle}
    style={{
      display: "flex",
      alignItems: "center",
      padding: "8px 0",
      cursor: "pointer",
      borderBottom: "1px solid #f5f5f5",
    }}
  >
    <input
      type="checkbox"
      checked={isSelected}
      readOnly
      style={{ marginRight: "10px", transform: "scale(1.2)" }}
    />
    <img
      src={user.avatar_url || PLACEHOLDER_AVATAR}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        marginRight: "10px",
        objectFit: "cover",
      }}
    />
    <span style={{ fontSize: "14px" }}>{user.name}</span>
  </div>
);

const btnStyle: React.CSSProperties = {
  fontSize: "12px",
  padding: "6px 12px",
  borderRadius: "20px",
  border: "1px solid #6b46c1",
  color: "#6b46c1",
  background: "white",
  cursor: "pointer",
};
