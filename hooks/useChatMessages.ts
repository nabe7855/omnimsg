import { supabase } from "@/lib/supabaseClient";
import { Message } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

export const useChatMessages = (roomId: string, currentUser: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const lastMarkReadTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!roomId) return;

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
          setMessages((prev) =>
            prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

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

      await supabase
        .from("message_reads")
        .upsert(insertData, {
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
