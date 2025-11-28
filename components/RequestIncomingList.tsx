"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";
import { useEffect, useState } from "react";

export const RequestIncomingList = () => {
  const [list, setList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncomingRequests();
  }, []);

  const loadIncomingRequests = async () => {
    setLoading(true);

    // 現在ログイン中のユーザー
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setList([]);
      setLoading(false);
      return;
    }

    // ==========================================
    // ★ target_id = 自分、status = pending
    // → user_id 側のプロフィールを JOIN
    // ==========================================
    const { data, error } = await supabase
      .from("connections")
      .select(
        `
        id,
        status,
        requester_profile:user_id (
          id,
          name,
          display_id,
          role,
          avatar_url
        )
        `
      )
      .eq("target_id", user.id)
      .eq("status", "pending");

    if (error) {
      console.error("RequestIncomingList error:", error);
      setLoading(false);
      return;
    }

    // requester_profile のみ抽出
    const mapped: Profile[] = data
      .map((row: any) => row.requester_profile)
      .filter(Boolean);

    setList(mapped);
    setLoading(false);
  };

  if (loading) return <p>読み込み中...</p>;
  if (list.length === 0) return <p>申請されているユーザーはいません</p>;

  return (
    <div>
      {list.map((u) => (
        <div
          key={u.id}
          className="user-card flex items-center gap-3 p-2 border-b"
        >
          <img
            src={u.avatar_url || "/placeholder-avatar.png"}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <div className="font-bold">{u.name}</div>
            <div className="text-sm text-gray-500">ID: {u.display_id}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
