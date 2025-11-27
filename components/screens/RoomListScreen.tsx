"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile, RoomWithPartner } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";
import React, { useEffect, useState } from "react";

const PLACEHOLDER_AVATAR = "/placeholder-avatar.png";

export const RoomListScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [rooms, setRooms] = useState<RoomWithPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!currentUser) return;

      try {
        // 1. 参加ルームID取得
        const { data: myParticipations } = await supabase
          .from("room_participants")
          .select("room_id")
          .eq("user_id", currentUser.id);

        if (!myParticipations || myParticipations.length === 0) {
          setLoading(false);
          return;
        }

        const roomIds = myParticipations.map((p) => p.room_id);

        // 2. ルーム情報取得
        const { data: roomsData } = await supabase
          .from("rooms")
          .select("*")
          .in("id", roomIds)
          .order("updated_at", { ascending: false });

        // 3. パートナー情報取得
        const roomsWithPartner: RoomWithPartner[] = [];

        for (const room of roomsData || []) {
          let partner: Profile | undefined = undefined;
          let memberIds: string[] = [];

          const { data: participants } = await supabase
            .from("room_participants")
            .select("user_id")
            .eq("room_id", room.id);

          if (participants) {
            memberIds = participants.map((p) => p.user_id);
            if (room.type === "dm") {
              const partnerIdObj = participants.find(
                (p) => p.user_id !== currentUser.id
              );
              if (partnerIdObj) {
                const { data: pData } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", partnerIdObj.user_id)
                  .single();
                if (pData) partner = pData as Profile;
              }
            }
          }
          roomsWithPartner.push({ ...room, partner, member_ids: memberIds });
        }
        setRooms(roomsWithPartner);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [currentUser]);

  if (loading) {
    return <div className="room-list-loading">読み込み中...</div>;
  }

  return (
    <div className="room-list-screen">
      {/* Header */}
      {/* <div className="room-list-header">
        <h2>トーク一覧</h2>
      </div> */}

      {/* ※ Layout.tsxで共通ヘッダーが出ているなら上記は不要です */}

      <div className="room-list-content">
        {rooms.length === 0 ? (
          <div className="room-list-empty">
            <p>まだメッセージはありません</p>
            <span className="room-list-empty-sub">
              キャスト画面からメッセージを送ってみましょう
            </span>
          </div>
        ) : (
          rooms.map((room) => {
            const title =
              room.type === "group"
                ? room.group_name || "グループ"
                : room.partner?.name || "退会済みユーザー";

            const avatarUrl =
              room.type === "group"
                ? `https://ui-avatars.com/api/?name=${title}&background=random`
                : room.partner?.avatar_url || PLACEHOLDER_AVATAR;

            const date = new Date(room.updated_at);
            const dateStr =
              date.toLocaleDateString() === new Date().toLocaleDateString()
                ? date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : date.toLocaleDateString();

            return (
              <div
                key={room.id}
                className="room-list-item"
                onClick={() => navigate(`/talk/${room.id}`)}
              >
                <div className="room-list-avatar-wrapper">
                  <img
                    src={avatarUrl}
                    alt={title}
                    className="room-list-avatar"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src = PLACEHOLDER_AVATAR)
                    }
                  />
                </div>

                <div className="room-list-info">
                  <div className="room-list-top-row">
                    <h3 className="room-list-title">{title}</h3>
                    <span className="room-list-date">{dateStr}</span>
                  </div>
                  <p className="room-list-message">メッセージを確認する &gt;</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
