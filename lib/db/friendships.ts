"use client";

import { supabase } from "@/lib/supabaseClient";

export type FriendshipStatus =
  | "none"
  | "pending_request"
  | "pending_received"
  | "accepted";

// --------------------------------------------------
// 1. 友達申請を送る
// --------------------------------------------------
export const sendFriendRequest = async (targetId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not logged in" };

  const { data, error } = await supabase
    .from("friendships")
    .insert({
      requester_id: user.id,
      addressee_id: targetId,
      status: "pending",
    })
    .select()
    .single();

  if (error) return { error };

  return { data };
};

// --------------------------------------------------
// 2. 友達申請を承認する
// --------------------------------------------------
export const acceptFriendRequest = async (requesterId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { data, error } = await supabase
    .from("friendships")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .match({
      requester_id: requesterId,
      addressee_id: user.id,
      status: "pending",
    })
    .select()
    .single();

  if (error) return { error };

  return { data };
};

// --------------------------------------------------
// 3. 友達削除（双方削除）
// --------------------------------------------------
export const removeFriend = async (targetId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { error } = await supabase
    .from("friendships")
    .delete()
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${user.id})`
    );

  if (error) return { error };

  return { success: true };
};

// --------------------------------------------------
// 4. 特定ユーザーとの関係ステータスを取得
// --------------------------------------------------
export const getFriendshipStatus = async (
  targetId: string
): Promise<FriendshipStatus> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "none";

  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${user.id})`
    )
    .maybeSingle();

  if (!data) return "none";

  // pending（相手に申請を出した）
  if (data.status === "pending" && data.requester_id === user.id)
    return "pending_request";

  // pending（相手から申請が来ている）
  if (data.status === "pending" && data.addressee_id === user.id)
    return "pending_received";

  // accepted
  if (data.status === "accepted") return "accepted";

  return "none";
};

// --------------------------------------------------
// 5. 友達一覧
// --------------------------------------------------
export const getFriends = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (error) return [];

  return data;
};
