"use client";

import { supabase } from "@/lib/supabaseClient";
import { ProfileProps } from "@/lib/types/screen";
import "@/styles/profile.css";
import imageCompression from "browser-image-compression";
import React, { useEffect, useRef, useState } from "react";

// ▼ カメラアイコン
const CameraIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: "24px", height: "24px", color: "white" }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
    />
  </svg>
);

export const ProfileScreen: React.FC<ProfileProps> = ({
  currentUser,
  onLogout,
}) => {
  if (!currentUser) return <div>読み込み中...</div>;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(
    currentUser.avatar_url
  );

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: currentUser.name || "",
    email: currentUser.email || "",
    bio: currentUser.bio || "",
    business_hours: currentUser.business_hours || "",
    address: currentUser.address || "",
    phone_number: currentUser.phone_number || "",
    website_url: currentUser.website_url || "",
  });

  // ==========================================
  // ★修正点1: 初期表示時にDBから最新データを取得して上書きする
  // ==========================================
  useEffect(() => {
    const fetchLatestProfile = async () => {
      // まずはpropsのデータで初期化
      setCurrentAvatarUrl(currentUser.avatar_url);
      setForm({
        name: currentUser.name || "",
        email: currentUser.email || "",
        bio: currentUser.bio || "",
        business_hours: currentUser.business_hours || "",
        address: currentUser.address || "",
        phone_number: currentUser.phone_number || "",
        website_url: currentUser.website_url || "",
      });

      // DBから最新情報を取得
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (!error && data) {
        // 取得できたらステートを最新情報で更新
        setCurrentAvatarUrl(data.avatar_url);
        setForm({
          name: data.name || "",
          email: data.email || "",
          bio: data.bio || "",
          business_hours: data.business_hours || "",
          address: data.address || "",
          phone_number: data.phone_number || "",
          website_url: data.website_url || "",
        });
        // 念のためcurrentUserオブジェクトも更新しておく
        Object.assign(currentUser, data);
      }
    };

    fetchLatestProfile();
  }, [currentUser]);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      setAvatarFile(compressedFile);
      setAvatarPreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error("画像圧縮エラー:", error);
      alert("画像の読み込みに失敗しました");
    }
  };

  // 保存処理
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    let newAvatarUrl = currentAvatarUrl;

    try {
      // 1. 画像が新しく選択されている場合の処理
      if (avatarFile) {
        if (currentAvatarUrl) {
          const urlParts = currentAvatarUrl.split("/avatars/");
          if (urlParts.length > 1) {
            const oldPath = urlParts[1].split("?")[0];
            const { error: removeError } = await supabase.storage
              .from("avatars")
              .remove([oldPath]);

            if (removeError) {
              console.warn("古い画像の削除に失敗しました:", removeError);
            }
          }
        }

        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        newAvatarUrl = publicData.publicUrl;
      }

      // 2. プロフィール情報を更新
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          ...form,
          avatar_url: newAvatarUrl,
        })
        .eq("id", currentUser.id);

      if (updateError) throw updateError;

      // 3. 成功時の処理
      Object.assign(currentUser, { ...form, avatar_url: newAvatarUrl });
      setCurrentAvatarUrl(newAvatarUrl);

      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      alert("プロフィールを更新しました");
    } catch (error) {
      alert("保存中にエラーが発生しました");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isSaving) return;
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    // キャンセル時は元のcurrentUser（もしくはfetchした最新情報）に戻す
    setForm({
      name: currentUser.name || "",
      email: currentUser.email || "",
      bio: currentUser.bio || "",
      business_hours: currentUser.business_hours || "",
      address: currentUser.address || "",
      phone_number: currentUser.phone_number || "",
      website_url: currentUser.website_url || "",
    });
  };

  const avatarSrc =
    avatarPreview ||
    (currentAvatarUrl?.trim() ? currentAvatarUrl : "/placeholder-avatar.png");

  const displayRole = currentUser.role?.toUpperCase() || "USER";

  return (
    <div className="profile-screen">
      <h2 className="profile-heading">マイページ</h2>
      {/* ====== Hero（背景 ＋ アバター） ====== */}
      <div className="profile-hero-bg">
        <div
          className="profile-avatar-wrapper"
          style={{ position: "relative" }}
        >
          <img
            src={avatarSrc}
            className="profile-avatar-image"
            alt="avatar"
            style={{ objectFit: "cover" }}
          />

          {isEditing && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleImageSelect}
              />
              <div
                onClick={() => !isSaving && fileInputRef.current?.click()}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: isSaving ? "default" : "pointer",
                  zIndex: 10,
                }}
              >
                {!isSaving && <CameraIcon />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ====== 名前 ＆ ロールバッジ ====== */}
      <div className="profile-info-center">
        <h3 className="profile-name">{form.name || currentUser.name}</h3>
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
              <div>{form.email || "未設定"}</div>
            </div>

            <div className="profile-card">
              <label>自己紹介</label>
              <div style={{ whiteSpace: "pre-wrap" }}>
                {form.bio || "未設定"}
              </div>
            </div>

            {currentUser.role === "store" && (
              <>
                <div className="profile-card">
                  <label>営業時間</label>
                  <div>{form.business_hours || "未設定"}</div>
                </div>

                <div className="profile-card">
                  <label>住所</label>
                  <div>{form.address || "未設定"}</div>
                </div>

                <div className="profile-card">
                  <label>電話番号</label>
                  <div>{form.phone_number || "未設定"}</div>
                </div>

                {/* ★修正点2: ホームページURLをリンク化 */}
                <div className="profile-card">
                  <label>ホームページURL</label>
                  <div>
                    {form.website_url ? (
                      <a
                        href={form.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#007aff",
                          textDecoration: "underline",
                          wordBreak: "break-all",
                        }}
                      >
                        {form.website_url}
                      </a>
                    ) : (
                      "未設定"
                    )}
                  </div>
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
            <p
              style={{
                textAlign: "center",
                fontSize: "12px",
                color: "#666",
                marginBottom: "10px",
              }}
            >
              アイコンをタップして画像を変更できます
            </p>

            <label>名前</label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={isSaving}
            />

            <label>メールアドレス</label>
            <input
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              disabled={isSaving}
            />

            <label>自己紹介</label>
            <textarea
              value={form.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              disabled={isSaving}
            />

            {currentUser.role === "store" && (
              <>
                <label>営業時間</label>
                <input
                  value={form.business_hours}
                  onChange={(e) =>
                    updateField("business_hours", e.target.value)
                  }
                  disabled={isSaving}
                />

                <label>住所</label>
                <input
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  disabled={isSaving}
                />

                <label>電話番号</label>
                <input
                  value={form.phone_number}
                  onChange={(e) => updateField("phone_number", e.target.value)}
                  disabled={isSaving}
                />

                <label>ホームページURL</label>
                <input
                  value={form.website_url}
                  onChange={(e) => updateField("website_url", e.target.value)}
                  disabled={isSaving}
                  placeholder="https://..."
                />
              </>
            )}
          </div>

          <button
            className="profile-save-button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              opacity: isSaving ? 0.7 : 1,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            {isSaving ? "保存中..." : "保存する"}
          </button>

          <button
            className="profile-cancel-button"
            onClick={handleCancel}
            disabled={isSaving}
            style={{ opacity: isSaving ? 0.7 : 1 }}
          >
            キャンセル
          </button>
        </>
      )}
    </div>
  );
};
