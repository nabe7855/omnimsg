import { ProfileProps } from "@/lib/types/screen";
import React from "react";

export const ProfileScreen: React.FC<ProfileProps> = ({
  currentUser,
  onLogout,
}) => {
  // =================================================
  // ❶ currentUser がまだ無い → ローディング対応
  // =================================================
  if (!currentUser) {
    return <div className="profile-loading">読み込み中...</div>;
  }

  // =================================================
  // ❷ avatar が存在しない・空文字・null・undefined の場合
  //    → 必ず placeholder にフォールバックさせる
  // =================================================
  const avatarSrc = currentUser.avatar_url?.trim()
    ? currentUser.avatar_url
    : "/placeholder-avatar.png"; // public/ に置く

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentUser.display_id);
    alert("IDをコピーしました");
  };

  const handleLogoutClick = async () => {
    await onLogout();
  };

  return (
    <div className="profile-screen">
      <h2 className="profile-heading">マイページ</h2>

      <div className="profile-content">
        {/* Avatar */}
        <div className="profile-avatar-wrapper">
          <img
            src={avatarSrc}
            alt="avatar"
            className="profile-avatar-image"
            onError={(e) => {
              // 万が一画像URLが不正でも fallback
              (e.currentTarget as HTMLImageElement).src =
                "/placeholder-avatar.png";
            }}
          />
        </div>

        {/* Name */}
        <h3 className="profile-name">{currentUser.name}</h3>

        {/* Role */}
        <span className="profile-role-badge">{currentUser.role}</span>

        {/* Info Cards */}
        <div className="profile-cards">
          {/* Display ID */}
          <div className="profile-card profile-card-id">
            <div className="profile-card-left">
              <label className="profile-card-label">ID</label>
              <div className="profile-id-value">{currentUser.display_id}</div>
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
            <div className="profile-email">{currentUser.email || "未設定"}</div>
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
