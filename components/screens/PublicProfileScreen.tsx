import { supabase } from "@/lib/supabaseClient";
import { Profile, UserRole } from "@/lib/types";
import { PublicProfileProps } from "@/lib/types/screen";
import React, { useEffect, useState } from "react";

// 画像のフォールバック用
const PLACEHOLDER_AVATAR = "/placeholder-avatar.png";

export const PublicProfileScreen: React.FC<PublicProfileProps> = ({
  currentUser,
  targetUserId,
  navigate,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [storeProfile, setStoreProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ============ 読み込み (Supabase) ============
  useEffect(() => {
    const load = async () => {
      // 1. ターゲットユーザーの情報を取得
      const { data: user, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (error || !user) {
        setLoading(false);
        return;
      }

      setProfile(user as Profile);

      // 2. Cast なら店舗情報も取得
      if (user.role === UserRole.CAST && user.store_id) {
        const { data: store } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.store_id)
          .single();

        if (store) {
          setStoreProfile(store as Profile);
        }
      }

      setLoading(false);
    };
    load();
  }, [targetUserId]);

  // ============ 安全なナビゲーション ============
  const handleBack = () => {
    // 履歴があれば戻る、なければホームへ
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/home");
    }
  };

  // ============ チャットルーム取得・作成ロジック (共通) ============
  const getOrCreateRoom = async (partnerId: string) => {
    // ★ 修正箇所: ここで currentUser が null の場合は処理を中断する
    // これにより、以降の行で currentUser.id を安全に使えるようになります
    if (!currentUser) return null;

    try {
      // A. 既存のルームを探す
      // 自分の参加ルーム一覧を取得
      const { data: myRooms } = await supabase
        .from("room_participants")
        .select("room_id")
        .eq("user_id", currentUser.id);

      let existingRoomId = null;

      if (myRooms && myRooms.length > 0) {
        const myRoomIds = myRooms.map((r) => r.room_id);

        // 相手も参加しているルームを探す (共通のroom_id)
        const { data: targetRooms } = await supabase
          .from("room_participants")
          .select("room_id")
          .eq("user_id", partnerId)
          .in("room_id", myRoomIds)
          .maybeSingle();

        if (targetRooms) {
          existingRoomId = targetRooms.room_id;
        }
      }

      if (existingRoomId) {
        return existingRoomId;
      }

      // B. なければ新規作成
      const { data: newRoom, error: roomError } = await supabase
        .from("rooms")
        .insert({}) // 空のルームを作成
        .select()
        .single();

      if (roomError || !newRoom) throw new Error("ルーム作成失敗");

      // 参加者を追加 (自分と相手)
      await supabase.from("room_participants").insert([
        { room_id: newRoom.id, user_id: currentUser.id },
        { room_id: newRoom.id, user_id: partnerId },
      ]);

      return newRoom.id;
    } catch (e) {
      console.error("Chat start error:", e);
      alert("チャットの開始に失敗しました");
      return null;
    }
  };

  // ============ 店舗とのDMへ遷移 ============
  const handleContactStore = async () => {
    if (!currentUser || !storeProfile) return;
    const roomId = await getOrCreateRoom(storeProfile.id);
    if (roomId) navigate(`/talk/${roomId}`);
  };

  // ============ ターゲットとのDMへ遷移 ============
  const handleSendMessage = async () => {
    if (!currentUser || !profile) return;
    const roomId = await getOrCreateRoom(profile.id);
    if (roomId) navigate(`/talk/${roomId}`);
  };

  // ============ ロード中 / エラー表示 ============
  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="public-profile-message public-profile-message-muted">
        読み込み中...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="public-profile-message">ユーザーが見つかりません</div>
    );
  }

  const isMe = currentUser.id === profile.id;

  return (
    <div className="public-profile-screen">
      {/* Header */}

      {/* Main Content */}
      <div className="public-profile-main">
        <div className="public-profile-avatar-wrapper">
          <img
            src={profile.avatar_url || PLACEHOLDER_AVATAR}
            alt={profile.name}
            className="public-profile-avatar-image"
            onError={(e) =>
              ((e.target as HTMLImageElement).src = PLACEHOLDER_AVATAR)
            }
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
            {profile.role === UserRole.CAST
              ? "CAST"
              : profile.role === UserRole.STORE
              ? "STORE"
              : "USER"}
          </span>

          {/* Cast の場合に店舗バッジ */}
          {storeProfile && (
            <span className="public-profile-store-badge">
              <span style={{ marginRight: "4px" }}>🏢</span>
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

      {/* Action Buttons (自分以外の場合のみ) */}
      {!isMe && (
        <div className="public-profile-footer">
          {/* ユーザーがキャストを見ている場合、店舗への問い合わせボタンも出す */}
          {currentUser.role === UserRole.USER &&
            profile.role === UserRole.CAST &&
            storeProfile && (
              <button
                onClick={handleContactStore}
                className="btn-primary public-profile-action-button public-profile-action-button-primary"
                type="button"
                style={{
                  marginBottom: "12px",
                  backgroundColor: "#4b5563",
                  borderColor: "#4b5563",
                }}
              >
                店舗に問い合わせる
              </button>
            )}

          <button
            onClick={handleSendMessage}
            className="btn-secondary public-profile-action-button public-profile-action-button-secondary"
            type="button"
          >
            💬 メッセージを送る
          </button>
        </div>
      )}
    </div>
  );
};
