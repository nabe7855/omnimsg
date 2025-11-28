"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile, RoomWithPartner } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";
import "@/styles/RoomList.css";
import React, { useEffect, useState } from "react";

const PLACEHOLDER_AVATAR = "/placeholder-avatar.png";

type RoomTab = "friends" | "others";

export const RoomListScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [rooms, setRooms] = useState<RoomWithPartner[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [unreadMap, setUnreadMap] = useState<Map<string, number>>(new Map());
  const [tab, setTab] = useState<RoomTab>("friends");
  const [loading, setLoading] = useState(true);

  /* ▼ 友達ID一覧取得 */
  useEffect(() => {
    const fetchFriendIds = async () => {
      if (!currentUser) return;

      const { data } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(
          `requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`
        );

      if (data) {
        const ids = data.map((f) =>
          f.requester_id === currentUser.id ? f.addressee_id : f.requester_id
        );
        setFriendIds(ids);
      }
    };
    fetchFriendIds();
  }, [currentUser]);

  /* ▼ 未読件数の取得 */
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUser) return;

      const { data, error } = await supabase.rpc("get_unread_count", {
        p_user_id: currentUser.id,
      });

      if (error) {
        console.error("Unread RPC Error:", error);
        return;
      }

      const map = new Map<string, number>();
      data?.forEach((row: { room_id: string; unread_count: number }) => {
        map.set(row.room_id, row.unread_count);
      });

      setUnreadMap(map);
    };

    fetchUnreadCount();
  }, [currentUser]);

  /* ▼ ルーム取得 */
  useEffect(() => {
    const fetchRooms = async () => {
      if (!currentUser) return;

      try {
        const { data: myParts } = await supabase
          .from("room_participants")
          .select("room_id")
          .eq("user_id", currentUser.id);

        if (!myParts || myParts.length === 0) {
          setRooms([]);
          setLoading(false);
          return;
        }

        const roomIds = myParts.map((p) => p.room_id);

        const { data: roomsData } = await supabase
          .from("rooms")
          .select("*")
          .in("id", roomIds)
          .order("updated_at", { ascending: false });

        const result: RoomWithPartner[] = [];

        for (const room of roomsData || []) {
          let partner: Profile | undefined = undefined;

          const { data: participants } = await supabase
            .from("room_participants")
            .select("user_id")
            .eq("room_id", room.id);

          if (participants && room.type === "dm") {
            const partnerObj = participants.find(
              (p) => p.user_id !== currentUser.id
            );

            if (partnerObj) {
              const { data: pData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", partnerObj.user_id)
                .single();

              partner = pData || undefined;
            }
          }

          result.push({ ...room, partner });
        }

        setRooms(result);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [currentUser]);

  /* ▼ タブフィルタリング */
  const filteredRooms =
    tab === "friends"
      ? rooms.filter(
          (room) => room.partner && friendIds.includes(room.partner.id)
        )
      : rooms.filter(
          (room) => room.partner && !friendIds.includes(room.partner.id)
        );

  if (loading) return <div className="room-list-loading">読み込み中...</div>;

  return (
    <div className="room-list-wrapper">
      {/* ▼ タブ */}
      <div className="room-tab-container">
        <button
          className={`room-tab ${tab === "friends" ? "active" : ""}`}
          onClick={() => setTab("friends")}
        >
          友だち
        </button>
        <button
          className={`room-tab ${tab === "others" ? "active" : ""}`}
          onClick={() => setTab("others")}
        >
          その他
        </button>
      </div>

      {/* ▼ ルーム一覧 */}
      <div className="room-list-content">
        {filteredRooms.length === 0 ? (
          <div className="room-list-empty">データがありません</div>
        ) : (
          filteredRooms.map((room) => {
            const title = room.partner?.name ?? "退会済みユーザー";
            const avatarUrl = room.partner?.avatar_url || PLACEHOLDER_AVATAR;
            const unread = unreadMap.get(room.id) ?? 0;

            const dateStr = new Date(room.updated_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={room.id}
                className="room-list-item"
                onClick={() => navigate(`/talk/${room.id}`)}
              >
                <div className="avatar-wrapper">
                  <img src={avatarUrl} className="room-item-avatar" />

                  {/* ▼ 未読バッジ */}
                  {unread > 0 && <span className="unread-badge">{unread}</span>}
                </div>

                <div className="room-item-info">
                  <div className="room-item-header">
                    <strong>{title}</strong>
                    <span className="room-item-date">{dateStr}</span>
                  </div>
                  <p className="room-item-message">メッセージを確認する &gt;</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
