"use client";

import { RichMenu } from "@/components/RichMenu";
import { getConnectablePeople } from "@/lib/db/group";
import { supabase } from "@/lib/supabaseClient";
import {
  Message,
  MessageType,
  Profile,
  RoomWithPartner,
  UserRole,
} from "@/lib/types";
import { ChatDetailProps } from "@/lib/types/screen";
import imageCompression from "browser-image-compression";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // メンバー管理用ステート
  const [memberProfiles, setMemberProfiles] = useState<Profile[]>([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [addCandidates, setAddCandidates] = useState<Profile[]>([]);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  // ============================
  // ログインチェック
  // ============================
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // ============================
  // ルーム情報 & メンバー詳細読み込み
  // ============================
  useEffect(() => {
    const loadRoomAndMembers = async () => {
      if (!currentUser) return;

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

      const { data: participants } = await supabase
        .from("room_participants")
        .select("user_id")
        .eq("room_id", roomId);

      const { data: members } = await supabase
        .from("room_members")
        .select("profile_id")
        .eq("room_id", roomId);

      const pIds = participants ? participants.map((p) => p.user_id) : [];
      const mIds = members ? members.map((m) => m.profile_id) : [];
      const allMemberIds = Array.from(new Set([...pIds, ...mIds]));

      if (allMemberIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", allMemberIds);

        if (profiles) {
          setMemberProfiles(profiles);
        }
      }

      let partner: Profile | undefined = undefined;
      if (room.type === "dm") {
        const partnerId = allMemberIds.find((id) => id !== currentUser.id);
        if (partnerId) {
          const { data: pData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", partnerId)
            .single();
          if (pData) partner = pData;
        }
      }

      setCurrentRoom({
        ...room,
        partner,
        member_ids: allMemberIds,
      });
    };

    loadRoomAndMembers();
  }, [roomId, currentUser, navigate]);

  // ============================
  // 追加候補の取得
  // ============================
  const fetchAddCandidates = async () => {
    if (!currentUser || !currentRoom) return;
    setIsLoadingCandidates(true);
    try {
      const { casts, usersByCast } = await getConnectablePeople(currentUser.id);
      const candidatesMap = new Map<string, Profile>();

      casts.forEach((cast) => {
        candidatesMap.set(cast.id, cast);
      });
      Object.values(usersByCast).forEach((userList) => {
        userList.forEach((user) => {
          candidatesMap.set(user.id, user);
        });
      });

      const currentMemberIds = currentRoom.member_ids;
      currentMemberIds.forEach((existingId) => {
        if (candidatesMap.has(existingId)) {
          candidatesMap.delete(existingId);
        }
      });
      setAddCandidates(Array.from(candidatesMap.values()));
    } catch (e) {
      console.error("候補取得エラー:", e);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  // ============================
  // メンバー追加・削除
  // ============================
  const handleAddMember = async (targetProfile: Profile) => {
    try {
      const { error } = await supabase.from("room_members").insert({
        room_id: roomId,
        profile_id: targetProfile.id,
      });
      if (error) throw error;
      alert(`${targetProfile.name}さんを追加しました`);
      setMemberProfiles((prev) => [...prev, targetProfile]);
      setCurrentRoom((prev) =>
        prev
          ? { ...prev, member_ids: [...prev.member_ids, targetProfile.id] }
          : null
      );
      setAddCandidates((prev) => prev.filter((p) => p.id !== targetProfile.id));
    } catch (e) {
      console.error("追加エラー:", e);
      alert("追加に失敗しました");
    }
  };

  const handleRemoveMember = async (targetId: string) => {
    if (!window.confirm("本当に削除しますか？")) return;
    try {
      const { error } = await supabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("profile_id", targetId);
      if (error) throw error;
      setMemberProfiles((prev) => prev.filter((p) => p.id !== targetId));
      setCurrentRoom((prev) =>
        prev
          ? {
              ...prev,
              member_ids: prev.member_ids.filter((id) => id !== targetId),
            }
          : null
      );
    } catch (e) {
      console.error("削除エラー:", e);
      alert("削除に失敗しました");
    }
  };

  // ============================
  // メッセージ読み込み + Realtime
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

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================
  // メッセージ送信 (テキスト)
  // ============================
  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim() || !currentUser) return;
    setInputText("");
    try {
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
      if (insertedMsg) setMessages((prev) => [...prev, insertedMsg]);
      await supabase
        .from("rooms")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", roomId);
    } catch (e) {
      console.error("送信エラー:", e);
      setInputText(text);
    }
  };

  // ============================
  // 画像送信処理
  // ============================
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !currentUser) return;
    const originalFile = e.target.files[0];

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(originalFile, options);
      const fileExt = originalFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${roomId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-images").getPublicUrl(filePath);

      const { data: insertedMsg, error: insertError } = await supabase
        .from("messages")
        .insert([
          {
            room_id: roomId,
            sender_id: currentUser.id,
            content: publicUrl,
            message_type: MessageType.IMAGE,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      if (insertedMsg) setMessages((prev) => [...prev, insertedMsg]);

      await supabase
        .from("rooms")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", roomId);
    } catch (e) {
      console.error("画像送信エラー:", e);
      alert("画像の送信に失敗しました");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ============================
  // ★修正: メッセージ削除（送信取り消し + Storage削除）
  // ============================
  const handleDeleteMessage = async (message: Message) => {
    if (!window.confirm("送信を取り消しますか？")) return;

    try {
      // 1. 画像タイプならStorageからファイルを削除
      if (message.message_type === MessageType.IMAGE && message.content) {
        // public URLからパスを抽出
        // 例: .../chat-images/roomId/filename.jpg -> roomId/filename.jpg
        const urlParts = message.content.split("/chat-images/");

        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          // ファイル削除実行
          const { error: storageError } = await supabase.storage
            .from("chat-images")
            .remove([filePath]);

          if (storageError) {
            console.error("Storage delete error:", storageError);
            // Storage削除に失敗してもDB削除は続行する
          }
        }
      }

      // 2. DBからメッセージを削除
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", message.id);

      if (error) throw error;

      // Realtimeの通知を待たず即時反映
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
    } catch (e) {
      console.error("削除エラー:", e);
      alert("削除できませんでした");
    }
  };

  // ============================
  // 画像ダウンロード
  // ============================
  const handleDownloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("ダウンロードエラー:", e);
      window.open(url, "_blank");
    }
  };

  // ============================
  // ヘッダーアクション
  // ============================
  const handleHeaderClick = () => {
    if (currentRoom?.type === "group") {
      setIsMemberModalOpen(true);
      setIsAddingMode(false);
    } else if (currentRoom?.type === "dm" && currentRoom.partner) {
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

  const isOwner = currentUser.role === UserRole.STORE;

  const headerTitle =
    currentRoom.type === "group"
      ? currentRoom.group_name
      : currentRoom.partner?.name || "退会済みユーザー";

  const headerImage =
    currentRoom.type === "group"
      ? `https://ui-avatars.com/api/?name=${headerTitle}&background=random`
      : currentRoom.partner?.avatar_url || PLACEHOLDER_AVATAR;

  return (
    <div className="chat-screen" style={{ position: "relative" }}>
      {/* Header */}
      <div className="chat-header">
        <div
          className="chat-header-main"
          onClick={handleHeaderClick}
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
                {currentRoom.member_ids.length}人のメンバー &gt;
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
          const isImage = m.message_type === MessageType.IMAGE;

          return (
            <div
              key={m.id}
              className={`chat-message-row ${
                isMe ? "chat-message-row-right" : "chat-message-row-left"
              }`}
            >
              {/* メッセージ本文 */}
              <div
                className={
                  isBot
                    ? "chat-bubble-bot"
                    : isMe
                    ? "chat-bubble-me"
                    : "chat-bubble-other"
                }
                style={
                  isImage ? { padding: "4px", background: "transparent" } : {}
                }
              >
                {isImage ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start",
                    }}
                  >
                    <img
                      src={m.content}
                      alt="画像"
                      style={{
                        maxWidth: "200px",
                        borderRadius: "10px",
                        border: "1px solid #ddd",
                        cursor: "pointer",
                      }}
                      onClick={() => window.open(m.content, "_blank")}
                    />
                    <button
                      onClick={() => handleDownloadImage(m.content)}
                      style={{
                        marginTop: "4px",
                        fontSize: "11px",
                        color: "#007aff",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      保存
                    </button>
                  </div>
                ) : (
                  <>
                    {isBot && <span className="bot-label">🤖 自動応答</span>}
                    {m.content}
                  </>
                )}
              </div>

              {/* 送信取り消しボタン（引数をメッセージ全体に変更） */}
              {isMe && (
                <button
                  onClick={() => handleDeleteMessage(m)} // ★修正: オブジェクトごと渡す
                  style={{
                    background: "none",
                    border: "none",
                    color: "#999",
                    marginLeft: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    alignSelf: "center",
                  }}
                  title="送信取り消し"
                >
                  ×
                </button>
              )}

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

      {/* Input Area */}
      <div className="chat-input-bar">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleImageSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: "none",
            border: "none",
            padding: "8px",
            marginRight: "5px",
            cursor: "pointer",
            color: "#666",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            style={{ width: "24px", height: "24px" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
        </button>

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
          送信
        </button>
      </div>

      {/* メンバー管理モーダル (変更なし) */}
      {isMemberModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => setIsMemberModalOpen(false)}
        >
          <div
            style={{
              width: "90%",
              maxWidth: "400px",
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "20px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px" }}>
                {isAddingMode ? "メンバーを追加" : "メンバー一覧"}
              </h3>
              <button onClick={() => setIsMemberModalOpen(false)}>×</button>
            </div>
            {!isAddingMode ? (
              <>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {memberProfiles.map((member) => (
                    <li
                      key={member.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "10px",
                        paddingBottom: "10px",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <img
                        src={member.avatar_url || PLACEHOLDER_AVATAR}
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          marginRight: "10px",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "bold" }}>{member.name}</div>
                        <div style={{ fontSize: "12px", color: "#888" }}>
                          {member.role === "store"
                            ? "店舗"
                            : member.role === "cast"
                            ? "キャスト"
                            : "お客様"}
                        </div>
                      </div>
                      {isOwner && member.id !== currentUser.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          style={{
                            backgroundColor: "#ff4444",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            padding: "5px 10px",
                            fontSize: "12px",
                          }}
                        >
                          削除
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {isOwner && (
                  <button
                    onClick={() => {
                      setIsAddingMode(true);
                      fetchAddCandidates();
                    }}
                    style={{
                      width: "100%",
                      marginTop: "15px",
                      padding: "10px",
                      backgroundColor: "#6b46c1",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                    }}
                  >
                    + メンバーを追加する
                  </button>
                )}
              </>
            ) : (
              <>
                {isLoadingCandidates ? (
                  <p style={{ textAlign: "center" }}>読み込み中...</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {addCandidates.map((candidate) => (
                      <li
                        key={candidate.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "10px",
                          paddingBottom: "10px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <img
                          src={candidate.avatar_url || PLACEHOLDER_AVATAR}
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            marginRight: "10px",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "bold" }}>
                            {candidate.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#888" }}>
                            {candidate.role === "cast" ? "キャスト" : "お客様"}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMember(candidate)}
                          style={{
                            backgroundColor: "#6b46c1",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            padding: "5px 10px",
                            fontSize: "12px",
                          }}
                        >
                          追加
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => setIsAddingMode(false)}
                  style={{
                    width: "100%",
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#ccc",
                    color: "#333",
                    border: "none",
                    borderRadius: "5px",
                  }}
                >
                  一覧に戻る
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
