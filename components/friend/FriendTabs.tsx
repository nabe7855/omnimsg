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
  const [list, setList] = useState<Profile[]>([]);
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

    /** 友だち（accepted：両方向） */
    if (type === "friends") {
      query = supabase
        .from("friendships")
        .select(
          `
          id,
          status,
          requester:profiles!friendships_requester_id_fkey (${profileSelect}),
          addressee:profiles!friendships_addressee_id_fkey (${profileSelect})
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
          addressee:profiles!friendships_addressee_id_fkey (${profileSelect})
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
          requester:profiles!friendships_requester_id_fkey (${profileSelect})
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
          addressee:profiles!friendships_addressee_id_fkey (${profileSelect})
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

    const mapped = data
      .map((d: any) => d.addressee || d.requester || null)
      .filter(Boolean);

    setList(mapped);
    setLoading(false);
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
          list.map((p) => (
            <div key={p.id} className="friend-item">
              <img
                src={p.avatar_url || "/placeholder-avatar.png"}
                className="avatar"
              />
              <div className="user-info">
                <strong>{p.name}</strong>
                <span>ID: {p.display_id}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
