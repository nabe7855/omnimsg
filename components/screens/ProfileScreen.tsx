import React from "react";
import { ProfileProps } from "@/lib/types/screen";

export const ProfileScreen: React.FC<ProfileProps> = ({
  currentUser,
  onLogout,
}) => {
  // ============================
  // ❶ currentUser の読み込み待ち（安全）
  // ============================
  if (!currentUser) {
    return <div className="profile-loading">読み込み中...</div>;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentUser.display_id);
    alert("IDをコピーしました");
  };

  const handleLogoutClick = async () => {
    // ============================
    // ❷ onLogout を安全に実行
    // ============================
    await onLogout();
  };

  return (
    <div className="profile-screen">
      <h2 className="profile-heading">マイページ</h2>

      <div className="profile-content">
        {/* Avatar */}
        <div className="profile-avatar-wrapper">
          <img
            src={currentUser.avatar_url}
            alt="me"
            className="profile-avatar-image"
          />
        </div>

        {/* Name */}
        <h3 className="profile-name">{currentUser.name}</h3>

        {/* Role */}
        <span className="profile-role-badge">{currentUser.role}</span>

        {/* Info Blocks */}
        <div className="profile-cards">
          {/* Display ID */}
          <div className="profile-card profile-card-id">
            <div className="profile-card-left">
              <label className="profile-card-label">ID</label>
              <div className="profile-id-value">
                {currentUser.display_id}
              </div>
            </div>

            <button
              className="profile-copy-button"
              onClick={handleCopy}
              type="button"
            >
              コピー
            </button>
          </div>

          {/* Email */}
          <div className="profile-card">
            <label className="profile-card-label">メールアドレス</label>
            <div className="profile-email">
              {currentUser.email || "未設定"}
            </div>
          </div>

          {/* Bio */}
          <div className="profile-card">
            <label className="profile-card-label">自己紹介</label>
            <div className="profile-bio">
              {currentUser.bio || "自己紹介は設定されていません。"}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogoutClick}
          className="profile-logout-button"
          type="button"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
};
