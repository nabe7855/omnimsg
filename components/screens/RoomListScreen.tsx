"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile, RoomWithPartner } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";
import "@/styles/RoomList.css";
import React, { useEffect, useState } from "react";

const PLACEHOLDER_AVATAR = "/placeholder-avatar.png";

// タブの定義
type RoomTab = "friends" | "others" | "groups";

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

  /* ▼ ルーム取得（ハイブリッド対応版） */
  useEffect(() => {
    const fetchRooms = async () => {
      if (!currentUser) return;

      try {
        // 1. 新しいテーブル (room_members / profile_id) から自分の参加ルームを取得
        const { data: memberRows } = await supabase
          .from("room_members")
          .select("room_id")
          .eq("profile_id", currentUser.id);

        // 2. 古いテーブル (room_participants / user_id) から自分の参加ルームを取得
        const { data: participantRows } = await supabase
          .from("room_participants")
          .select("room_id")
          .eq("user_id", currentUser.id);

        // 3. 両方のルームIDを結合して重複を削除 (Setを使用)
        const roomIds = Array.from(new Set([
          ...(memberRows?.map((r) => r.room_id) || []),
          ...(participantRows?.map((r) => r.room_id) || []),
        ]));

        if (roomIds.length === 0) {
          setRooms([]);
          setLoading(false);
          return;
        }

        // 4. ルーム詳細情報を取得
        const { data: roomsData } = await supabase
          .from("rooms")
          .select("*")
          .in("id", roomIds)
          .order("updated_at", { ascending: false });

        const result: RoomWithPartner[] = [];

        for (const room of roomsData || []) {
          // ==============================
          // パターンA: グループの場合
          // ==============================
          if (room.type === "group") {
            // グループはパートナー不要なのでそのまま追加
            result.push({ ...room, partner: undefined });
            continue;
          }

          // ==============================
          // パターンB: DMの場合 (相手を探す)
          // ==============================
          let partner: Profile | undefined = undefined;

          // まず古いテーブル (room_participants) で相手を探す (既存DM対応)
          const { data: participants } = await supabase
            .from("room_participants")
            .select("user_id")
            .eq("room_id", room.id);

          if (participants && participants.length > 0) {
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
          } else {
            // もし古いテーブルになければ、新しいテーブル (room_members) も探す (念の為)
            const { data: members } = await supabase
              .from("room_members")
              .select("profile_id")
              .eq("room_id", room.id);
            
            if (members) {
              const partnerObj = members.find(
                (p) => p.profile_id !== currentUser.id
              );
              if (partnerObj) {
                const { data: pData } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", partnerObj.profile_id)
                  .single();
                partner = pData || undefined;
              }
            }
          }

          // 相手が見つかった、または退会済み(undefined)でもDMとしてリストに追加
          // (フィルタリングで弾かれるがデータとしては保持)
          result.push({ ...room, partner });
        }

        setRooms(result);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [currentUser]);

  /* ▼ タブフィルタリングロジック */
  const filteredRooms = rooms.filter((room) => {
    if (tab === "groups") {
      // グループタブ
      return room.type === "group";
    } else if (tab === "friends") {
      // 友だちタブ: DM かつ 相手が存在し、かつ友達リストに含まれる
      return (
        room.type === "dm" &&
        room.partner &&
        friendIds.includes(room.partner.id)
      );
    } else {
      // その他タブ: DM かつ (相手が友達でない OR 相手が見つからない/退会済み)
      if (room.type !== "dm") return false;
      
      // パートナーデータがある場合 → 友達リストにないなら表示
      if (room.partner) {
        return !friendIds.includes(room.partner.id);
      }
      // パートナーデータがない(退会済みなど)場合 → その他に表示
      return true;
    }
  });

  if (loading) return <div className="room-list-loading">読み込み中...</div>;

  return (
    <div className="room-list-wrapper">
      {/* ▼ タブ切り替え */}
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
        <button
          className={`room-tab ${tab === "groups" ? "active" : ""}`}
          onClick={() => setTab("groups")}
        >
          グループ
        </button>
      </div>

      {/* ▼ ルーム一覧表示 */}
      <div className="room-list-content">
        {filteredRooms.length === 0 ? (
          <div className="room-list-empty">
            {tab === "groups"
              ? "グループはありません"
              : "メッセージはありません"}
          </div>
        ) : (
          filteredRooms.map((room) => {
            // 表示名とアイコンの決定ロジック
            let title = "不明なルーム";
            let avatarUrl = PLACEHOLDER_AVATAR;

            if (room.type === "group") {
              title = room.group_name || "グループ";
              avatarUrl = `https://ui-avatars.com/api/?name=${title}&background=random`;
            } else {
              title = room.partner?.name ?? "退会済みユーザー";
              avatarUrl = room.partner?.avatar_url || PLACEHOLDER_AVATAR;
            }

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
                  <img
                    src={avatarUrl}
                    className="room-item-avatar"
                    alt="icon"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src = PLACEHOLDER_AVATAR)
                    }
                  />
                  {/* ▼ 未読バッジ */}
                  {unread > 0 && <span className="unread-badge">{unread}</span>}
                </div>

                <div className="room-item-info">
                  <div className="room-item-header">
                    <strong>{title}</strong>
                    <span className="room-item-date">{dateStr}</span>
                  </div>
                  <p className="room-item-message">
                    {room.type === "group"
                      ? "グループチャット"
                      : "メッセージを確認する >"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};