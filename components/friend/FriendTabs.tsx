"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";
import "@/styles/FriendTabs.css";
import { useEffect, useState } from "react";

type Props = {
  currentUser: Profile;
};

type FriendStatus = "friends" | "requested" | "pending" | "blocked";

export const FriendTabs: React.FC<Props> = ({ currentUser }) => {
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

    /** ブロック（自分がブロックした） */
    if (type === "blocked") {
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
        .eq("status", "blocked");
    }

    const { data, error } = await query!;
    if (error) {
      console.error("❌ load error:", error);
      setLoading(false);
      return;
    }

    setList(data || []);
    setLoading(false);
  };

  // ================================
  // ★ 操作用関数（取り下げ / 承認 / 拒否）
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

  // ================================
  // ★ 表示するパートナーを特定するヘルパー関数
  // ================================
  const getPartnerProfile = (item: any) => {
    // データ構造によって相手が requester 側か addressee 側か変わるため判定
    // 両方ある場合（friendsタブ）は、自分じゃない方を返す
    if (item.requester && item.addressee) {
      return item.requester.id === currentUser.id
        ? item.addressee
        : item.requester;
    }
    // 片方しかない場合（申請中など）はある方を返す
    return item.requester || item.addressee;
  };

  // ================================
  // ★ 重複排除処理（ここが重要）
  // ================================
  // プロフィールIDをキーにして重複を取り除く
  const uniqueList = Array.from(
    new Map(
      list.map((item) => {
        const profile = getPartnerProfile(item);
        // 万が一 profile がない場合は item.id (friendship id) を使う
        const key = profile ? profile.id : item.id;
        return [key, { ...item, displayProfile: profile }];
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
            // 上で計算済みのプロフィールを使用
            const profile = item.displayProfile;

            // 万が一プロフィールが取得できなかった場合のガード
            if (!profile) return null;

            return (
              <div key={profile.id} className="friend-item">
                <img
                  src={profile.avatar_url || "/placeholder-avatar.png"}
                  className="avatar"
                  alt="avatar"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).src =
                      "/placeholder-avatar.png")
                  }
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
