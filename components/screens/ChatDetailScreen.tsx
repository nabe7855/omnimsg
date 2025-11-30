"use client";

import { supabase } from "@/lib/supabaseClient";
import { Message, MessageType, UserRole } from "@/lib/types";
import { ChatDetailProps } from "@/lib/types/screen";
import imageCompression from "browser-image-compression";
import React, { useState } from "react";

// Custom Hooks
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatRoom } from "@/hooks/useChatRoom";

// UI Components
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MemberModal } from "@/components/chat/MemberModal";
import { MessageList } from "@/components/chat/MessageList";
import { RichMenu } from "@/components/RichMenu";

export const ChatDetailScreen: React.FC<ChatDetailProps> = ({
  currentUser,
  roomId,
  navigate,
}) => {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const {
    currentRoom,
    memberProfiles,
    isLoading,
    addMember,
    removeMember,
    fetchAddCandidates,
    addCandidates,
    isLoadingCandidates,
  } = useChatRoom(roomId, currentUser, navigate);

  const { messages, addMessage, deleteMessage, markAsRead } = useChatMessages(
    roomId,
    currentUser
  );

  const { isRecording, startRecording, stopRecording, cancelRecording } =
    useAudioRecorder(roomId, currentUser, addMessage);

  const handleSendMessage = async (text: string) => {
    try {
      const { data, error } = await supabase
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
      if (data) addMessage(data);
      await supabase
        .from("rooms")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", roomId);
    } catch (e) {
      console.error("送信エラー", e);
    }
  };

  const handleSendImage = async (file: File) => {
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      const fileExt = file.name.split(".").pop();
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
      if (insertedMsg) addMessage(insertedMsg);
      await supabase
        .from("rooms")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", roomId);
    } catch (e) {
      console.error("画像送信エラー", e);
      alert("画像送信失敗");
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!window.confirm("送信を取り消しますか？")) return;
    try {
      if (
        (message.message_type === MessageType.IMAGE ||
          message.message_type === MessageType.AUDIO) &&
        message.content
      ) {
        const urlParts = message.content.split("/chat-images/");
        if (urlParts.length > 1)
          await supabase.storage.from("chat-images").remove([urlParts[1]]);
      }
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", message.id);
      if (error) throw error;
      deleteMessage(message.id);
    } catch (e) {
      console.error("削除エラー", e);
    }
  };

  const handleHeaderClick = () => {
    if (currentRoom?.type === "group") setIsMemberModalOpen(true);
    else if (currentRoom?.type === "dm" && currentRoom.partner)
      navigate(`/users/${currentRoom.partner.id}`);
  };

  if (!currentUser) return null;
  if (isLoading || !currentRoom)
    return <div className="chat-loading">読み込み中...</div>;

  // 店舗チャットかつ相手が存在する場合の判定
  const isStoreChat =
    currentRoom.type === "dm" &&
    currentRoom.partner &&
    currentUser.role === UserRole.USER &&
    currentRoom.partner.role === UserRole.STORE;

  // リッチメニューを表示するかどうかのフラグ
  const showRichMenu = !!(isStoreChat && currentRoom.partner);

  return (
    <div className="chat-screen" style={{ position: "relative" }}>
      <ChatHeader room={currentRoom} onClick={handleHeaderClick} />

      <MessageList
        messages={messages}
        currentUser={currentUser}
        memberProfiles={memberProfiles}
        isGroup={currentRoom.type === "group"}
        onScrollToBottom={markAsRead}
        onDeleteMessage={handleDeleteMessage}
        // ★ここを追加：リッチメニューの有無を渡す
        hasRichMenu={showRichMenu}
      />

      {showRichMenu && (
        <RichMenu
          storeId={currentRoom.partner!.id}
          onSend={handleSendMessage}
        />
      )}

      <ChatInput
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onCancelRecording={cancelRecording}
        onSendMessage={handleSendMessage}
        onSendImage={handleSendImage}
      />

      {isMemberModalOpen && (
        <MemberModal
          currentUser={currentUser}
          currentMembers={memberProfiles}
          onClose={() => setIsMemberModalOpen(false)}
          onAddMember={addMember}
          onRemoveMember={removeMember}
          fetchAddCandidates={fetchAddCandidates}
          addCandidates={addCandidates}
          isLoadingCandidates={isLoadingCandidates}
        />
      )}
    </div>
  );
};
