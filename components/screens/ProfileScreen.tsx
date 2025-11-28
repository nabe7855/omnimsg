"use client";

import { supabase } from "@/lib/supabaseClient";
import { ProfileProps } from "@/lib/types/screen";
import "@/styles/profile.css";
import React, { useState } from "react";

export const ProfileScreen: React.FC<ProfileProps> = ({
  currentUser,
  onLogout,
}) => {
  if (!currentUser) return <div>読み込み中...</div>;

  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    name: currentUser.name || "",
    email: currentUser.email || "",
    bio: currentUser.bio || "",
    business_hours: currentUser.business_hours || "",
    address: currentUser.address || "",
    phone_number: currentUser.phone_number || "",
    website_url: currentUser.website_url || "",
  });

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("profiles")
      .update(form)
      .eq("id", currentUser.id);

    if (error) {
      alert("保存中にエラーが発生しました");
      console.error(error);
      return;
    }

    Object.assign(currentUser, form);
    setIsEditing(false);
  };

  const avatarSrc = currentUser.avatar_url?.trim()
    ? currentUser.avatar_url
    : "/placeholder-avatar.png";

  const displayRole = currentUser.role?.toUpperCase() || "USER";

  return (
    <div className="profile-screen">
      <h2 className="profile-heading">マイページ</h2>
      {/* ====== Hero（背景 ＋ アバター） ====== */}
      <div className="profile-hero-bg">
        <div className="profile-avatar-wrapper">
          <img src={avatarSrc} className="profile-avatar-image" />
        </div>
      </div>
      {/* ====== 名前 ＆ ロールバッジ ====== */}

      <div className="profile-info-center">
        <h3 className="profile-name">{currentUser.name}</h3>
        <span className="profile-role-badge">{displayRole}</span>
      </div>
      {/* ====== 閲覧モード ====== */}
      {!isEditing && (
        <>
          <div className="profile-cards">
            <div className="profile-card profile-card-id">
              <div>
                <label>ID</label>
                <div>{currentUser.display_id}</div>
              </div>
            </div>

            <div className="profile-card">
              <label>メールアドレス</label>
              <div>{currentUser.email || "未設定"}</div>
            </div>

            <div className="profile-card">
              <label>自己紹介</label>
              <div>{currentUser.bio || "未設定"}</div>
            </div>

            {currentUser.role === "store" && (
              <>
                <div className="profile-card">
                  <label>営業時間</label>
                  <div>{currentUser.business_hours || "未設定"}</div>
                </div>

                <div className="profile-card">
                  <label>住所</label>
                  <div>{currentUser.address || "未設定"}</div>
                </div>

                <div className="profile-card">
                  <label>電話番号</label>
                  <div>{currentUser.phone_number || "未設定"}</div>
                </div>

                <div className="profile-card">
                  <label>ホームページURL</label>
                  <div>{currentUser.website_url || "未設定"}</div>
                </div>
              </>
            )}
          </div>

          <button
            className="profile-edit-button"
            onClick={() => setIsEditing(true)}
          >
            編集する
          </button>

          <button className="profile-logout-button" onClick={onLogout}>
            ログアウト
          </button>
        </>
      )}
      {/* ====== 編集モード ====== */}
      {isEditing && (
        <>
          <div className="edit-form">
            <label>名前</label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />

            <label>メールアドレス</label>
            <input
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />

            <label>自己紹介</label>
            <textarea
              value={form.bio}
              onChange={(e) => updateField("bio", e.target.value)}
            />

            {currentUser.role === "store" && (
              <>
                <label>営業時間</label>
                <input
                  value={form.business_hours}
                  onChange={(e) =>
                    updateField("business_hours", e.target.value)
                  }
                />

                <label>住所</label>
                <input
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />

                <label>電話番号</label>
                <input
                  value={form.phone_number}
                  onChange={(e) => updateField("phone_number", e.target.value)}
                />

                <label>ホームページURL</label>
                <input
                  value={form.website_url}
                  onChange={(e) => updateField("website_url", e.target.value)}
                />
              </>
            )}
          </div>

          <button className="profile-save-button" onClick={handleSave}>
            保存する
          </button>

          <button
            className="profile-cancel-button"
            onClick={() => setIsEditing(false)}
          >
            キャンセル
          </button>
        </>
      )}
    </div>
  );
};
