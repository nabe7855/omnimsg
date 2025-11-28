"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";
import { useEffect, useState } from "react";
import "@/styles/RequestOutgoingList.css"; // ★追加

export const RequestOutgoingList = () => {
  const [list, setList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOutgoing();
  }, []);

  const loadOutgoing = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setList([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("connections")
      .select(
        `
        id,
        status,
        target_profile:target_id (
          id,
          name,
          display_id,
          role,
          avatar_url
        )
        `
      )
      .eq("user_id", user.id)
      .eq("status", "requested");

    if (error) {
      console.error("RequestOutgoingList error:", error);
      setLoading(false);
      return;
    }

    const mapped: Profile[] = data
      .map((row: any) => row.target_profile)
      .filter(Boolean);

    setList(mapped);
    setLoading(false);
  };

  if (loading) return <p className="outgoing-loading">読み込み中...</p>;
  if (list.length === 0)
    return <p className="outgoing-empty">現在の申請はありません</p>;

  return (
    <div className="outgoing-list">
      {list.map((u) => (
        <div key={u.id} className="user-card">
          <img
            src={u.avatar_url || "/placeholder-avatar.png"}
            className="avatar"
          />
          <div className="user-info">
            <div className="name">{u.name}</div>
            <div className="display-id">ID: {u.display_id}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
