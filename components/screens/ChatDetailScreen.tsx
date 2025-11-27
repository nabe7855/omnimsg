"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/mockSupabase";
import {
  Profile,
  UserRole,
  RoomWithPartner,
  Message,
  MessageType,
} from "@/lib/types";
import { RichMenu } from "../RichMenu";
import { ChatDetailProps } from "@/lib/types/screen";

export const ChatDetailScreen: React.FC<ChatDetailProps> = ({
  currentUser,
  roomId,
  navigate,
}) => {
  const [currentRoom, setCurrentRoom] = useState<RoomWithPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatIntervalRef = useRef<number | null>(null);

  // ============================
  // 認証チェック
  // ============================
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  // ============================
  // ルーム読み込み
  // ============================
  useEffect(() => {
    const loadRoom = async () => {
      const r = await db.getRoomById(roomId);
      if (!r) {
        alert("チャットルームが見つかりません。");
        navigate("/talks");
        return;
      }

      let partner: Profile | undefined;
      if (r.type === "dm") {
        const partnerId = r.member_ids.find((id) => id !== currentUser.id);
        partner = partnerId ? await db.getProfileById(partnerId) : undefined;
      }

      setCurrentRoom({ ...r, partner });
    };

    loadRoom();
  }, [roomId, currentUser, navigate]);

  // ============================
  // メッセージ読み込み + ポーリング
  // ============================
  useEffect(() => {
    const fetchMsgs = async () => {
      const msgs = await db.getMessages(roomId);
      setMessages(msgs);
    };

    fetchMsgs();
    chatIntervalRef.current = window.setInterval(fetchMsgs, 2000);

    return () => {
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
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
    if (!text.trim() || !currentRoom) return;

    await db.sendMessage(currentUser.id, currentRoom.id, text);
    setInputText("");

    // Bot Response
    if (
      currentRoom.type === "dm" &&
      currentUser.role === UserRole.USER &&
      currentRoom.partner?.role === UserRole.STORE
    ) {
      await db.handleBotTrigger(currentRoom.id, currentRoom.partner.id, text);
    }

    const msgs = await db.getMessages(currentRoom.id);
    setMessages(msgs);
  };

  // ============================
  // ヘッダークリックアクション
  // ============================
  const goToHeaderAction = () => {
    if (currentRoom?.type === "dm" && currentRoom.partner) {
      navigate(`/users/${currentRoom.partner.id}`);
    } else if (
      currentRoom?.type === "group" &&
      currentUser.role === UserRole.STORE
    ) {
      navigate(`/group/edit/${currentRoom.id}`);
    }
  };

  if (!currentRoom) {
    return <div className="chat-loading">読み込み中...</div>;
  }

  const isStoreChat =
    currentRoom.type === "dm" &&
    currentUser.role === UserRole.USER &&
    currentRoom.partner?.role === UserRole.STORE;

  const headerTitle =
    currentRoom.type === "group"
      ? currentRoom.group_name
      : currentRoom.partner?.name;

  const headerImage =
    currentRoom.type === "group"
      ? "https://ui-avatars.com/api/?name=Group&background=random"
      : currentRoom.partner?.avatar_url;

  return (
    <div className="chat-screen">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <button
            onClick={() => navigate("/talks")}
            className="btn-icon"
            type="button"
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
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>

          <div className="chat-header-main" onClick={goToHeaderAction}>
            <img
              src={headerImage}
              className="chat-header-avatar"
              alt="icon"
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
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((m) => {
          const isMe = m.sender_id === currentUser.id;
          const isBot = m.message_type === MessageType.BOT_RESPONSE;

          return (
            <div key={m.id} className="chat-message-row">
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

              <span
                className={
                  "chat-timestamp " +
                  (isMe ? "chat-timestamp-right" : "chat-timestamp-left")
                }
              >
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
        <RichMenu
          storeId={currentRoom.partner.id}
          onSend={handleSendMessage}
        />
      )}

      {/* Input */}
      <div className="chat-input-bar">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="メッセージを入力..."
          className="chat-input-field"
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
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
