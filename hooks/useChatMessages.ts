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
      // ★注意: テーブル名が 'profiles' の場合は 'sender:profiles(*)' に変更してください
      // ここでは元のコード通り 'users' としていますが、DBに合わせてください。
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:profiles(*)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("メッセージ取得エラー:", error);
      } else if (data) {
        setMessages(data as Message[]);
      }
    };
    loadMessages();

    // 2. リアルタイム購読の設定
    console.log(`📡 Realtime接続試行: Room ID = ${roomId}`);

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
        async (payload) => {
          console.log("🔔 メッセージ受信(Raw):", payload);
          const newMessageId = payload.new.id;

          // ★重要修正: payload.newには sender 情報がないため、
          // IDを使って改めて「送信者情報付き」でデータを1件取得する
          const { data: fullMessage, error } = await supabase
            .from("messages")
            .select("*, sender:profiles(*)") // ★ここもテーブル名に注意
            .eq("id", newMessageId)
            .single();

          if (error || !fullMessage) {
            console.error("リアルタイム受信後の再取得失敗:", error);
            return;
          }

          setMessages((prev) => {
            // 重複チェック
            if (prev.some((m) => m.id === fullMessage.id)) {
              return prev;
            }
            return [...prev, fullMessage as Message];
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime接続成功");
        }
      });

    // クリーンアップ
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // 既読処理
  const markAsRead = async () => {
    if (!currentUser || !roomId) return;
    const now = Date.now();
    // 連打防止（500ms）
    if (now - lastMarkReadTimeRef.current < 500) return;
    lastMarkReadTimeRef.current = now;

    try {
      // 1. 自分以外の未読メッセージがあるか確認
      // (最適化: 既に既読テーブルにあるものは除外するロジックはDB側でやりたいが、
      //  Supabaseのシンプルなクエリだと難しいので現状のロジックを維持)

      const { data: roomMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("room_id", roomId)
        .neq("sender_id", currentUser.id);

      if (!roomMessages || roomMessages.length === 0) return;

      const messageIds = roomMessages.map((m) => m.id);

      // 2. 自分が既に既読にしたIDを取得
      const { data: myReads } = await supabase
        .from("message_reads")
        .select("message_id")
        .eq("user_id", currentUser.id)
        .in("message_id", messageIds);

      const readMessageIds = new Set(myReads?.map((r) => r.message_id));

      // 3. まだ既読にしていないIDだけを抽出
      const unreadMessageIds = messageIds.filter(
        (id) => !readMessageIds.has(id)
      );

      if (unreadMessageIds.length === 0) return;

      // 4. まとめて既読を入れる
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
