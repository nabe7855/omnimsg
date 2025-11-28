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

    setList(data);
    setLoading(false);
  };

  // ================================
  // ★ 操作用関数（取り下げ / 承認 / 拒否）
  // ================================

  const cancelRequest = async (id: string) => {
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
    await supabase.from("friendships").delete().eq("id", id);
    loadList(tab);
  };

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
        ) : list.length === 0 ? (
          <div className="empty">データがありません</div>
        ) : (
          list.map((item: any) => {
            const profile = item.requester || item.addressee;
            return (
              <div key={profile.id} className="friend-item">
                <img
                  src={profile.avatar_url || "/placeholder-avatar.png"}
                  className="avatar"
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
