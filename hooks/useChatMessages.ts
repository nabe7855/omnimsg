import { supabase } from "@/lib/supabaseClient";
import { Message } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

export const useChatMessages = (roomId: string, currentUser: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const lastMarkReadTimeRef = useRef<number>(0);

  useEffect(() => {
    // roomIdがない場合は何もしない
    if (!roomId) return;

    // 1. 初回読み込み
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:users(*)") // 送信者の情報も必要なら結合
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("メッセージ取得エラー:", error);
      } else if (data) {
        setMessages(data);
      }
    };
    loadMessages();

    // 2. リアルタイム購読の設定
    console.log(`📡 Realtime接続試行: Room ID = ${roomId}`);

    const channel = supabase
      .channel(`room:${roomId}`) // チャンネル名は一意であれば何でもOK
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("🔔 メッセージ受信:", payload);
          const newMsg = payload.new as Message;

          setMessages((prev) => {
            // 重複チェック: 既にIDが存在する場合は追加しない
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        // ここで接続状態を確認できます
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime接続成功: 待機中...");
        } else if (status === "CHANNEL_ERROR") {
          console.error(
            "❌ Realtime接続エラー: 権限やネットワークを確認してください"
          );
        } else if (status === "TIMED_OUT") {
          console.error("⚠️ Realtime接続タイムアウト");
        }
      });

    // クリーンアップ
    return () => {
      console.log("🧹 チャンネル切断");
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // 既読処理（変更なし）
  const markAsRead = async () => {
    if (!currentUser || !roomId) return;
    const now = Date.now();
    if (now - lastMarkReadTimeRef.current < 500) return;
    lastMarkReadTimeRef.current = now;

    try {
      const { data: roomMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("room_id", roomId)
        .neq("sender_id", currentUser.id);

      if (!roomMessages || roomMessages.length === 0) return;
      const messageIds = roomMessages.map((m) => m.id);

      const { data: myReads } = await supabase
        .from("message_reads")
        .select("message_id")
        .eq("user_id", currentUser.id)
        .in("message_id", messageIds);

      const readMessageIds = new Set(myReads?.map((r) => r.message_id));
      const unreadMessageIds = messageIds.filter(
        (id) => !readMessageIds.has(id)
      );

      if (unreadMessageIds.length === 0) return;

      const insertData = unreadMessageIds.map((msgId) => ({
        message_id: msgId,
        user_id: currentUser.id,
        read_at: new Date().toISOString(),
      }));

      await supabase.from("message_reads").upsert(insertData, {
        onConflict: "message_id, user_id",
        ignoreDuplicates: true,
      });
    } catch (e) {
      console.error("既読処理エラー:", e);
    }
  };

  const addMessage = (msg: Message) => setMessages((prev) => [...prev, msg]);
  const deleteMessage = (id: string) =>
    setMessages((prev) => prev.filter((m) => m.id !== id));

  return { messages, addMessage, deleteMessage, markAsRead };
};
