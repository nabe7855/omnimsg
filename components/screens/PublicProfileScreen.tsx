"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile, UserRole } from "@/lib/types";
import { PublicProfileProps } from "@/lib/types/screen";
import "@/styles/profile.css";
import React, { useEffect, useState } from "react";

import {
  acceptFriendRequest,
  FriendshipStatus,
  getFriendshipStatus,
  removeFriend,
  sendFriendRequest,
} from "@/lib/db/friendships";

const PLACEHOLDER_AVATAR = "/placeholder-avatar.png";

export const PublicProfileScreen: React.FC<PublicProfileProps> = ({
  currentUser,
  targetUserId,
  navigate,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [storeProfile, setStoreProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 友だち状態
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus>("none");

  // ============================================
  // プロフィール読み込み
  // ============================================
  useEffect(() => {
    const load = async () => {
      const { data: user } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (user) {
        setProfile(user as Profile);

        // Cast → 店舗情報取得
        if (user.role === UserRole.CAST && user.store_id) {
          const { data: store } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.store_id)
            .single();

          if (store) setStoreProfile(store as Profile);
        }

        // ⭐ 友だち状態も取得
        if (currentUser) {
          const status = await getFriendshipStatus(targetUserId);
          setFriendStatus(status);
        }
      }

      setLoading(false);
    };

    load();
  }, [targetUserId, currentUser]);

  // ============================================
  // 友だち関係イベント
  // ============================================

  const handleSendFriendRequest = async () => {
    if (!profile) return;

    const res = await sendFriendRequest(profile.id);
    if (res.error) {
      alert("友だち申請に失敗しました");
    } else {
      setFriendStatus("pending_request");
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!profile) return;

    const res = await acceptFriendRequest(profile.id);
    if (res.error) {
      alert("承認に失敗しました");
    } else {
      setFriendStatus("accepted");
    }
  };

  const handleRemoveFriend = async () => {
    if (!profile) return;
    if (!confirm("友だちを解除しますか？")) return;

    const res = await removeFriend(profile.id);
    if (res.error) {
      alert("解除に失敗しました");
    } else {
      setFriendStatus("none");
    }
  };

  // ============================================
  // チャット開始（既存）
  // ============================================
  const getOrCreateRoom = async (partnerId: string) => {
    if (!currentUser) return null;

    // 既存ルーム確認
    const { data: myRooms } = await supabase
      .from("room_participants")
      .select("room_id")
      .eq("user_id", currentUser.id);

    if (myRooms && myRooms.length > 0) {
      const myIds = myRooms.map((r) => r.room_id);

      const { data: targetRoom } = await supabase
        .from("room_participants")
        .select("room_id")
        .eq("user_id", partnerId)
        .in("room_id", myIds)
        .maybeSingle();

      if (targetRoom) return targetRoom.room_id;
    }

    // 新規作成
    const { data: newRoom } = await supabase
      .from("rooms")
      .insert({ type: "dm" })
      .select()
      .single();

    await supabase.from("room_participants").insert([
      { room_id: newRoom.id, user_id: currentUser.id },
      { room_id: newRoom.id, user_id: partnerId },
    ]);

    return newRoom.id;
  };

  const handleSendMessage = async () => {
    if (!currentUser || !profile) return;
    const roomId = await getOrCreateRoom(profile.id);
    if (roomId) navigate(`/talk/${roomId}`);
  };

  // ============================================
  // UI ロード
  // ============================================

  if (loading) return <div>読み込み中...</div>;
  if (!profile) return <div>ユーザーが見つかりません</div>;
  const isMe = currentUser?.id === profile.id;

  // ============================================
  // 🔥 友だちボタンの UI を作成！
  // ============================================

  const renderFriendButton = () => {
    switch (friendStatus) {
      case "none":
        return (
          <button
            className="public-profile-action-button"
            onClick={handleSendFriendRequest}
          >
            ➕ 友だち追加
          </button>
        );

      case "pending_request":
        return (
          <button className="public-profile-action-button-disabled">
            ⏳ 承認待ち...
          </button>
        );

      case "pending_received":
        return (
          <button
            className="public-profile-action-button"
            onClick={handleAcceptFriendRequest}
          >
            ✅ 承認する
          </button>
        );

      case "accepted":
        return (
          <>
            <button className="public-profile-action-button-green">
              ✔ 友だち
            </button>
            <button
              onClick={handleRemoveFriend}
              className="public-profile-action-button-danger"
            >
              ❌ 解除
            </button>
          </>
        );
    }
  };

  return (
    <div className="public-profile-screen">
      <div className="public-profile-main">
        <img
          src={profile.avatar_url || PLACEHOLDER_AVATAR}
          className="public-profile-avatar-image"
        />

        <h2 className="public-profile-name">{profile.name}</h2>

        {/* 友だち UI（自分以外の場合） */}
        {!isMe && (
          <div className="public-profile-footer">{renderFriendButton()}</div>
        )}

        {/* DM ボタン */}
        {!isMe && (
          <button
            className="public-profile-action-button-secondary"
            onClick={handleSendMessage}
          >
            💬 メッセージを送る
          </button>
        )}
      </div>
    </div>
  );
};
