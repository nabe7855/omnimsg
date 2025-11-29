"use client";

import { supabase } from "@/lib/supabaseClient";
import {
  Message,
  MessageType,
  Profile,
  RoomWithPartner,
  UserRole,
} from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";
import "@/styles/RoomList.css";
import React, { useCallback, useEffect, useState } from "react";

const PLACEHOLDER_AVATAR = "/placeholder-avatar.png";

type RoomTab = "friends" | "others" | "groups";

export const RoomListScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [rooms, setRooms] = useState<RoomWithPartner[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [unreadMap, setUnreadMap] = useState<Map<string, number>>(new Map());
  const [latestMessages, setLatestMessages] = useState<
    Map<string, Message | null>
  >(new Map());
  const [tab, setTab] = useState<RoomTab>("friends");
  const [loading, setLoading] = useState(true);

  // ▼ データを取得する関数を外出し（再利用するため）
  const fetchAllData = useCallback(async () => {
    if (!currentUser) return;

    // 1. 未読数
    const { data: unreadData } = await supabase.rpc("get_unread_count", {
      p_user_id: currentUser.id,
    });
    const uMap = new Map<string, number>();
    unreadData?.forEach((row: any) => uMap.set(row.room_id, row.unread_count));
    setUnreadMap(uMap);

    // 2. ルーム一覧
    const { data: memberRows } = await supabase
      .from("room_members")
      .select("room_id")
      .eq("profile_id", currentUser.id);

    const { data: participantRows } = await supabase
      .from("room_participants")
      .select("room_id")
      .eq("user_id", currentUser.id);

    const roomIds = Array.from(
      new Set([
        ...(memberRows?.map((r) => r.room_id) || []),
        ...(participantRows?.map((r) => r.room_id) || []),
      ])
    );

    if (roomIds.length === 0) {
      setRooms([]);
      setLoading(false);
      return;
    }

    const { data: roomsData } = await supabase
      .from("rooms")
      .select("*")
      .in("id", roomIds)
      .order("updated_at", { ascending: false });

    const result: RoomWithPartner[] = [];
    const msgMap = new Map<string, Message | null>();

    await Promise.all(
      (roomsData || []).map(async (room) => {
        // 最新メッセージ取得
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("*")
          .eq("room_id", room.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        msgMap.set(room.id, lastMsg);

        if (room.type === "group") {
          result.push({ ...room, partner: undefined });
          return;
        }

        // パートナー取得
        let partner: Profile | undefined = undefined;
        const { data: participants } = await supabase
          .from("room_participants")
          .select("user_id")
          .eq("room_id", room.id);

        let partnerId = participants?.find(
          (p) => p.user_id !== currentUser.id
        )?.user_id;

        if (!partnerId) {
          const { data: members } = await supabase
            .from("room_members")
            .select("profile_id")
            .eq("room_id", room.id);
          partnerId = members?.find(
            (m) => m.profile_id !== currentUser.id
          )?.profile_id;
        }

        if (partnerId) {
          const { data: pData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", partnerId)
            .single();
          partner = pData || undefined;
        }
        result.push({ ...room, partner });
      })
    );

    // ソート
    result.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    setRooms(result);
    setLatestMessages(msgMap);
    setLoading(false);
  }, [currentUser]);

  // ▼ 初期ロード & 友達リスト取得
  useEffect(() => {
    const fetchFriends = async () => {
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
    fetchFriends();
    fetchAllData();
  }, [currentUser, fetchAllData]);

  // ▼ リアルタイム監視 (メッセージが来たら一覧を更新)
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel("room-list-updates")
.on(
  "postgres_changes",
  { event: "INSERT", schema: "public", table: "messages" },
  (payload) => {
    const newMsg = payload.new;
    if (!newMsg) return;
    if (newMsg.sender_id === currentUser.id) return; // ⭐ 追加

    fetchAllData();
  }
)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, fetchAllData]);

  // ... 以下、表示ロジック ...
  const filteredRooms = rooms.filter((room) => {
    if (tab === "groups") {
      return room.type === "group";
    } else if (tab === "friends") {
      return (
        room.type === "dm" &&
        room.partner &&
        friendIds.includes(room.partner.id)
      );
    } else {
      if (room.type !== "dm") return false;
      if (room.partner) {
        return !friendIds.includes(room.partner.id);
      }
      return true;
    }
  });

  const canBroadcast =
    currentUser?.role === UserRole.STORE || currentUser?.role === UserRole.CAST;

  if (loading) return <div className="room-list-loading">読み込み中...</div>;

  return (
    <div className="room-list-wrapper">
      <div
        style={{
          padding: "15px",
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "18px",
          borderBottom: "1px solid #eee",
          position: "relative",
          backgroundColor: "white",
        }}
      >
        トーク一覧
        {canBroadcast && (
          <button
            onClick={() => navigate("/broadcast")}
            style={{
              position: "absolute",
              right: "15px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b46c1",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
              fontWeight: "normal",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              style={{ width: 20, height: 20 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
            一斉送信
          </button>
        )}
      </div>

      <div
        className="room-tab-container"
        style={{
          display: "flex",
          width: "100%",
          borderBottom: "1px solid #eee",
          backgroundColor: "white",
        }}
      >
        <button
          className={`room-tab ${tab === "friends" ? "active" : ""}`}
          onClick={() => setTab("friends")}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "12px 0",
            cursor: "pointer",
            background: "none",
            border: "none",
            borderBottom:
              tab === "friends" ? "2px solid #6b46c1" : "2px solid transparent",
            color: tab === "friends" ? "#6b46c1" : "#666",
            fontWeight: tab === "friends" ? "bold" : "normal",
          }}
        >
          友だち
        </button>
        <button
          className={`room-tab ${tab === "others" ? "active" : ""}`}
          onClick={() => setTab("others")}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "12px 0",
            cursor: "pointer",
            background: "none",
            border: "none",
            borderBottom:
              tab === "others" ? "2px solid #6b46c1" : "2px solid transparent",
            color: tab === "others" ? "#6b46c1" : "#666",
            fontWeight: tab === "others" ? "bold" : "normal",
          }}
        >
          その他
        </button>
        <button
          className={`room-tab ${tab === "groups" ? "active" : ""}`}
          onClick={() => setTab("groups")}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "12px 0",
            cursor: "pointer",
            background: "none",
            border: "none",
            borderBottom:
              tab === "groups" ? "2px solid #6b46c1" : "2px solid transparent",
            color: tab === "groups" ? "#6b46c1" : "#666",
            fontWeight: tab === "groups" ? "bold" : "normal",
          }}
        >
          グループ
        </button>
      </div>

      <div className="room-list-content">
        {filteredRooms.length === 0 ? (
          <div className="room-list-empty">
            {tab === "groups"
              ? "グループはありません"
              : "メッセージはありません"}
          </div>
        ) : (
          filteredRooms.map((room) => {
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

            const lastMsg = latestMessages.get(room.id);
            let messagePreview = "メッセージはまだありません";

            if (lastMsg) {
              if (lastMsg.message_type === MessageType.IMAGE) {
                messagePreview = "画像が送信されました";
              } else if (lastMsg.message_type === MessageType.AUDIO) {
                messagePreview = "音声が送信されました";
              } else {
                messagePreview = lastMsg.content;
              }
            }

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
                  {unread > 0 && <span className="unread-badge">{unread}</span>}
                </div>

                <div className="room-item-info">
                  <div className="room-item-header">
                    <strong>{title}</strong>
                    <span className="room-item-date">{dateStr}</span>
                  </div>
                  <p
                    className="room-item-message"
                    style={{ color: lastMsg ? "#666" : "#999" }}
                  >
                    {messagePreview}
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
