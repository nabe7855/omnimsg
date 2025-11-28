"use client";

import { supabase } from "@/lib/supabaseClient";

// ==============================
// 型
// ==============================
export interface InsertConnection {
  user_id: string;
  target_id: string;
}

export interface ConnectionRecord {
  id: string;
  user_id: string;
  target_id: string;
  created_at: string;
}

// ==============================
// 1. つながりを作成する（友達申請なしの即時承認型）
// ==============================
export const addConnection = async (targetId: string) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("❌ addConnection: ログイン情報取得失敗", authError);
    return { error: "ログインしていません" };
  }

  const { data, error } = await supabase
    .from("connections")
    .insert([
      {
        user_id: user.id,
        target_id: targetId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("❌ addConnection エラー:", error);
    return { error };
  }

  return { data };
};

// ==============================
// 2. つながりを削除
// ==============================
export const removeConnection = async (targetId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "ログインしていません" };

  const { error } = await supabase
    .from("connections")
    .delete()
    .match({ user_id: user.id, target_id: targetId });

  if (error) {
    console.error("❌ removeConnection エラー:", error);
    return { error };
  }

  return { success: true };
};

// ==============================
// 3. 自分がつながっているユーザー一覧
// ==============================
export const getMyConnections = async (): Promise<ConnectionRecord[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ getMyConnections エラー:", error);
    return [];
  }

  return data as ConnectionRecord[];
};

// ==============================
// 4. 「このターゲットとつながっているか」チェック
// ==============================
export const isConnectedWith = async (targetId: string): Promise<boolean> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from("connections")
    .select("id")
    .match({ user_id: user.id, target_id: targetId })
    .maybeSingle();

  if (error) {
    console.error("❌ isConnectedWith エラー:", error);
    return false;
  }

  return !!data;
};

// ==============================
// 5. 相互フォロー（お互いに登録）しているか？
// ==============================
export const isMutualConnection = async (
  targetId: string
): Promise<boolean> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from("connections")
    .select("id")
    .or(
      `and(user_id.eq.${user.id},target_id.eq.${targetId}),and(user_id.eq.${targetId},target_id.eq.${user.id})`
    );

  if (error) {
    console.error("❌ isMutualConnection エラー:", error);
    return false;
  }

  return data.length === 2; // 双方向で2レコードある
};
