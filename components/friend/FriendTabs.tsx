"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";
import "@/styles/FriendTabs.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  currentUser: Profile;
};

type FriendStatus = "friends" | "requested" | "pending" | "blocked";

export const FriendTabs: React.FC<Props> = ({ currentUser }) => {
  const router = useRouter();
  const [tab, setTab] = useState<FriendStatus>("friends");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const profileSelect = `
    id,
    name,
    display_id,
    avatar_url,
    role,
    bio
  `;

  useEffect(() => {
    loadList(tab);
  }, [tab]);

  const loadList = async (type: FriendStatus) => {
    setLoading(true);

    const user = currentUser;
    if (!user) return;

    try {
      console.log(
        `[DEBUG-FETCH] FriendTabs.loadList(${type}) - Starting blocked list fetch`
      );
      const { data: blockedData, error: blockedError } = await supabase
        .from("connections")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("status", "blocked");

      console.log(
        `[DEBUG-FETCH] FriendTabs.loadList(${type}) - Blocked list fetch finished`,
        { count: blockedData?.length, error: blockedError }
      );

      if (blockedError) throw blockedError;

      const blockedUserIds = new Set(
        blockedData?.map((b) => b.target_id) || []
      );

      // ---------------------------------------------------------
      // 2. ブロックタブの場合の処理
      // ---------------------------------------------------------
      if (type === "blocked") {
        console.log(
          `[DEBUG-FETCH] FriendTabs.loadList(${type}) - Fetching blocked connections detailed`
        );
        const { data, error } = await supabase
          .from("connections")
          .select(
            `
            id,
            status,
            target_profile:target_id (${profileSelect})
          `
          )
          .eq("user_id", user.id)
          .eq("status", "blocked");

        console.log(
          `[DEBUG-FETCH] FriendTabs.loadList(${type}) - Blocked connections finished`,
          { count: data?.length, error }
        );
        if (error) throw error;

        const formatted = (data || [])
          .map((row: any) => ({
            id: row.id,
            displayProfile: row.target_profile,
            isBlockData: true,
          }))
          .filter((item) => item.displayProfile !== null);

        setList(formatted);
        setLoading(false);
        return;
      }

      // ---------------------------------------------------------
      // 3. その他のタブ (friendships) の処理
      // ---------------------------------------------------------
      console.log(
        `[DEBUG-FETCH] FriendTabs.loadList(${type}) - Starting main query`
      );
      let query;

      /** 友だち（accepted） */
      if (type === "friends") {
        query = supabase
          .from("friendships")
          .select(
            `
            id,
            status,
            requester:profiles!friendships_requester_id_fkey(${profileSelect}),
            addressee:profiles!friendships_addressee_id_fkey(${profileSelect})
          `
          )
          .eq("status", "accepted")
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      }

      /** 自分 → 相手（requested） */
      if (type === "requested") {
        query = supabase
          .from("friendships")
          .select(
            `
            id,
            status,
            addressee:profiles!friendships_addressee_id_fkey(${profileSelect})
          `
          )
          .eq("requester_id", user.id)
          .eq("status", "pending");
      }

      /** 相手 → 自分（pending） */
      if (type === "pending") {
        query = supabase
          .from("friendships")
          .select(
            `
            id,
            status,
            requester:profiles!friendships_requester_id_fkey(${profileSelect})
          `
          )
          .eq("addressee_id", user.id)
          .eq("status", "pending");
      }

      const { data, error } = await query!;
      console.log(
        `[DEBUG-FETCH] FriendTabs.loadList(${type}) - Main query finished`,
        { count: data?.length, error }
      );
      if (error) throw error;

      // データ整形 & ブロック済みユーザーの除外
      const formatted = (data || [])
        .map((item: any) => {
          // パートナー特定
          let partner = null;
          if (item.requester && item.addressee) {
            partner =
              item.requester.id === currentUser.id
                ? item.addressee
                : item.requester;
          } else {
            partner = item.requester || item.addressee;
          }

          // ★追加: ブロック済みの相手なら null を返して後でフィルタリングする
          if (partner && blockedUserIds.has(partner.id)) {
            return null;
          }

          return {
            ...item,
            displayProfile: partner,
            isBlockData: false,
          };
        })
        .filter((item: any) => item !== null); // nullを除外

      setList(formatted);
    } catch (e) {
      console.error("❌ load error:", e);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // 操作用関数
  // ================================

  const cancelRequest = async (id: string) => {
    if (!window.confirm("申請を取り下げますか？")) return;
    await supabase.from("friendships").delete().eq("id", id);
    loadList(tab);
  };

  const acceptRequest = async (id: string) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", id);
    loadList(tab);
  };

  const rejectRequest = async (id: string) => {
    if (!window.confirm("拒否しますか？")) return;
    await supabase.from("friendships").delete().eq("id", id);
    loadList(tab);
  };

  const unblockUser = async (connectionId: string, name: string) => {
    if (!window.confirm(`${name}さんのブロックを解除しますか？`)) return;
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId);

    if (error) {
      alert("解除に失敗しました");
      console.error(error);
    } else {
      alert("ブロックを解除しました");
      setList((prev) => prev.filter((item) => item.id !== connectionId));
    }
  };

  const handleGoToProfile = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  // ================================
  // 重複排除 (念のため)
  // ================================
  const uniqueList = Array.from(
    new Map(
      list.map((item) => {
        const profile = item.displayProfile;
        const key = profile ? profile.id : item.id;
        return [key, item];
      })
    ).values()
  );

  return (
    <div className="tab-wrapper">
      {/* タブ固定 */}
      <div className="tab-container">
        {[
          { key: "friends", label: "友だち" },
          { key: "requested", label: "申請中" },
          { key: "pending", label: "申請されてる" },
          { key: "blocked", label: "ブロック" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as FriendStatus)}
            className={`tab ${tab === t.key ? "active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* リスト */}
      <div className="tab-content">
        {loading ? (
          <div className="empty">読み込み中...</div>
        ) : uniqueList.length === 0 ? (
          <div className="empty">データがありません</div>
        ) : (
          uniqueList.map((item: any) => {
            const profile = item.displayProfile;
            if (!profile) return null;

            return (
              <div key={item.id} className="friend-item">
                <img
                  src={profile.avatar_url || "/placeholder-avatar.png"}
                  className="avatar"
                  alt="avatar"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).src =
                      "/placeholder-avatar.png")
                  }
                  onClick={() => handleGoToProfile(profile.id)}
                  style={{ cursor: "pointer" }}
                />
                <div className="user-info">
                  <strong>{profile.name}</strong>
                  <span>ID: {profile.display_id}</span>
                </div>

                {/* ▼▼ タブごとにボタンを出し分け ▼▼ */}

                {tab === "requested" && (
                  <button
                    className="btn-cancel"
                    onClick={() => cancelRequest(item.id)}
                  >
                    取り下げ
                  </button>
                )}

                {tab === "pending" && (
                  <div className="pending-actions">
                    <button
                      className="btn-accept"
                      onClick={() => acceptRequest(item.id)}
                    >
                      承認
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => rejectRequest(item.id)}
                    >
                      拒否
                    </button>
                  </div>
                )}

                {tab === "blocked" && (
                  <button
                    className="btn-cancel"
                    style={{ color: "red", borderColor: "red" }}
                    onClick={() => unblockUser(item.id, profile.name)}
                  >
                    解除
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
