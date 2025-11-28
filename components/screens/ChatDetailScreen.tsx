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

// 画像のフォールバック用
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
  // 認証チェック
  // ============================
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // ============================
  // ルーム情報の読み込み
  // ============================
  useEffect(() => {
    const fetchRoomInfo = async () => {
      if (!currentUser) return;

      // 1. ルーム情報を取得
      const { data: room, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error || !room) {
        alert("チャットルームが見つかりません");
        navigate("/talks");
        return;
      }

      // 2. 参加者情報を取得して相手を特定
      const { data: participants } = await supabase
        .from("room_participants")
        .select("user_id")
        .eq("room_id", roomId);

      let partner: Profile | undefined = undefined;

      if (room.type === "dm" && participants) {
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

      const memberIds = participants ? participants.map((p) => p.user_id) : [];

      setCurrentRoom({
        ...room,
        partner,
        member_ids: memberIds,
      });
    };

    fetchRoomInfo();
  }, [roomId, currentUser, navigate]);

  // ============================
  // メッセージ読み込み + リアルタイム監視
  // ============================
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
      }
    };

    fetchMessages();

    // リアルタイム更新の設定
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
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
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
  // メッセージ送信
  // ============================
  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim() || !currentUser) return;

    try {
      // 1. メッセージを送信
      const { error } = await supabase.from("messages").insert([
        {
          room_id: roomId,
          sender_id: currentUser.id,
          content: text,
          message_type: MessageType.TEXT,
        },
      ]);

      if (error) throw error;
      setInputText("");

      // 2. updated_at を更新
      await supabase
        .from("rooms")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", roomId);
    } catch (e) {
      console.error(e);
      alert("送信に失敗しました");
    }
  };

  // ============================
  // ヘッダークリックアクション
  // ============================
  const goToHeaderAction = () => {
    if (currentRoom?.type === "dm" && currentRoom.partner) {
      navigate(`/users/${currentRoom.partner.id}`);
    } else if (
      currentRoom?.type === "group" &&
      currentUser?.role === UserRole.STORE
    ) {
      navigate(`/group/edit/${currentRoom.id}`);
    }
  };

  if (!currentUser) return null;
  if (!currentRoom) {
    return <div className="chat-loading">読み込み中...</div>;
  }

  console.log("===== STORE CHAT CHECK =====");
console.log("CurrentUser:", currentUser);
console.log("CurrentUser.role:", currentUser?.role);

console.log("CurrentRoom:", currentRoom);
console.log("Room.type:", currentRoom?.type);

console.log("Partner:", currentRoom?.partner);
console.log("Partner.role:", currentRoom?.partner?.role);

console.log("isStoreChat 判定:", {
  cond1: currentRoom?.type === "dm",
  cond2: currentRoom?.partner !== undefined,
  cond3: currentUser?.role === UserRole.USER,
  cond4: currentRoom?.partner?.role === UserRole.STORE,
});


  // ============================
  // ★ 店舗チャット判定（安全版）
  // ============================
  const isStoreChat =
    currentRoom?.type === "dm" &&
    currentRoom?.partner !== undefined &&
    currentUser?.role === UserRole.USER &&
    currentRoom.partner.role === UserRole.STORE;

  const headerTitle =
    currentRoom.type === "group"
      ? currentRoom.group_name || "グループチャット"
      : currentRoom.partner?.name || "退会済みユーザー";

  const headerImage =
    currentRoom.type === "group"
      ? `https://ui-avatars.com/api/?name=${headerTitle}&background=random`
      : currentRoom.partner?.avatar_url || PLACEHOLDER_AVATAR;

  return (
    <div className="chat-screen">
      {/* 
        ★修正: 戻るボタンを含むヘッダー全体を、
        共通ヘッダーと被らないように「相手の情報だけ表示するバー」に変更
      */}
      <div className="chat-header">
        {/* 左側の戻るボタンを削除しました */}

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

      {/* Rich Menu (店舗とのDMかつ自分がユーザーの場合のみ) */}
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
