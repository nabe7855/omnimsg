"use client";

import { supabase } from "@/lib/supabaseClient";
import {
  Message,
  MessageType,
  Profile,
  RoomWithPartner,
  UserRole,
} from "@/lib/types"; // Message, MessageTypeを追加
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

  // ★追加: 各ルームの最新メッセージを保持するMap
  const [latestMessages, setLatestMessages] = useState<
    Map<string, Message | null>
  >(new Map());

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

  /* ▼ ルーム取得（ハイブリッド対応版 + 最新メッセージ取得） */
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

        // 4. ルーム詳細情報を取得
        const { data: roomsData } = await supabase
          .from("rooms")
          .select("*")
          .in("id", roomIds)
          .order("updated_at", { ascending: false });

        const result: RoomWithPartner[] = [];

        // ★追加: 最新メッセージ取得用のMap準備
        const messageMap = new Map<string, Message | null>();

        // 並行処理でルーム処理とメッセージ取得を行う
        await Promise.all(
          (roomsData || []).map(async (room) => {
            // ★追加: 各ルームの最新メッセージを1件取得
            const { data: lastMsg } = await supabase
              .from("messages")
              .select("*")
              .eq("room_id", room.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(); // 0件の場合はnullになる

            messageMap.set(room.id, lastMsg);

            // ==============================
            // パターンA: グループの場合
            // ==============================
            if (room.type === "group") {
              result.push({ ...room, partner: undefined });
              return;
            }

            // ==============================
            // パターンB: DMの場合 (相手を探す)
            // ==============================
            let partner: Profile | undefined = undefined;

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
            result.push({ ...room, partner });
          })
        );

        // ルーム一覧を updated_at 順 (降順) に並び替え直す
        // Promise.allで順番が前後する可能性があるため再ソート推奨ですが、
        // 今回はとりあえず取得順で処理されています。必要に応じて sort を入れてください。
        result.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        setRooms(result);
        setLatestMessages(messageMap);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [currentUser]);

  /* ▼ タブフィルタリングロジック */
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

  // ============================================
  // 一斉送信ボタン関連
  // ============================================
  const canBroadcast =
    currentUser?.role === UserRole.STORE || currentUser?.role === UserRole.CAST;

  if (loading) return <div className="room-list-loading">読み込み中...</div>;

  return (
    <div className="room-list-wrapper">
      {/* ▼ ヘッダー部分 */}
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

      {/* ▼ タブ切り替え */}
      <div
        className="room-tab-container"
        style={{
          display: "flex",
          width: "100%",
          borderBottom: "1px solid #eee",
          backgroundColor: "white",
        }}
      >
        {/* ...タブボタンの実装は変更なし... */}
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

            // ★追加: 最新メッセージの表示ロジック
            const lastMsg = latestMessages.get(room.id);
            let messagePreview = "メッセージはまだありません";

            if (lastMsg) {
              if (lastMsg.message_type === MessageType.IMAGE) {
                messagePreview = "画像が送信されました";
              } else if (lastMsg.message_type === MessageType.AUDIO) {
                messagePreview = "音声が送信されました";
              } else {
                // テキストの場合、長すぎたら省略しても良いですが、CSSで省略されることが多いです
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
                  {/* ★修正: 最新メッセージを表示 */}
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
