"use client";

import { RichMenu } from "@/components/RichMenu";
import { supabase } from "@/lib/supabaseClient";
import {
  Message,
  MessageType,
  Profile,
  RoomWithPartner,
  UserRole,
} from "@/lib/types";
import { ChatDetailProps } from "@/lib/types/screen";
import React, { useEffect, useRef, useState } from "react";

const PLACEHOLDER_AVATAR = "/placeholder-avatar.png";

export const ChatDetailScreen: React.FC<ChatDetailProps> = ({
  currentUser,
  roomId,
  navigate,
}) => {
  const [currentRoom, setCurrentRoom] = useState<RoomWithPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ============================
  // ログインチェック
  // ============================
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // ============================
  // ルーム情報読み込み（★修正1：ハイブリッド対応）
  // ============================
  useEffect(() => {
    const loadRoom = async () => {
      if (!currentUser) return;

      // 1. ルーム情報の取得
      const { data: room, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error || !room) {
        alert("チャットルームが存在しません");
        navigate("/talks");
        return;
      }

      // 2. メンバー情報の取得（新旧両方のテーブルを確認）
      // 古いDMテーブル
      const { data: participants } = await supabase
        .from("room_participants")
        .select("user_id")
        .eq("room_id", roomId);

      // 新しいグループ/DMテーブル
      const { data: members } = await supabase
        .from("room_members")
        .select("profile_id")
        .eq("room_id", roomId);

      let partner: Profile | undefined = undefined;

      // DMの場合、相手（パートナー）を特定する
      if (room.type === "dm") {
        // 古いテーブルから相手を探す
        let partnerId = participants?.find(
          (p) => p.user_id !== currentUser.id
        )?.user_id;

        // 見つからなければ新しいテーブルから探す
        if (!partnerId) {
          partnerId = members?.find(
            (m) => m.profile_id !== currentUser.id
          )?.profile_id;
        }

        // IDが見つかればプロフィールを取得
        if (partnerId) {
          const { data: pData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", partnerId)
            .single();

          if (pData) partner = pData;
        }
      }

      // メンバーIDリストを作成（新旧をマージして重複排除）
      const pIds = participants ? participants.map((p) => p.user_id) : [];
      const mIds = members ? members.map((m) => m.profile_id) : [];
      const allMemberIds = Array.from(new Set([...pIds, ...mIds]));

      setCurrentRoom({
        ...room,
        partner,
        member_ids: allMemberIds,
      });
    };

    loadRoom();
  }, [roomId, currentUser, navigate]);

  // ============================
  // メッセージ読み込み + Realtime（★修正2：重複排除）
  // ============================
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
    };

    loadMessages();

    // Realtime チャンネル
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // 既に表示されているメッセージ（自分で送信して即時反映したものなど）は除外して追加
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // ============================
  // 自動スクロール
  // ============================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================
  // 既読処理
  // ============================
  useEffect(() => {
    if (!currentUser || messages.length === 0) return;

    const markAsRead = async () => {
      try {
        const unread = messages.filter((m) => m.sender_id !== currentUser.id);
        if (unread.length === 0) return;

        const rows = unread.map((m) => ({
          message_id: m.id,
          user_id: currentUser.id,
        }));

        await supabase.from("message_reads").upsert(rows, {
          onConflict: "message_id,user_id",
          ignoreDuplicates: true,
        });
      } catch (e) {
        console.error("既読処理エラー:", e);
      }
    };

    markAsRead();
  }, [messages, currentUser]);

  // ============================
  // メッセージ送信（★修正2：即時反映処理を追加）
  // ============================
  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim() || !currentUser) return;

    // 入力欄をクリア（UIのレスポンス向上）
    setInputText("");

    try {
      // 1. DBに挿入し、その結果（生成されたIDや時刻など）を取得する (.select().single() を追加)
      const { data: insertedMsg, error } = await supabase
        .from("messages")
        .insert([
          {
            room_id: roomId,
            sender_id: currentUser.id,
            content: text,
            message_type: MessageType.TEXT,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // 2. 成功したら、Realtimeの通知を待たずに手動でリストに追加する
      if (insertedMsg) {
        setMessages((prev) => [...prev, insertedMsg]);
      }

      // ルームの更新日時を更新
      await supabase
        .from("rooms")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", roomId);
    } catch (e) {
      console.error("送信エラー:", e);
      alert("送信に失敗しました");
      // エラー時は入力したテキストを戻すなどの配慮があっても良い
      setInputText(text);
    }
  };

  // ============================
  // プロフィール画面へ遷移
  // ============================
  const goToHeaderAction = () => {
    if (currentRoom?.type === "dm" && currentRoom.partner) {
      navigate(`/users/${currentRoom.partner.id}`);
    }
  };

  if (!currentUser) return null;
  if (!currentRoom) return <div className="chat-loading">読み込み中...</div>;

  const isStoreChat =
    currentRoom.type === "dm" &&
    currentRoom.partner &&
    currentUser.role === UserRole.USER &&
    currentRoom.partner.role === UserRole.STORE;

  const headerTitle =
    currentRoom.type === "group"
      ? currentRoom.group_name
      : currentRoom.partner?.name || "退会済みユーザー";

  const headerImage =
    currentRoom.type === "group"
      ? `https://ui-avatars.com/api/?name=${headerTitle}&background=random`
      : currentRoom.partner?.avatar_url || PLACEHOLDER_AVATAR;

  return (
    <div className="chat-screen">
      {/* Header */}
      <div className="chat-header">
        <div
          className="chat-header-main"
          onClick={goToHeaderAction}
          style={{ cursor: "pointer", marginLeft: "8px" }}
        >
          <img
            src={headerImage}
            className="chat-header-avatar"
            alt="icon"
            onError={(e) =>
              ((e.target as HTMLImageElement).src = PLACEHOLDER_AVATAR)
            }
          />
          <div className="chat-header-text">
            <span className="chat-header-title">{headerTitle}</span>
            {currentRoom.type === "group" && (
              <span className="chat-header-subtitle">
                {currentRoom.member_ids.length}人のメンバー
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty-message">メッセージはまだありません</div>
        )}

        {messages.map((m) => {
          const isMe = m.sender_id === currentUser.id;
          const isBot = m.message_type === MessageType.BOT_RESPONSE;

          return (
            <div
              key={m.id}
              className={`chat-message-row ${
                isMe ? "chat-message-row-right" : "chat-message-row-left"
              }`}
            >
              <div
                className={
                  isBot
                    ? "chat-bubble-bot"
                    : isMe
                    ? "chat-bubble-me"
                    : "chat-bubble-other"
                }
              >
                {isBot && <span className="bot-label">🤖 自動応答</span>}
                {m.content}
              </div>

              <span className="chat-timestamp">
                {new Date(m.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Rich Menu */}
      {isStoreChat && currentRoom.partner && (
        <RichMenu storeId={currentRoom.partner.id} onSend={handleSendMessage} />
      )}

      {/* Input */}
      <div className="chat-input-bar">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="メッセージを入力..."
          className="chat-input-field"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim()}
          className="chat-send-button"
        >
          <svg
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="icon-20"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
