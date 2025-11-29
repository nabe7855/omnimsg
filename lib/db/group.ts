import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";

// --------------------------------------
// Profile 型への安全変換
// --------------------------------------
function toProfile(row: any): Profile | null {
  if (!row || !row.id) return null;

  return {
    id: row.id,
    role: row.role,
    name: row.name ?? "",
    display_id: row.display_id ?? "",
    avatar_url: row.avatar_url ?? "",
    store_id: row.store_id ?? null,
  };
}

/**
 * row[] → Profile[]（null排除）
 */
function rowsToProfiles(rows: any[] | null): Profile[] {
  if (!rows) return [];
  return rows.map(toProfile).filter((p): p is Profile => p !== null);
}

/**
 * 指定ユーザーの友達ID一覧を取得
 */
async function getFriendIds(userId: string): Promise<string[]> {
  const { data: rows } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq("status", "accepted");

  if (!rows) return [];

  return rows.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );
}

// ===================================================================
// メイン関数
// ===================================================================
export async function getConnectablePeople(userId: string): Promise<{
  casts: Profile[];
  usersByCast: Record<string, Profile[]>;
}> {
  // 自分のプロフィールを取得
  const { data: selfRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const self = toProfile(selfRow);
  if (!self) return { casts: [], usersByCast: {} };

  let casts: Profile[] = [];
  let usersByCast: Record<string, Profile[]> = {};

  // ===================================
  // 店舗アカウント（store）
  // ===================================
  if (self.role === "store") {
    // 自店舗のキャスト一覧
    const { data: castRows } = await supabase
      .from("profiles")
      .select("*")
      .eq("store_id", self.id)
      .eq("role", "cast");

    casts = rowsToProfiles(castRows);

    for (const cast of casts) {
      // キャストの友達ID
      const friendIds = await getFriendIds(cast.id);

      if (friendIds.length === 0) {
        usersByCast[cast.id] = [];
        continue;
      }

      // 友達プロフィール
      const { data: userRows } = await supabase
        .from("profiles")
        .select("*")
        .in("id", friendIds)
        .eq("role", "user");

      usersByCast[cast.id] = rowsToProfiles(userRows);
    }

    return { casts, usersByCast };
  }

  // ===================================
  // キャストアカウント（cast）
  // ===================================
  if (self.role === "cast") {
    const friendIds = await getFriendIds(self.id);

    const { data: userRows } = await supabase
      .from("profiles")
      .select("*")
      .in("id", friendIds)
      .eq("role", "user");

    casts = [self]; // 自分だけ
    usersByCast[self.id] = rowsToProfiles(userRows);

    return { casts, usersByCast };
  }

  // ===================================
  // 一般ユーザー（user）
  // ===================================
  if (self.role === "user") {
    const friendIds = await getFriendIds(self.id);

    // 友達の中で「キャストだけ」を取得
    const { data: castRows } = await supabase
      .from("profiles")
      .select("*")
      .in("id", friendIds)
      .eq("role", "cast");

    casts = rowsToProfiles(castRows);

    return { casts, usersByCast: {} };
  }

  return { casts: [], usersByCast: {} };
}
