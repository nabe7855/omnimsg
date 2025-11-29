import { supabase } from "@/lib/supabaseClient";

/* ------------------------------------------------
   1) ルーム取得（ログ付き）
------------------------------------------------ */
export async function getRoomById(roomId: string) {
  console.log("== getRoomById START ==");
  console.log("roomId:", roomId);

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (error) {
    console.error("getRoomById error:", error);
    return null;
  }

  console.log("getRoomById result:", data);
  return data;
}

/* ------------------------------------------------
   2) グループ作成（RPC版に修正済み）
   ※ 事前にSupabaseで 'create_group_room' 関数を作成しておく必要があります
------------------------------------------------ */
export async function createGroupRoom(
  creatorId: string,
  name: string,
  memberIds: string[]
) {
  console.log("== createGroupRoom (RPC) START ==");
  console.log("creatorId:", creatorId);
  console.log("group_name:", name);
  console.log("selected memberIds:", memberIds);

  // ステップ1で作ったSQL関数(RPC)を呼び出します
  // これにより、RLSの無限ループエラーを回避し、かつトランザクションで安全に作成できます
  const { data, error } = await supabase.rpc("create_group_room", {
    p_creator_id: creatorId,
    p_group_name: name,
    p_member_ids: memberIds, // SQL側でcreatorIdとマージするので、ここでは選択分だけでOK
  });

  if (error) {
    console.error("❌ createGroupRoom RPC error:", error);
    // エラー詳細を投げる
    throw error;
  }

  console.log("✅ Group created successfully:", data);
  console.log("== createGroupRoom END ==");

  return data;
}

/* ------------------------------------------------
   3) グループ編集（デバッグログあり）
------------------------------------------------ */
export async function updateGroupRoom(
  roomId: string,
  name: string,
  memberIds: string[]
) {
  console.log("== updateGroupRoom START ==");
  console.log("roomId:", roomId);
  console.log("new group_name:", name);
  console.log("updated memberIds:", memberIds);

  /* --- ① rooms 更新 --- */
  const { error: roomErr } = await supabase
    .from("rooms")
    .update({
      group_name: name,
    })
    .eq("id", roomId);

  if (roomErr) {
    console.error("❌ updateGroupRoom rooms update error:", roomErr);
    throw roomErr;
  }

  console.log("rooms updated OK");

  /* --- ② メンバー削除 --- */
  // 注意: ここでもRLSエラーが出る場合は、update用にもRPCを作ることを推奨します
  const { error: deleteErr } = await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId);

  if (deleteErr) {
    console.error("❌ room_members delete error:", deleteErr);
    throw deleteErr;
  }

  console.log("room_members delete OK");

  /* --- ③ 新メンバー追加 --- */
  const rows = memberIds.map((profileId) => ({
    room_id: roomId,
    profile_id: profileId,
  }));

  console.log("insert new rows:", rows);

  const { error: addErr, data: inserted } = await supabase
    .from("room_members")
    .insert(rows)
    .select("*");

  if (addErr) {
    console.error("❌ room_members insert error:", addErr);
    throw addErr;
  }

  console.log("room_members insert OK:", inserted);
  console.log("== updateGroupRoom END ==");

  return inserted;
}
