"use client";

import { supabase } from "@/lib/supabaseClient";
import { ProfileProps } from "@/lib/types/screen";
import "@/styles/profile.css";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

// ▼ カメラアイコン（変更なし）
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

// ▼ 歯車アイコン（色をグレーに変更）
const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: "24px", height: "24px", color: "#666" }} // ★白背景でも見えるようにグレー(#666)に変更
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.212 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
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

  // 初期表示時にDBから最新データを取得
  useEffect(() => {
    const fetchLatestProfile = async () => {
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

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (!error && data) {
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

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    let newAvatarUrl = currentAvatarUrl;

    try {
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

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          ...form,
          avatar_url: newAvatarUrl,
        })
        .eq("id", currentUser.id);

      if (updateError) throw updateError;
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

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "本当にアカウントを削除しますか？\nこの操作は取り消せません。"
      )
    ) {
      return;
    }
    try {
      setIsSaving(true);
      const response = await fetch("/api/delete-account", { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "削除に失敗しました");
      }
      alert("アカウントを削除しました。");
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.log("SignOut skipped:", e);
      }
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sb-") || key.includes("supabase")) {
          localStorage.removeItem(key);
        }
      });
      localStorage.clear();
      sessionStorage.clear();
      setTimeout(() => {
        window.location.replace("/login");
      }, 500);
    } catch (error: any) {
      console.error("退会エラー:", error);
      alert(`エラーが発生しました: ${error.message}`);
      setIsSaving(false);
    }
  };

  const avatarSrc =
    avatarPreview ||
    (currentAvatarUrl?.trim() ? currentAvatarUrl : "/placeholder-avatar.png");

  const displayRole = currentUser.role?.toUpperCase() || "USER";

  return (
    <div className="profile-screen" style={{ position: "relative" }}>
      {" "}
      {/* ★念のためrelative追加 */}
      {/* 右上の絶対配置アイコンは削除しました（ヘッダーと被るため） */}
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
      <div className="profile-info-center">
        {/* ▼▼▼ 名前と設定アイコンを横並びにする ▼▼▼ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <h3 className="profile-name" style={{ margin: 0 }}>
            {form.name || currentUser.name}
          </h3>

          {/* 歯車アイコン（ここなら絶対に隠れません） */}
          {!isEditing && (
            <div
              onClick={() => {
                const settingSection =
                  document.getElementById("profile-settings");
                if (settingSection) {
                  settingSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
              style={{
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <SettingsIcon />
            </div>
          )}
        </div>

        <span className="profile-role-badge">{displayRole}</span>
      </div>
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

            {/* ▼▼▼ アプリ情報・設定セクション ▼▼▼ */}
            <div
              id="profile-settings"
              style={{ marginTop: "30px", marginBottom: "10px" }}
            >
              <h4
                style={{
                  fontSize: "14px",
                  color: "#888",
                  marginBottom: "8px",
                  paddingLeft: "4px",
                }}
              >
                アプリ情報・設定
              </h4>

              {/* 利用規約リンク */}
              <Link href="/terms" style={{ textDecoration: "none" }}>
                <div
                  className="profile-card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ color: "#333" }}>利用規約</span>
                  <span style={{ color: "#bbb", fontSize: "18px" }}>
                    &rsaquo;
                  </span>
                </div>
              </Link>

              {/* 外部送信規律リンク */}
              <Link
                href="/external-transmission"
                style={{ textDecoration: "none" }}
              >
                <div
                  className="profile-card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ color: "#333" }}>情報外部送信について</span>
                  <span style={{ color: "#bbb", fontSize: "18px" }}>
                    &rsaquo;
                  </span>
                </div>
              </Link>
            </div>
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

          <button
            onClick={handleDeleteAccount}
            style={{
              marginTop: "20px",
              background: "none",
              border: "none",
              color: "#ff4444",
              fontSize: "14px",
              textDecoration: "underline",
              cursor: "pointer",
              width: "100%",
              padding: "10px",
            }}
          >
            アカウントを削除する
          </button>
        </>
      )}
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
