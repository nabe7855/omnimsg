"use client";

import { RichMenu } from "@/components/RichMenu";
import { getConnectablePeople } from "@/lib/db/group"; // ★追加: グループ作成ロジックをインポート
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

  // メンバー管理用のステート
  const [memberProfiles, setMemberProfiles] = useState<Profile[]>([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [addCandidates, setAddCandidates] = useState<Profile[]>([]); // 追加候補
  const [isAddingMode, setIsAddingMode] = useState(false); // 追加画面モードかどうか
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false); // 候補読み込み中

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

      // 2. メンバーIDの取得
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

      // 3. 全メンバーのプロフィール情報を取得
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
  // ★修正: 追加候補の取得（getConnectablePeopleを使用）
  // ============================
  const fetchAddCandidates = async () => {
    if (!currentUser || !currentRoom) return;

    setIsLoadingCandidates(true);
    try {
      // 1. グループ作成と同じロジックで「関係のある全ユーザー」を取得
      // (店舗自身、所属キャスト、それぞれの友達ユーザーが含まれる)
      const { casts, usersByCast } = await getConnectablePeople(currentUser.id);

      // 2. データをフラットな配列に変換して重複を排除する
      const candidatesMap = new Map<string, Profile>();

      // キャスト（店舗含む）を追加
      casts.forEach((cast) => {
        candidatesMap.set(cast.id, cast);
      });

      // ユーザー（客）を追加
      Object.values(usersByCast).forEach((userList) => {
        userList.forEach((user) => {
          candidatesMap.set(user.id, user);
        });
      });

      // 3. 既にルームにいるメンバーを除外
      const currentMemberIds = currentRoom.member_ids;
      currentMemberIds.forEach((existingId) => {
        if (candidatesMap.has(existingId)) {
          candidatesMap.delete(existingId);
        }
      });

      // 4. 配列に戻してセット
      setAddCandidates(Array.from(candidatesMap.values()));
    } catch (e) {
      console.error("候補取得エラー:", e);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  // ============================
  // メンバー操作（追加・削除）
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
      // 追加した人を候補リストから消す
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
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
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
  // メッセージ送信
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
          送信
        </button>
      </div>

      {/* ★★★ メンバー管理モーダル ★★★ */}
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
              // ▼▼ メンバー一覧モード ▼▼
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

                      {/* 削除ボタン */}
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
              // ▼▼ メンバー追加モード ▼▼
              <>
                {isLoadingCandidates ? (
                  <p style={{ textAlign: "center" }}>読み込み中...</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {addCandidates.length === 0 ? (
                      <p style={{ color: "#888", textAlign: "center" }}>
                        追加できる候補がいません
                      </p>
                    ) : (
                      addCandidates.map((candidate) => (
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
                              {candidate.role === "cast"
                                ? "キャスト"
                                : "お客様"}
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
                      ))
                    )}
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
