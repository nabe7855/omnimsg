// lib/db/broadcast.ts
import { supabase } from "@/lib/supabaseClient";
import { MessageType, Profile } from "@/lib/types";

// キャストと、そのキャストに紐づくユーザーのセット
export type CastGroup = {
  cast: Profile;
  users: Profile[];
};

export type BroadcastTargets = {
  directUsers: Profile[]; // 自分と直接繋がっているユーザー
  castGroups: CastGroup[]; // 店舗用: キャストと、その客のグループ
};

// 安全なProfile変換
const toProfile = (row: any): Profile | null => {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    role: row.role,
    name: row.name ?? "",
    display_id: row.display_id ?? "",
    avatar_url: row.avatar_url ?? "",
    store_id: row.store_id ?? null,
  };
};

// 友達IDリスト取得
const getFriendIds = async (userId: string): Promise<string[]> => {
  const { data } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (!data) return [];
  return data.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );
};

// 一斉送信のターゲット一覧を取得
export const getBroadcastTargets = async (
  currentUser: Profile
): Promise<BroadcastTargets> => {
  const result: BroadcastTargets = {
    directUsers: [],
    castGroups: [],
  };

  // 1. 自分の直接の友達を取得
  const myFriendIds = await getFriendIds(currentUser.id);
  if (myFriendIds.length > 0) {
    const { data: friends } = await supabase
      .from("profiles")
      .select("*")
      .in("id", myFriendIds)
      .eq("role", "user"); // 基本はユーザー（客）のみ対象

    if (friends)
      result.directUsers = friends
        .map(toProfile)
        .filter((p): p is Profile => p !== null);
  }

  // 2. 店舗の場合、配下のキャストとその客を取得
  if (currentUser.role === "store") {
    // 配下のキャストを取得
    const { data: casts } = await supabase
      .from("profiles")
      .select("*")
      .eq("store_id", currentUser.id)
      .eq("role", "cast");

    if (casts) {
      const castProfiles = casts
        .map(toProfile)
        .filter((p): p is Profile => p !== null);

      for (const cast of castProfiles) {
        // キャストの友達（客）を取得
        const friendIds = await getFriendIds(cast.id);
        let users: Profile[] = [];

        if (friendIds.length > 0) {
          const { data: userRows } = await supabase
            .from("profiles")
            .select("*")
            .in("id", friendIds)
            .eq("role", "user");

          if (userRows) {
            users = userRows
              .map(toProfile)
              .filter((p): p is Profile => p !== null);
          }
        }
        result.castGroups.push({ cast, users });
      }
    }
  }

  return result;
};

// ------------------------------------------
// 送信処理（DMルーム確保とメッセージ送信）
// ------------------------------------------

export const sendBroadcastMessage = async (
  senderId: string,
  targetIds: string[],
  text: string,
  imageUrl?: string,
  linkUrl?: string // ★追加: 画像のリンク先URL
): Promise<number> => {
  let successCount = 0;

  // ループで送信
  for (const targetId of targetIds) {
    try {
      let roomId = "";

      // 1. 既存のDMルームを探す (RPCを使用)
      const { data: existingRoomId, error: rpcError } = await supabase.rpc(
        "get_dm_room_id",
        {
          user1_id: senderId,
          user2_id: targetId,
        }
      );

      if (!rpcError && existingRoomId) {
        roomId = existingRoomId;
      }

      // ルームがなければ新規作成
      if (!roomId) {
        const { data: newRoom, error: roomError } = await supabase
          .from("rooms")
          .insert({ type: "dm" })
          .select()
          .single();

        if (roomError || !newRoom) continue; // 失敗したらスキップ
        roomId = newRoom.id;

        // メンバー追加
        await supabase.from("room_members").insert([
          { room_id: roomId, profile_id: senderId },
          { room_id: roomId, profile_id: targetId },
        ]);
      }

      // 2. メッセージ送信
      const messagesToInsert = [];

      // 画像があれば先に画像メッセージ
      if (imageUrl) {
        messagesToInsert.push({
          room_id: roomId,
          sender_id: senderId,
          content: imageUrl,
          message_type: MessageType.IMAGE,
          link_url: linkUrl || null, // ★追加: リンクURLをDBに保存
        });
      }

      // テキストがあればテキストメッセージ
      if (text) {
        messagesToInsert.push({
          room_id: roomId,
          sender_id: senderId,
          content: text,
          message_type: MessageType.TEXT,
        });
      }

      if (messagesToInsert.length > 0) {
        const { error: msgError } = await supabase
          .from("messages")
          .insert(messagesToInsert);

        if (!msgError) {
          // ルーム更新日時を更新
          await supabase
            .from("rooms")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", roomId);
          successCount++;
        }
      }
    } catch (e) {
      console.error(`Failed to send to ${targetId}`, e);
    }
  }

  return successCount;
};

// ------------------------------------------
// 予約送信処理
// ------------------------------------------

export const scheduleBroadcastMessage = async (
  senderId: string,
  targetUserIds: string[],
  text: string,
  imageUrl: string,
  linkUrl: string,
  scheduledAt: string // ISO string
) => {
  // 1. broadcast_messages テーブルに予約としてインサート
  // (status: 'pending', scheduled_at: 設定日時)
  const { data, error } = await supabase
    .from("broadcast_messages")
    .insert({
      sender_id: senderId,
      content: text,
      image_url: imageUrl || null, // 空文字の場合はnullにする
      link_url: linkUrl || null,
      target_count: targetUserIds.length,
      status: "pending", // 未送信
      scheduled_at: scheduledAt, // 送信予定時刻
    })
    .select()
    .single();

  if (error) throw error;

  // 2. 送信対象者を broadcast_recipients テーブルに保存
  // (実際の送信時に誰に送るかを記録するため)
  const targetData = targetUserIds.map((uid) => ({
    broadcast_id: data.id,
    user_id: uid,
    status: "pending",
  }));

  const { error: targetError } = await supabase
    .from("broadcast_recipients")
    .insert(targetData);

  if (targetError) throw targetError;

  return targetUserIds.length;
};
