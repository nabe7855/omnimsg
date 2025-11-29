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
    // 1. 自店舗のキャスト一覧を取得
    const { data: castRows } = await supabase
      .from("profiles")
      .select("*")
      .eq("store_id", self.id)
      .eq("role", "cast");

    const childCasts = rowsToProfiles(castRows);

    // 2. 「店舗自身(自分)」と「所属キャスト」をまとめてホスト一覧とする
    // 先頭に自分を入れることで、UIの一番上に店舗が表示されます
    const allHosts = [self, ...childCasts];

    // 3. ホスト全員分（店舗 + キャスト）の友達を取得してマップを作る
    for (const host of allHosts) {
      // そのホストの友達IDを取得
      const friendIds = await getFriendIds(host.id);

      if (friendIds.length === 0) {
        usersByCast[host.id] = [];
        continue;
      }

      // 友達のプロフィールを取得
      const { data: userRows } = await supabase
        .from("profiles")
        .select("*")
        .in("id", friendIds)
        // 必要ならここで .eq("role", "user") としても良いが、
        // 友達であればキャスト同士でもグループに誘えるようにするなら制限なしでOK
        .eq("role", "user");

      usersByCast[host.id] = rowsToProfiles(userRows);
    }

    // UI側には `casts` という名前で渡すが、中身は 店舗+キャスト になっている
    return { casts: allHosts, usersByCast };
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
