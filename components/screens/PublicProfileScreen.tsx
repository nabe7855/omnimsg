import React, { useState, useEffect } from "react";
import { db } from "@/lib/mockSupabase";
import { Profile, UserRole } from "@/lib/types";
import { PublicProfileProps } from "@/lib/types/screen";

export const PublicProfileScreen: React.FC<PublicProfileProps> = ({
  currentUser,
  targetUserId,
  navigate,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [storeProfile, setStoreProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ============ 読み込み ============
  useEffect(() => {
    const load = async () => {
      const p = await db.getProfileById(targetUserId);
      setProfile(p || null);

      // Cast なら店舗情報も取得
      if (p && p.role === UserRole.CAST && p.store_id) {
        const s = await db.getProfileById(p.store_id);
        setStoreProfile(s || null);
      }

      setLoading(false);
    };
    load();
  }, [targetUserId]);

  // ============ 安全なナビゲーション ============
  const handleBack = () => {
    navigate("/home");
  };

  // ============ 店舗とのDM作成 ============
  const handleContactStore = async () => {
    if (!currentUser || !storeProfile) return;
    const room = await db.createRoom(currentUser.id, storeProfile.id);
    navigate(`/talk/${room.id}`);
  };

  // ============ メッセージ送信（DM） ============
  const handleSendMessage = async () => {
    if (!currentUser || !profile) return;
    const room = await db.createRoom(currentUser.id, profile.id);
    navigate(`/talk/${room.id}`);
  };

  // ============ ロード中 / エラー表示 ============
  if (!currentUser) {
    return (
      <div className="public-profile-message public-profile-message-muted">
        読み込み中...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="public-profile-message public-profile-message-muted">
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="public-profile-message">
        ユーザーが見つかりません
      </div>
    );
  }

  const isMe = currentUser.id === profile.id;

  return (
    <div className="public-profile-screen">
      {/* Header */}
      <div className="public-profile-header">
        <button
          onClick={handleBack}
          className="public-profile-back-btn"
          type="button"
        >
          <svg
            viewBox="0 0 24 24"
            className="public-profile-back-icon"
            aria-hidden="true"
          >
            <path
              d="M15.75 19.5 8.25 12l7.5-7.5"
              strokeWidth={1.5}
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          戻る
        </button>
      </div>

      {/* Main Content */}
      <div className="public-profile-main">
        <div className="public-profile-avatar-wrapper">
          <img
            src={profile.avatar_url}
            alt="profile"
            className="public-profile-avatar-image"
          />
        </div>

        <h2 className="public-profile-name">{profile.name}</h2>

        <div className="public-profile-badge-row">
          {/* ロールバッジ */}
          <span
            className={
              "public-profile-role-badge " +
              (profile.role === UserRole.CAST
                ? "public-profile-role-cast"
                : profile.role === UserRole.STORE
                ? "public-profile-role-store"
                : "public-profile-role-user")
            }
          >
            {profile.role}
          </span>

          {/* Cast の場合に店舗バッジ */}
          {storeProfile && (
            <span className="public-profile-store-badge">
              <svg
                viewBox="0 0 24 24"
                className="public-profile-store-icon"
                aria-hidden="true"
              >
                <path
                  d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {storeProfile.name}
            </span>
          )}
        </div>

        <div className="public-profile-card-list">
          <div className="public-profile-card">
            <label className="public-profile-card-label">自己紹介</label>
            <p className="public-profile-card-text">
              {profile.bio || "自己紹介はありません"}
            </p>
          </div>

          {profile.role === UserRole.STORE && profile.business_hours && (
            <div className="public-profile-card">
              <label className="public-profile-card-label">営業時間</label>
              <p className="public-profile-card-text">
                {profile.business_hours}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isMe && (
        <div className="public-profile-footer">
          {currentUser.role === UserRole.USER &&
            profile.role === UserRole.CAST &&
            storeProfile && (
              <button
                onClick={handleContactStore}
                className="btn-primary public-profile-action-button public-profile-action-button-primary"
                type="button"
              >
                店舗に問い合わせる
              </button>
            )}

          <button
            onClick={handleSendMessage}
            className="btn-secondary public-profile-action-button public-profile-action-button-secondary"
            type="button"
          >
            メッセージを送る
          </button>
        </div>
      )}
    </div>
  );
};
