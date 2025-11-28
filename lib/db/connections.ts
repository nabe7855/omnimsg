"use client";

import { supabase } from "@/lib/supabaseClient";

/* ==============================
   型
============================== */
export interface ConnectionRecord {
  id: string;
  user_id: string;
  target_id: string;
  status: "requested" | "pending" | "accepted" | "blocked";
  created_at: string;
}

/* ==============================
   共通: statusで取得
============================== */
const fetchConnectionsByStatus = async (status: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ fetchConnectionsByStatus エラー:", error);
    return [];
  }

  return data as ConnectionRecord[];
};

/* ==============================
   リスト取得
============================== */
export const getFriends = () => fetchConnectionsByStatus("accepted");           // 友達
export const getOutgoingRequests = () => fetchConnectionsByStatus("requested"); // 申請してる
export const getIncomingRequests = () => fetchConnectionsByStatus("pending");   // 申請されてる
export const getBlockedUsers = () => fetchConnectionsByStatus("blocked");       // ブロック中

/* ==============================
   1. 友達申請を送る（requested で作成）
============================== */
export const sendFriendRequest = async (targetId: string) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "ログインしていません" };

  const { data, error } = await supabase
    .from("connections")
    .insert([
      {
        user_id: user.id,
        target_id: targetId,
        status: "requested", // 自分が送った申請
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("❌ sendFriendRequest エラー:", error);
    return { error };
  }

  return { data };
};

/* ==============================
   2. 申請を承認（pending → accepted）
============================== */
export const acceptFriendRequest = async (fromUserId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "ログインしていません" };

  /**  
   * 申請レコード（相手 → 自分）を accepted に更新
   */
  const { error } = await supabase
    .from("connections")
    .update({ status: "accepted" })
    .match({
      user_id: fromUserId,
      target_id: user.id,
      status: "pending",
    });

  if (error) {
    console.error("❌ acceptFriendRequest エラー:", error);
    return { error };
  }

  /**  
   * 自分側のレコードも accepted に作成（なければ）
   */
  await supabase
    .from("connections")
    .upsert({
      user_id: user.id,
      target_id: fromUserId,
      status: "accepted",
    });

  return { success: true };
};

/* ==============================
   3. 申請を拒否（削除）
============================== */
export const denyFriendRequest = async (fromUserId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "ログインしていません" };

  const { error } = await supabase
    .from("connections")
    .delete()
    .match({
      user_id: fromUserId,
      target_id: user.id,
      status: "pending",
    });

  if (error) {
    console.error("❌ denyFriendRequest エラー:", error);
    return { error };
  }

  return { success: true };
};

/* ==============================
   4. ブロック（常に一方方向）
============================== */
export const blockUser = async (targetId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "ログインしていません" };

  // 自分 → 相手 のレコードを blocked に変更
  const { error } = await supabase
    .from("connections")
    .upsert({
      user_id: user.id,
      target_id: targetId,
      status: "blocked",
    });

  if (error) {
    console.error("❌ blockUser エラー:", error);
    return { error };
  }

  return { success: true };
};

/* ==============================
   5. つながっている？（任意の状態）
============================== */
export const getConnectionStatus = async (
  targetId: string
): Promise<ConnectionRecord | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .match({ user_id: user.id, target_id: targetId })
    .maybeSingle();

  if (error) {
    console.error("❌ getConnectionStatus エラー:", error);
    return null;
  }

  return data as ConnectionRecord | null;
};

/* ==============================
   6. 友達（accepted）か？
============================== */
export const isFriend = async (targetId: string): Promise<boolean> => {
  const record = await getConnectionStatus(targetId);
  return record?.status === "accepted";
};
